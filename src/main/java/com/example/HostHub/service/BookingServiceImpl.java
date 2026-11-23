package com.example.HostHub.service;

import com.example.HostHub.Enum.BookingStatus;
import com.example.HostHub.dto.BookingDto;
import com.example.HostHub.dto.BookingRequest;
import com.example.HostHub.dto.GuestDto;
import com.example.HostHub.dto.HotelReportDto;
import com.example.HostHub.entity.*;
import com.example.HostHub.exception.ResourseNotFoundException;
import com.example.HostHub.exception.UnAuthorisedException;
import com.example.HostHub.repository.*;
import com.example.HostHub.strategy.PricingService;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.param.RefundCreateParams;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import static com.example.HostHub.util.AppUtils.getCurrentUser;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {
    private final BookingRepository bookingRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final InventoryRepository inventoryRepository;
    private final GuestRepository guestRepository;
    private final ModelMapper modelMapper;
    private final CheckoutService checkoutService;
    private final PricingService pricingService;
    private final ProcessedWebhookEventRepository processedWebhookEventRepository;
    private final EmailNotificationService emailNotificationService;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Override
    @Transactional
    public BookingDto initialiseBooking(BookingRequest bookingRequest) {
        return initialiseBooking(bookingRequest, null);
    }

    @Override
    @Transactional
    public BookingDto initialiseBooking(BookingRequest bookingRequest, String idempotencyKey) {
        log.info("Initialising booking for hotel : {}, room: {}, date {}-{}, idempotencyKey: {}",
                bookingRequest.getHotelId(), bookingRequest.getRoomId(),
                bookingRequest.getCheckInDate(), bookingRequest.getCheckOutDate(), idempotencyKey);

        User currentUser = getCurrentUser();

        // Idempotency check: return existing booking if key was already submitted by this user
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existingOpt = bookingRepository.findByIdempotencyKey(idempotencyKey);
            if (existingOpt.isPresent()) {
                Booking existing = existingOpt.get();
                if (existing.getUser() != null && existing.getUser().getId().equals(currentUser.getId())) {
                    log.info("Idempotent request hit for key {}. Returning existing booking ID: {}", idempotencyKey, existing.getId());
                    return modelMapper.map(existing, BookingDto.class);
                } else {
                    throw new UnAuthorisedException("Idempotency key belongs to another user");
                }
            }
        }

        Hotel hotel = hotelRepository.findById(bookingRequest.getHotelId()).orElseThrow(() ->
                new ResourseNotFoundException("Hotel not found with id: " + bookingRequest.getHotelId()));

        Room room = roomRepository.findById(bookingRequest.getRoomId()).orElseThrow(() ->
                new ResourseNotFoundException("Room not found with this id : " + bookingRequest.getRoomId()));

        LocalDate actualEndDate = bookingRequest.getCheckOutDate().minusDays(1);

        List<Inventory> inventoryList = inventoryRepository.findAndLockAvailableInventory(
                room.getId(),
                bookingRequest.getCheckInDate(),
                actualEndDate,
                bookingRequest.getRoomCount()
        );

        long daysCount = ChronoUnit.DAYS.between(bookingRequest.getCheckInDate(), bookingRequest.getCheckOutDate());

        if (inventoryList.size() != daysCount) {
            throw new IllegalArgumentException("Room is not available anymore");
        }

        // Reserve the room / update the booking count of inventories
        inventoryRepository.initBooking(room.getId(), bookingRequest.getCheckInDate(),
                actualEndDate, bookingRequest.getRoomCount());

        // CALCULATE DYNAMIC AMOUNT
        BigDecimal priceForOneRoom = pricingService.calculateTotalPrice(inventoryList);
        BigDecimal totalPrice = priceForOneRoom.multiply(BigDecimal.valueOf(bookingRequest.getRoomCount()));

        Booking booking = Booking.builder()
                .bookingStatus(BookingStatus.RESERVED)
                .hotel(hotel)
                .room(room)
                .checkInDate(bookingRequest.getCheckInDate())
                .checkOutDate(bookingRequest.getCheckOutDate())
                .user(currentUser)
                .roomsCount(bookingRequest.getRoomCount())
                .amount(totalPrice)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .idempotencyKey(idempotencyKey)
                .build();

        booking = bookingRepository.save(booking);

        return modelMapper.map(booking, BookingDto.class);
    }

    @Override
    @Transactional
    public BookingDto addGuests(Long bookingId, List<GuestDto> guestDtoList) {
        log.info("Adding guests for booking with id: {}", bookingId);

        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() ->
                new ResourseNotFoundException("Booking not found with this id: " + bookingId));

        User user = getCurrentUser();

        // 🔥 FIXED: Objects ke badle Primary Key IDs compare karein taaki Hibernate lazy proxy object structure break na ho
        if (booking.getUser() == null || !user.getId().equals(booking.getUser().getId())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id : " + user.getId());
        }

        if (hasBookingExpired(booking)) {
            throw new IllegalArgumentException("Booking has already expired");
        }

        if (booking.getBookingStatus() != BookingStatus.RESERVED) {
            throw new IllegalArgumentException("Booking is not under reserved state, cannot add guests");
        }

        for (GuestDto guestDto : guestDtoList) {
            Guest guest = modelMapper.map(guestDto, Guest.class);
            guest.setUser(user);
            guest = guestRepository.save(guest);
            booking.getGuests().add(guest);
        }

        booking.setBookingStatus(BookingStatus.GUESTS_ADDED);
        booking = bookingRepository.save(booking);
        return modelMapper.map(booking, BookingDto.class);
    }

    @Override
    @Transactional
    public String initiatePayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() ->
                new ResourseNotFoundException("Booking not found with id : " + bookingId));
        User user = getCurrentUser();


        if (booking.getUser() == null || !user.getId().equals(booking.getUser().getId())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id : " + user.getId());
        }

        if (hasBookingExpired(booking)) {
            throw new IllegalArgumentException("Booking has already expired");
        }

        // ✅ FIX 1: Sirf GUESTS_ADDED status wali booking ka payment ho sakta hai
        if (booking.getBookingStatus() != BookingStatus.GUESTS_ADDED) {
            throw new IllegalArgumentException(
                    "Cannot initiate payment. Booking must be in GUESTS_ADDED state. Current status: "
                            + booking.getBookingStatus());
        }

        String sessionUrl = checkoutService.getCheckOutSession(booking,
                frontendUrl+"/payments/success",frontendUrl+"/payments/failure");

        booking.setBookingStatus(BookingStatus.PAYMENT_PENDING);
        bookingRepository.save(booking);

        return sessionUrl;

    }


//@Override
//@Transactional
//public void capturePayment(Event event) {
//    if ("checkout.session.completed".equals(event.getType())) {
//        Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
//        if (session == null) return;
//
//        String sessionId = session.getId();
//        log.info("Webhook received from stripe with session ID: {}", sessionId);
//
//
//        Booking booking = bookingRepository.findByPaymentSessionId(sessionId)
//                .orElseThrow(() -> new ResourseNotFoundException("Booking not found for session ID: " + sessionId));
//
//        booking.setBookingStatus(BookingStatus.CONFIRMED);
//        bookingRepository.save(booking);
//
//        inventoryRepository.findAndLockReserveInventory(booking.getRoom()
//                .getId(),booking.getCheckInDate(),booking.getCheckOutDate(),
//                booking.getRoomsCount());
//
//        inventoryRepository.confirmBooking(booking.getRoom()
//                        .getId(),booking.getCheckInDate(),booking.getCheckOutDate(),
//                booking.getRoomsCount());
//
//        log.info("Successfully confirmed the booking for booking id: {}", booking.getId());
//    }else {
//        log.warn("Unhandled event type: {}",event.getType());
//    }
//}

    @Override
    @Transactional
    public void capturePayment(Event event) {
        if ("checkout.session.completed".equals(event.getType())) {
            // Idempotency check: duplicate Stripe webhook deliveries safely ignored
            if (processedWebhookEventRepository.existsByEventId(event.getId())) {
                log.info("Duplicate Stripe webhook event detected with id: {}, skipping duplicate processing", event.getId());
                return;
            }

            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session == null) return;

            String sessionId = session.getId();
            log.info("Webhook received from stripe with session ID: {}", sessionId);

            // 🔥 USE YAHAN HUA HAI BENA:
            // Purane 'findByPaymentSessionId' ko badal kar 'findByPaymentSessionIdIgnoreCase' kar diya.
            // Taaki Stripe se jo ID aaye aur DB mein jo saved hai, unka capital/small letter ka lafda khatam ho jaye.
            Booking booking = bookingRepository.findByPaymentSessionIdIgnoreCase(sessionId)
                    .orElseThrow(() -> new ResourseNotFoundException("Booking not found for session ID: " + sessionId));

            // 🌟 Status ko CONFIRMED karke save maro
            booking.setBookingStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);

            // 🌟 Check-out date se 1 din minus karo actual nights calculate karne ke liye
            LocalDate actualEndDate = booking.getCheckOutDate().minusDays(1);

            log.info("Confirming inventory from {} to {} for room ID: {}", booking.getCheckInDate(), actualEndDate, booking.getRoom().getId());

            // 🌟 Sahi 'actualEndDate' pass karo dono repository methods mein
            inventoryRepository.findAndLockReserveInventory(
                    booking.getRoom().getId(),
                    booking.getCheckInDate(),
                    actualEndDate,
                    booking.getRoomsCount()
            );

            inventoryRepository.confirmBooking(
                    booking.getRoom().getId(),
                    booking.getCheckInDate(),
                    actualEndDate,
                    booking.getRoomsCount()
            );

            // Record processed event for idempotency
            processedWebhookEventRepository.save(new ProcessedWebhookEvent(event.getId(), event.getType()));

            // Send async booking confirmation email
            try {
                emailNotificationService.sendBookingConfirmation(booking);
            } catch (Exception e) {
                log.error("Failed to queue booking confirmation email for booking {}: {}", booking.getId(), e.getMessage());
            }

            log.info("Successfully confirmed the booking for booking id: {}", booking.getId());
        } else {
            log.warn("Unhandled event type: {}", event.getType());
        }
    }
    @Override
    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourseNotFoundException("Booking not found with id : " + bookingId));
        User user = getCurrentUser();

        // 🔥 FIXED: Hibernate Lazy initialization proxy validation crash se bachne ke liye ID check lagaya
        if (booking.getUser() == null || !user.getId().equals(booking.getUser().getId())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id : " + user.getId());
        }

        if (booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Only confirmed booking can be cancelled");
        }

        booking.setBookingStatus(BookingStatus.CANCELED);
        bookingRepository.save(booking);

        LocalDate actualEndDate = booking.getCheckOutDate().minusDays(1);

        // ✅ FIX 4: Cancel mein reserved inventory lock karni chahiye, available nahi
        inventoryRepository.findAndLockReserveInventory(
                booking.getRoom().getId(), booking.getCheckInDate(), actualEndDate, booking.getRoomsCount());

        inventoryRepository.cancelBooking(
                booking.getRoom().getId(), booking.getCheckInDate(), actualEndDate, booking.getRoomsCount());

        try {
            Session session = Session.retrieve(booking.getPaymentSessionId());
            RefundCreateParams refundParams = RefundCreateParams.builder()
                    .setPaymentIntent(session.getPaymentIntent())
                    .build();

            Refund.create(refundParams);
            log.info("Refund processed successfully for booking id: {}", bookingId);
        } catch (StripeException e) {
            throw new RuntimeException("Refund processing failed on Stripe gateway: " + e.getMessage(), e);
        }

        // Send async cancellation email
        try {
            emailNotificationService.sendBookingCancellation(booking);
        } catch (Exception e) {
            log.error("Failed to queue cancellation email for booking {}: {}", bookingId, e.getMessage());
        }
    }

    @Override
    public String getBookingStatus(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() ->
                new ResourseNotFoundException("Booking not found with id : " + bookingId));
        User user = getCurrentUser();

        // 🔥 FIXED: Direct Object check ko Primary Key IDs matching se secure kiya
        if (booking.getUser() == null || !user.getId().equals(booking.getUser().getId())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id : " + user.getId());
        }

        return booking.getBookingStatus().name();
    }

    @Override
    public List<BookingDto> getAllBookingsByHotelId(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId).orElseThrow(() ->
                new ResourseNotFoundException("Hotel not found with ID : " + hotelId));

        User user = getCurrentUser();

        log.info("Getting all booking for the hotel with id : {}", hotelId);

        if (!user.getId().equals(hotel.getOwner().getId())) {
            throw new AccessDeniedException("You are not the owner of hotel with ID : " + hotelId);
        }

        List<Booking> bookings = bookingRepository.findByHotel(hotel);

        return bookings.stream()
                .map((element) -> modelMapper.map(element, BookingDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public HotelReportDto getHotelReport(Long hotelId, LocalDate startDate, LocalDate endDate) {
        Hotel hotel = hotelRepository.findById(hotelId).orElseThrow(() ->
                new ResourseNotFoundException("Hotel not found with ID : " + hotelId));

        User user = getCurrentUser();

        log.info("Generating report for hotel with ID : {}", hotelId);

        if (hotel.getOwner() == null || !user.getId().equals(hotel.getOwner().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You are not the owner of hotel with ID : " + hotelId);
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        List<Booking> bookings = bookingRepository.findByHotelAndCreatedAtBetween(hotel, startDateTime, endDateTime);

        Long totalConfirmedBooking = bookings.stream()
                .filter(booking -> booking.getBookingStatus() == BookingStatus.CONFIRMED)
                .count();

        BigDecimal totalRevenueOfConfirmedBooking = bookings.stream()
                .filter(booking -> booking.getBookingStatus() == BookingStatus.CONFIRMED)
                .map(Booking::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgRevenue = BigDecimal.ZERO;
        if (totalConfirmedBooking > 0 && totalRevenueOfConfirmedBooking.compareTo(BigDecimal.ZERO) > 0) {
            avgRevenue = totalRevenueOfConfirmedBooking.divide(BigDecimal.valueOf(totalConfirmedBooking), RoundingMode.HALF_UP);
        }

        return new HotelReportDto(totalConfirmedBooking, totalRevenueOfConfirmedBooking, avgRevenue);
    }

    @Override
    public List<BookingDto> getMyBooking() {
        User user = getCurrentUser();
        return bookingRepository.findByUser(user).stream()
                .map((element) -> modelMapper.map(element, BookingDto.class))
                .collect(Collectors.toList());
    }

    public boolean hasBookingExpired(Booking booking) {
        return booking.getCreatedAt().plusMinutes(10).isBefore(LocalDateTime.now());
    }
}
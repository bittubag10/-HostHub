package com.example.HostHub.service;

import com.example.HostHub.Enum.BookingStatus;
import com.example.HostHub.dto.BookingDto;
import com.example.HostHub.dto.BookingRequest;
import com.example.HostHub.dto.GuestDto;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService{
    private final BookingRepository bookingRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final InventoryRepository inventoryRepository;
    private final GuestRepository guestRepository;
    private final ModelMapper modelMapper;
    private final CheckoutService checkoutService;
    private final PricingService pricingService;

    @Value("${frontend.url}")
    private String frontendUrl;


//    @Override
//    @Transactional
//    public BookingDto initialiseBooking(BookingRequest bookingRequest) {
//
//        log.info("Initialising booking for hotel : {}, room: {}, date {}-{}",bookingRequest.getHotelId(),
//                bookingRequest.getRoomId(),bookingRequest.getCheckInDate(),bookingRequest.getCheckOutDate());
//
//
//        Hotel hotel=hotelRepository.findById(bookingRequest.getHotelId()).orElseThrow(()->
//                new ResourseNotFoundException("Hotel not found with id: "+bookingRequest.getHotelId()));
//
//        Room room=roomRepository.findById(bookingRequest.getRoomId()).orElseThrow(()->
//                new ResourseNotFoundException("Room not found with this id : "+ bookingRequest.getRoomId()));
//
//        LocalDate actualEndDate = bookingRequest.getCheckOutDate().minusDays(1);
//
//        List<Inventory>inventoryList=inventoryRepository.findAndLockAvailableInventory(room.getId(),
//                bookingRequest.getCheckInDate(),bookingRequest.getCheckOutDate(), bookingRequest.getRoomCount());
//
//        long daysCount= ChronoUnit.DAYS.between(bookingRequest.getCheckInDate(),bookingRequest.getCheckOutDate())+1;
//
//        if (inventoryList.size()!=daysCount){
//            throw new IllegalArgumentException("Room is not available anymore");
//        }
//        //reserve the room / update the booked count of inventory
//
//        for (Inventory inventory: inventoryList){
//            inventory.setBookCount(inventory.getBookCount()+bookingRequest.getRoomCount());
//
//        }
//        inventoryRepository.saveAll(inventoryList);
//
//
//        //create the booking
//
//        User user=new User();
//        user.setId(1L); //TODO: REMOVE DUMMY USER
//
//        //TODO: CALCULATE DYNAMIC AMOUNT
//
//        Booking booking=Booking.builder()
//                .bookingStatus(BookingStatus.RESERVED)
//                .hotel(hotel)
//                .room(room)
//                .chackInDate(bookingRequest.getCheckInDate())
//                .checkOutDate(bookingRequest.getCheckOutDate())
//                .user(user)
//                .roomsCount(bookingRequest.getRoomCount())
//                .amount(BigDecimal.TEN)
//                .build();
//        booking=bookingRepository.save(booking);
//        return modelMapper.map(booking, BookingDto.class);
//
//
//    }


    @Override
    @Transactional
    public BookingDto initialiseBooking(BookingRequest bookingRequest) {

        log.info("Initialising booking for hotel : {}, room: {}, date {}-{}", bookingRequest.getHotelId(),
                bookingRequest.getRoomId(), bookingRequest.getCheckInDate(), bookingRequest.getCheckOutDate());

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
        inventoryRepository.initBooking(room.getId(),bookingRequest.getCheckInDate(),
                bookingRequest.getCheckOutDate(),bookingRequest.getRoomCount());


       // CALCULATE DYNAMIC AMOUNT

        BigDecimal priceForOneRoom =pricingService.calculateTotalPrice(inventoryList);
        BigDecimal totalPrice = priceForOneRoom.multiply(BigDecimal.valueOf(bookingRequest.getRoomCount()));

        Booking booking = Booking.builder()
                .bookingStatus(BookingStatus.RESERVED)
                .hotel(hotel)
                .room(room)
                .chackInDate(bookingRequest.getCheckInDate())
                .checkOutDate(bookingRequest.getCheckOutDate())
                .user(getCurrentUser())
                .roomsCount(bookingRequest.getRoomCount())
                .amount(totalPrice)
                .build();

        booking = bookingRepository.save(booking);


        return modelMapper.map(booking, BookingDto.class);
    }

    @Override
    @Transactional
    public BookingDto addGuests(Long bookingId, List<GuestDto> guestDtoList) {
        log.info("Adding guests for booking with id: {}",bookingId);

        Booking booking=bookingRepository.findById(bookingId).orElseThrow(()->
                new ResourseNotFoundException("Booking not found with this id: "+bookingId));

        User user=getCurrentUser();

        if (!user.equals(booking.getUser())){
            throw  new UnAuthorisedException("Booking does not belong to this user with id : "+user.getId());
        }

        if (hasBookingExpired(booking)){
            throw new IllegalArgumentException("Booking has already expired");
        }

        if (booking.getBookingStatus() != BookingStatus.RESERVED){
            throw new IllegalArgumentException("Booking is not under reserved state, cannot add guests");

        }

        for (GuestDto guestDto: guestDtoList){
            Guest guest=modelMapper.map(guestDto, Guest.class);
            guest.setUser(user);
            guest=guestRepository.save(guest);
            booking.getGuests().add(guest);

        }

        booking.setBookingStatus(BookingStatus.GUESTS_ADDED);
        booking=bookingRepository.save(booking);
        return modelMapper.map(booking, BookingDto.class);
    }

    @Override
    @Transactional
    public String initiatePayment(Long bookingId) {
        Booking booking=bookingRepository.findById(bookingId).orElseThrow(()->
                new ResourseNotFoundException("Booking not found with id : "+bookingId));
        User user=getCurrentUser();

        if (!user.equals(booking.getUser())){
            throw  new UnAuthorisedException("Booking does not belong to this user with id : "+user.getId());
        }

        if (hasBookingExpired(booking)){
            throw new IllegalArgumentException("Booking has already expired");
        }

        String sessionUrl = checkoutService.
                getCheckOutSession(booking,frontendUrl+"/payments/success",frontendUrl+"/payments/failure");

        booking.setBookingStatus(BookingStatus.PAYMENT_PENDING);
        bookingRepository.save(booking);

        return sessionUrl;

    }

    @Override
    @Transactional
    public void capturePayment(Event event) {
        if ("checkout.session.completed".equals(event.getType())){
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session == null) return;

            String sessionId = session.getId();
            Booking booking = bookingRepository.findByPaymentSessionId(sessionId)
                    .orElseThrow(() -> new ResourseNotFoundException("Booking not found for session ID: " + sessionId));

            booking.setBookingStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);

            LocalDate actualEndDate = booking.getCheckOutDate().minusDays(1);

            inventoryRepository.findAndLockAvailableInventory(
                    booking.getRoom().getId(), booking.getChackInDate(), actualEndDate, booking.getRoomsCount());

            inventoryRepository.confirmBooking(
                    booking.getRoom().getId(), booking.getChackInDate(), actualEndDate, booking.getRoomsCount());

            log.info("Successfully confirmed the booking for booking id: {}", booking.getId());
        }
    }

    @Override
    @Transactional
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourseNotFoundException("Booking not found with id : " + bookingId));
        User user = getCurrentUser();

        if (!user.equals(booking.getUser())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id : " + user.getId());
        }

        if (booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Only confirmed booking can be cancelled");
        }

        booking.setBookingStatus(BookingStatus.CANCELED);
        bookingRepository.save(booking);


        LocalDate actualEndDate = booking.getCheckOutDate().minusDays(1);

        inventoryRepository.findAndLockAvailableInventory(
                booking.getRoom().getId(), booking.getChackInDate(), actualEndDate, booking.getRoomsCount());

        inventoryRepository.cancelBooking(
                booking.getRoom().getId(), booking.getChackInDate(), actualEndDate, booking.getRoomsCount());


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
    }

    @Override
    public String getBookingStatus(Long bookingId) {
        Booking booking=bookingRepository.findById(bookingId).orElseThrow(()->
                new ResourseNotFoundException("Booking not found with id : "+bookingId));
        User user=getCurrentUser();

        if (!user.equals(booking.getUser())){
            throw  new UnAuthorisedException("Booking does not belong to this user with id : "+user.getId());
        }

        return booking.getBookingStatus().name();
    }

    public boolean hasBookingExpired(Booking booking){
        return booking.getCreatedAt().plusMinutes(10).isBefore(LocalDateTime.now());
    }

    public User getCurrentUser(){

        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}

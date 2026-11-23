package com.example.HostHub.service;

import com.example.HostHub.Enum.BookingStatus;
import com.example.HostHub.Enum.Roles;
import com.example.HostHub.dto.BookingDto;
import com.example.HostHub.dto.BookingRequest;
import com.example.HostHub.entity.Booking;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Inventory;
import com.example.HostHub.entity.Room;
import com.example.HostHub.entity.User;
import com.example.HostHub.exception.UnAuthorisedException;
import com.example.HostHub.repository.BookingRepository;
import com.example.HostHub.repository.GuestRepository;
import com.example.HostHub.repository.HotelRepository;
import com.example.HostHub.repository.InventoryRepository;
import com.example.HostHub.repository.ProcessedWebhookEventRepository;
import com.example.HostHub.repository.RoomRepository;
import com.example.HostHub.strategy.PricingService;
import com.stripe.model.Event;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.param.RefundCreateParams;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private GuestRepository guestRepository;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private CheckoutService checkoutService;

    @Mock
    private PricingService pricingService;

    @Mock
    private ProcessedWebhookEventRepository processedWebhookEventRepository;

    @Mock
    private EmailNotificationService emailNotificationService;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private User currentUser;
    private Hotel testHotel;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(bookingService, "frontendUrl", "http://localhost:5173");

        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setName("Alice Guest");
        currentUser.setEmail("alice@test.com");
        currentUser.setRoles(Set.of(Roles.GUEST));

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(currentUser, null, currentUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        testHotel = new Hotel();
        testHotel.setId(10L);
        testHotel.setName("HostHub Luxury Hotel");
        testHotel.setOwner(currentUser);

        testRoom = new Room();
        testRoom.setId(20L);
        testRoom.setType("Deluxe Suite");
        testRoom.setHotel(testHotel);
        testRoom.setBasePrice(BigDecimal.valueOf(200.00));
        testRoom.setTotalCount(5);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Pessimistic locking and reservation should NOT lock or reserve the check-out date")
    void testInitialiseBooking_CheckoutDateNotLocked() {
        LocalDate checkIn = LocalDate.now().plusDays(5);
        LocalDate checkOut = LocalDate.now().plusDays(8); // 3 nights
        LocalDate expectedActualEndDate = checkOut.minusDays(1); // 2 nights before checkout

        BookingRequest request = new BookingRequest();
        request.setHotelId(10L);
        request.setRoomId(20L);
        request.setCheckInDate(checkIn);
        request.setCheckOutDate(checkOut);
        request.setRoomCount(2);

        when(hotelRepository.findById(10L)).thenReturn(Optional.of(testHotel));
        when(roomRepository.findById(20L)).thenReturn(Optional.of(testRoom));

        // 3 days inventory available
        Inventory inv1 = Inventory.builder().id(1L).date(checkIn).room(testRoom).build();
        Inventory inv2 = Inventory.builder().id(2L).date(checkIn.plusDays(1)).room(testRoom).build();
        Inventory inv3 = Inventory.builder().id(3L).date(expectedActualEndDate).room(testRoom).build();
        List<Inventory> lockedInventory = List.of(inv1, inv2, inv3);

        when(inventoryRepository.findAndLockAvailableInventory(
                eq(20L), eq(checkIn), eq(expectedActualEndDate), eq(2)))
                .thenReturn(lockedInventory);

        when(pricingService.calculateTotalPrice(lockedInventory)).thenReturn(BigDecimal.valueOf(600.00));

        Booking savedBooking = Booking.builder()
                .id(100L)
                .bookingStatus(BookingStatus.RESERVED)
                .hotel(testHotel)
                .room(testRoom)
                .checkInDate(checkIn)
                .checkOutDate(checkOut)
                .roomsCount(2)
                .amount(BigDecimal.valueOf(1200.00))
                .user(currentUser)
                .build();

        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);

        BookingDto expectedDto = new BookingDto();
        expectedDto.setId(100L);
        expectedDto.setBookingStatus(BookingStatus.RESERVED);
        when(modelMapper.map(any(Booking.class), eq(BookingDto.class))).thenReturn(expectedDto);

        // Execute
        BookingDto result = bookingService.initialiseBooking(request);

        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals(BookingStatus.RESERVED, result.getBookingStatus());

        // Verify Pessimistic locking call targeted actualEndDate (checkOut - 1 day), NOT checkOut
        verify(inventoryRepository, times(1)).findAndLockAvailableInventory(
                20L, checkIn, expectedActualEndDate, 2);

        // Verify initBooking reservation targeted actualEndDate (checkOut - 1 day), NOT checkOut
        ArgumentCaptor<LocalDate> endDateCaptor = ArgumentCaptor.forClass(LocalDate.class);
        verify(inventoryRepository, times(1)).initBooking(
                eq(20L), eq(checkIn), endDateCaptor.capture(), eq(2));

        assertEquals(expectedActualEndDate, endDateCaptor.getValue(),
                "Reservation must NOT include the checkout date");
        assertNotEquals(checkOut, endDateCaptor.getValue(),
                "Checkout date must remain free for other guest check-ins");
    }

    @Test
    @DisplayName("Pessimistic locking failure: should throw exception when inventory count does not match days")
    void testInitialiseBooking_InsufficientInventoryThrowsException() {
        LocalDate checkIn = LocalDate.now().plusDays(2);
        LocalDate checkOut = LocalDate.now().plusDays(5); // 3 nights expected
        LocalDate actualEndDate = checkOut.minusDays(1);

        BookingRequest request = new BookingRequest();
        request.setHotelId(10L);
        request.setRoomId(20L);
        request.setCheckInDate(checkIn);
        request.setCheckOutDate(checkOut);
        request.setRoomCount(1);

        when(hotelRepository.findById(10L)).thenReturn(Optional.of(testHotel));
        when(roomRepository.findById(20L)).thenReturn(Optional.of(testRoom));

        // Only 2 days available instead of 3
        when(inventoryRepository.findAndLockAvailableInventory(eq(20L), eq(checkIn), eq(actualEndDate), eq(1)))
                .thenReturn(List.of(
                        Inventory.builder().id(1L).date(checkIn).build(),
                        Inventory.builder().id(2L).date(checkIn.plusDays(1)).build()
                ));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bookingService.initialiseBooking(request));

        assertTrue(ex.getMessage().contains("Room is not available anymore"));
        verify(inventoryRepository, never()).initBooking(any(), any(), any(), anyInt());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Booking cancellation rollback: releases inventory and triggers refund for confirmed booking")
    void testCancelBooking_RollsBackInventoryAndRefunds() {
        Long bookingId = 50L;
        LocalDate checkIn = LocalDate.now().plusDays(10);
        LocalDate checkOut = LocalDate.now().plusDays(13); // 3 nights
        LocalDate actualEndDate = checkOut.minusDays(1);

        Booking confirmedBooking = Booking.builder()
                .id(bookingId)
                .bookingStatus(BookingStatus.CONFIRMED)
                .hotel(testHotel)
                .room(testRoom)
                .checkInDate(checkIn)
                .checkOutDate(checkOut)
                .roomsCount(1)
                .amount(BigDecimal.valueOf(500.00))
                .user(currentUser)
                .paymentSessionId("cs_test_session_123")
                .createdAt(LocalDateTime.now())
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(confirmedBooking));

        try (MockedStatic<Session> mockedSession = mockStatic(Session.class);
             MockedStatic<Refund> mockedRefund = mockStatic(Refund.class)) {

            Session dummySession = mock(Session.class);
            when(dummySession.getPaymentIntent()).thenReturn("pi_test_123");
            mockedSession.when(() -> Session.retrieve("cs_test_session_123")).thenReturn(dummySession);

            Refund dummyRefund = mock(Refund.class);
            mockedRefund.when(() -> Refund.create(any(RefundCreateParams.class))).thenReturn(dummyRefund);

            // Execute cancel
            bookingService.cancelBooking(bookingId);

            // Verify status transition to CANCELED
            assertEquals(BookingStatus.CANCELED, confirmedBooking.getBookingStatus());
            verify(bookingRepository, times(1)).save(confirmedBooking);

            // Verify inventory locking on reserve inventory
            verify(inventoryRepository, times(1)).findAndLockReserveInventory(
                    testRoom.getId(), checkIn, actualEndDate, 1);

            // Verify inventory rollback (cancelBooking query) called with actualEndDate (not checkout date)
            ArgumentCaptor<LocalDate> endDateCaptor = ArgumentCaptor.forClass(LocalDate.class);
            verify(inventoryRepository, times(1)).cancelBooking(
                    eq(testRoom.getId()), eq(checkIn), endDateCaptor.capture(), eq(1));

            assertEquals(actualEndDate, endDateCaptor.getValue(),
                    "Cancelled inventory rollback must release only stayed nights, not checkout date");

            // Verify Stripe refund called
            mockedSession.verify(() -> Session.retrieve("cs_test_session_123"), times(1));
            mockedRefund.verify(() -> Refund.create(any(RefundCreateParams.class)), times(1));
        }
    }

    @Test
    @DisplayName("Cancel booking failure: should reject cancellation if booking is not CONFIRMED")
    void testCancelBooking_NotConfirmedThrowsException() {
        Long bookingId = 51L;
        Booking reservedBooking = Booking.builder()
                .id(bookingId)
                .bookingStatus(BookingStatus.RESERVED)
                .user(currentUser)
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(reservedBooking));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                bookingService.cancelBooking(bookingId));

        assertTrue(ex.getMessage().contains("Only confirmed booking can be cancelled"));
        verify(inventoryRepository, never()).cancelBooking(any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Security check: user cannot cancel another user's booking")
    void testCancelBooking_OtherUserThrowsUnAuthorisedException() {
        Long bookingId = 52L;
        User otherUser = new User();
        otherUser.setId(999L);

        Booking otherBooking = Booking.builder()
                .id(bookingId)
                .bookingStatus(BookingStatus.CONFIRMED)
                .user(otherUser)
                .build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(otherBooking));

        assertThrows(UnAuthorisedException.class, () ->
                bookingService.cancelBooking(bookingId));

        verify(inventoryRepository, never()).cancelBooking(any(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Idempotency: duplicate Idempotency-Key returns existing booking without locking inventory")
    void testInitialiseBooking_DuplicateIdempotencyKey_ReturnsExistingBooking() {
        String key = "test-uuid-idempotency-key";
        Booking existingBooking = Booking.builder()
                .id(777L)
                .hotel(testHotel)
                .room(testRoom)
                .user(currentUser)
                .bookingStatus(BookingStatus.RESERVED)
                .idempotencyKey(key)
                .build();

        BookingDto expectedDto = new BookingDto();
        expectedDto.setId(777L);

        when(bookingRepository.findByIdempotencyKey(key)).thenReturn(Optional.of(existingBooking));
        when(modelMapper.map(existingBooking, BookingDto.class)).thenReturn(expectedDto);

        BookingRequest request = new BookingRequest();
        request.setHotelId(1L);
        request.setRoomId(10L);
        request.setCheckInDate(LocalDate.now().plusDays(1));
        request.setCheckOutDate(LocalDate.now().plusDays(3));
        request.setRoomCount(1);

        BookingDto result = bookingService.initialiseBooking(request, key);

        assertNotNull(result);
        assertEquals(777L, result.getId());

        // Verify that NO inventory was locked or initialized
        verify(inventoryRepository, never()).findAndLockAvailableInventory(any(), any(), any(), anyInt());
        verify(inventoryRepository, never()).initBooking(any(), any(), any(), anyInt());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Idempotency: duplicate Stripe eventId skips confirmation and inventory changes")
    void testCapturePayment_DuplicateStripeEventId_SkipsProcessing() {
        Event event = mock(Event.class);
        when(event.getType()).thenReturn("checkout.session.completed");
        when(event.getId()).thenReturn("evt_duplicate_999");

        when(processedWebhookEventRepository.existsByEventId("evt_duplicate_999")).thenReturn(true);

        bookingService.capturePayment(event);

        // Verify that no booking lookup, inventory locking, or confirmation happened
        verify(bookingRepository, never()).findByPaymentSessionIdIgnoreCase(any());
        verify(inventoryRepository, never()).confirmBooking(any(), any(), any(), anyInt());
        verify(emailNotificationService, never()).sendBookingConfirmation(any());
    }
}

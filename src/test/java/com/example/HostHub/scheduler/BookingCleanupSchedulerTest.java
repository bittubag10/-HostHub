package com.example.HostHub.scheduler;

import com.example.HostHub.Enum.BookingStatus;
import com.example.HostHub.entity.Booking;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Inventory;
import com.example.HostHub.entity.Room;
import com.example.HostHub.repository.BookingRepository;
import com.example.HostHub.repository.InventoryRepository;
import com.example.HostHub.service.BookingCleanupServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingCleanupSchedulerTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private BookingCleanupServiceImpl bookingCleanupService;

    @Test
    @DisplayName("Expired booking releases reservedCount up to checkOutDate.minusDays(1) and marks status EXPIRED")
    void testReleaseExpiredBooking_Success() {
        Long bookingId = 100L;
        LocalDate checkIn = LocalDate.of(2026, 12, 1);
        LocalDate checkOut = LocalDate.of(2026, 12, 4); // 3 nights: Dec 1, Dec 2, Dec 3
        LocalDate expectedActualEnd = LocalDate.of(2026, 12, 3);

        Room room = new Room();
        room.setId(5L);

        Hotel hotel = new Hotel();
        hotel.setId(10L);

        Booking expiredBooking = Booking.builder()
                .id(bookingId)
                .hotel(hotel)
                .room(room)
                .roomsCount(2)
                .checkInDate(checkIn)
                .checkOutDate(checkOut)
                .bookingStatus(BookingStatus.RESERVED)
                .expiresAt(LocalDateTime.now().minusMinutes(5))
                .build();

        Inventory inv1 = Inventory.builder().id(1L).date(checkIn).reservedCount(2).build();
        Inventory inv2 = Inventory.builder().id(2L).date(checkIn.plusDays(1)).reservedCount(3).build();
        Inventory inv3 = Inventory.builder().id(3L).date(expectedActualEnd).reservedCount(2).build();

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(expiredBooking));
        when(inventoryRepository.findAndLockReserveInventory(eq(5L), eq(checkIn), eq(expectedActualEnd), eq(2)))
                .thenReturn(List.of(inv1, inv2, inv3));

        bookingCleanupService.releaseExpiredBooking(bookingId);

        // Verify reservedCount decremented by 2 for each night
        assertEquals(0, inv1.getReservedCount()); // 2 - 2 = 0
        assertEquals(1, inv2.getReservedCount()); // 3 - 2 = 1
        assertEquals(0, inv3.getReservedCount()); // 2 - 2 = 0

        // Verify inventories saved
        verify(inventoryRepository, times(1)).saveAll(List.of(inv1, inv2, inv3));

        // Verify booking status set to EXPIRED
        assertEquals(BookingStatus.EXPIRED, expiredBooking.getBookingStatus());
        verify(bookingRepository, times(1)).save(expiredBooking);
    }

    @Test
    @DisplayName("Process expired bookings batch correctly triggers release for each expired booking")
    void testProcessExpiredBookings_Batch() {
        Booking b1 = Booking.builder().id(101L).bookingStatus(BookingStatus.RESERVED).build();
        Booking b2 = Booking.builder().id(102L).bookingStatus(BookingStatus.PAYMENT_PENDING).build();

        when(bookingRepository.findByBookingStatusInAndExpiresAtBefore(anyList(), any(LocalDateTime.class)))
                .thenReturn(List.of(b1, b2));
        when(bookingRepository.findById(101L)).thenReturn(Optional.of(b1));
        when(bookingRepository.findById(102L)).thenReturn(Optional.of(b2));

        // Let room and dates be present
        Room room = new Room();
        room.setId(1L);
        b1.setRoom(room);
        b1.setRoomsCount(1);
        b1.setCheckInDate(LocalDate.now());
        b1.setCheckOutDate(LocalDate.now().plusDays(1));

        b2.setRoom(room);
        b2.setRoomsCount(1);
        b2.setCheckInDate(LocalDate.now());
        b2.setCheckOutDate(LocalDate.now().plusDays(1));

        bookingCleanupService.processExpiredBookings();

        verify(bookingRepository, times(1)).save(b1);
        verify(bookingRepository, times(1)).save(b2);
        assertEquals(BookingStatus.EXPIRED, b1.getBookingStatus());
        assertEquals(BookingStatus.EXPIRED, b2.getBookingStatus());
    }

    @Test
    @DisplayName("Already CONFIRMED booking is skipped from auto-release")
    void testReleaseExpiredBooking_SkipsConfirmed() {
        Booking confirmed = Booking.builder()
                .id(200L)
                .bookingStatus(BookingStatus.CONFIRMED)
                .build();

        when(bookingRepository.findById(200L)).thenReturn(Optional.of(confirmed));

        bookingCleanupService.releaseExpiredBooking(200L);

        verify(inventoryRepository, never()).findAndLockReserveInventory(any(), any(), any(), anyInt());
        verify(inventoryRepository, never()).saveAll(any());
        assertEquals(BookingStatus.CONFIRMED, confirmed.getBookingStatus());
    }
}

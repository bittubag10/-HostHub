package com.example.HostHub.service;

import com.example.HostHub.Enum.BookingStatus;
import com.example.HostHub.entity.Booking;
import com.example.HostHub.entity.Inventory;
import com.example.HostHub.repository.BookingRepository;
import com.example.HostHub.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingCleanupServiceImpl implements BookingCleanupService {

    private final BookingRepository bookingRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    public void processExpiredBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<BookingStatus> pendingStatuses = List.of(
                BookingStatus.RESERVED,
                BookingStatus.GUESTS_ADDED,
                BookingStatus.PAYMENT_PENDING
        );

        List<Booking> expiredBookings = bookingRepository.findByBookingStatusInAndExpiresAtBefore(pendingStatuses, now);
        if (expiredBookings.isEmpty()) {
            return;
        }

        log.info("Processing {} expired bookings for inventory release", expiredBookings.size());
        for (Booking booking : expiredBookings) {
            try {
                releaseExpiredBooking(booking.getId());
            } catch (Exception e) {
                log.error("Error releasing inventory for expired booking ID {}: {}", booking.getId(), e.getMessage(), e);
            }
        }
    }

    @Override
    @Transactional
    public void releaseExpiredBooking(Long bookingId) {
        log.info("Releasing expired booking with id: {}", bookingId);
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            log.warn("Booking not found with id: {}", bookingId);
            return;
        }

        // Avoid releasing if already confirmed, canceled, or already expired
        if (booking.getBookingStatus() == BookingStatus.CONFIRMED ||
            booking.getBookingStatus() == BookingStatus.CANCELED ||
            booking.getBookingStatus() == BookingStatus.EXPIRED) {
            log.info("Booking {} already in state {}, skipping auto-release", bookingId, booking.getBookingStatus());
            return;
        }

        LocalDate actualEndDate = booking.getCheckOutDate().minusDays(1);

        // Acquire pessimistic write lock on the inventory
        List<Inventory> inventoryList = inventoryRepository.findAndLockReserveInventory(
                booking.getRoom().getId(),
                booking.getCheckInDate(),
                actualEndDate,
                booking.getRoomsCount()
        );

        for (Inventory inv : inventoryList) {
            int currentReserved = inv.getReservedCount() != null ? inv.getReservedCount() : 0;
            inv.setReservedCount(Math.max(0, currentReserved - booking.getRoomsCount()));
        }

        inventoryRepository.saveAll(inventoryList);

        booking.setBookingStatus(BookingStatus.EXPIRED);
        bookingRepository.save(booking);

        log.info("Successfully released inventory and set status to EXPIRED for booking id: {}", bookingId);
    }
}

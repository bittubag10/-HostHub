package com.example.HostHub.scheduler;

import com.example.HostHub.service.BookingCleanupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingCleanupScheduler {

    private final BookingCleanupService bookingCleanupService;

    @Scheduled(fixedRate = 120000)
    public void cleanupExpiredBookings() {
        log.debug("Running periodic expired booking cleanup task");
        bookingCleanupService.processExpiredBookings();
    }
}

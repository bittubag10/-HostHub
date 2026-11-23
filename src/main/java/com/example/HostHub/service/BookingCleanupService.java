package com.example.HostHub.service;

public interface BookingCleanupService {

    void releaseExpiredBooking(Long bookingId);

    void processExpiredBookings();
}

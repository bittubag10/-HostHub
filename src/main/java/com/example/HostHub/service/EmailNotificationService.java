package com.example.HostHub.service;

import com.example.HostHub.entity.Booking;

public interface EmailNotificationService {

    void sendBookingConfirmation(Booking booking);

    void sendBookingCancellation(Booking booking);
}

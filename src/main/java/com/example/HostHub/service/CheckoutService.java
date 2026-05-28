package com.example.HostHub.service;

import com.example.HostHub.entity.Booking;

public interface CheckoutService {

    String getCheckOutSession(Booking booking, String successUrl, String failureUrl);
}

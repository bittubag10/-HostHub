package com.example.HostHub.service;

import com.example.HostHub.dto.BookingDto;
import com.example.HostHub.dto.BookingRequest;
import com.example.HostHub.dto.GuestDto;

import java.util.List;

public interface BookingService {

    BookingDto initialiseBooking(BookingRequest bookingRequest);

    BookingDto addGuests(Long bookingId, List<GuestDto> guestDtoList);
}

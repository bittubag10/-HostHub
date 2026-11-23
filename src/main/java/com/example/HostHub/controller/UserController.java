package com.example.HostHub.controller;

import com.example.HostHub.dto.BookingDto;
import com.example.HostHub.dto.ProfileUpdateRequestDto;
import com.example.HostHub.service.BookingService;
import com.example.HostHub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final BookingService bookingService;

    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(@RequestBody ProfileUpdateRequestDto profileUpdateRequestDto){
        userService.updateProfile(profileUpdateRequestDto);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/myBookings")
    public ResponseEntity<List<BookingDto>> getMyBooking(){
        return ResponseEntity.ok(bookingService.getMyBooking());
    }
}

package com.example.HostHub.dto;

import com.example.HostHub.Enum.Gender;
import com.example.HostHub.entity.Booking;
import com.example.HostHub.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class GuestDto {
    private Long id;

    private User user;

    private String name;

    private Gender gender;

    private Integer age;

    private Set<Booking> bookings;

}

package com.example.HostHub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Embeddable
public class HotelContactInfo {

    private String address;

    private String phoneNumber;

    private String email;

    private String location;
}

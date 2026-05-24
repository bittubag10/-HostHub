package com.example.HostHub.dto;

import lombok.Data;

import java.time.LocalDate;
@Data
public class HotelSearchRequest {
    private String city;
    private LocalDate startDate;
    private LocalDate EndDate;
    private Integer roomsCount;

    private Integer page=0;
    private Integer size=10;
}

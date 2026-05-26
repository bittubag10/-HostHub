package com.example.HostHub.dto;

import com.example.HostHub.entity.Hotel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class HotelPriceDto {
    private Hotel hotel;
    private Double price;
}

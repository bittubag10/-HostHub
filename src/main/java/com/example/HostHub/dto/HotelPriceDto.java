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
    private Double averageRating = 0.0;
    private Integer reviewCount = 0;

    public HotelPriceDto(Hotel hotel, Double price) {
        this.hotel = hotel;
        this.price = price;
        if (hotel != null) {
            this.averageRating = hotel.getAverageRating() != null ? hotel.getAverageRating() : 0.0;
            this.reviewCount = hotel.getReviewCount() != null ? hotel.getReviewCount() : 0;
        }
    }
}

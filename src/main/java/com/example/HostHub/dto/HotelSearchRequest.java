package com.example.HostHub.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
@Data
public class HotelSearchRequest {
    @NotBlank(message = "City name is required for searching hotels")
    private String city;

    @NotNull(message = "Start date (Check-in) is required")
    @FutureOrPresent(message = "Start date must be today or in the future")
    private LocalDate startDate;

    @NotNull(message = "End date (Check-out) is required")
    @JsonProperty("endDate")
    @JsonAlias({"EndDate", "endDate"})
    private LocalDate endDate;

    @NotNull(message = "Rooms count is required")
    @Min(value = 1, message = "Rooms count must be at least 1")
    private Integer roomsCount;

    private Integer page=0;
    private Integer size=10;
}

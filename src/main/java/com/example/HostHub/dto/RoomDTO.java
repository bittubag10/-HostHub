package com.example.HostHub.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RoomDTO {

    private Long id;

    @NotBlank(message = "Room type is required (e.g., Deluxe, Suite)")
    private String type;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Invalid price format")
    private BigDecimal basePrice;

    @NotEmpty(message = "At least one room photo is required")
    private String[] photo;

    @NotEmpty(message = "Room amenities are required")
    private String[] amenities;

    @NotNull(message = "Total count of rooms is required")
    @Min(value = 1, message = "Total room count must be at least 1")
    private Integer totalCount;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1 person")
    @Max(value = 10, message = "Capacity cannot exceed 10 persons per room")
    private Integer capacity;
}
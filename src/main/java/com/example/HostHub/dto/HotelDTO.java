package com.example.HostHub.dto;

import com.example.HostHub.entity.HotelContactInfo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class HotelDTO {

    private Long id;

    @NotBlank(message = "Hotel name cannot be empty")
    @Size(min = 3, max = 15, message = "Name must be between 3 and 100 characters")
    private String name;

    @NotBlank(message = "City is required")
    private String city;

    @NotEmpty(message = "At least one photo URL is required")
    private String[] photo;

    @NotEmpty(message = "Amenities cannot be empty")
    private String[] amenities;

    @NotNull(message = "Contact information is required")
    @Valid
    private HotelContactInfo contactInfo;

    private Boolean active = true;
}
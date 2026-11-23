package com.example.HostHub.dto;

import com.example.HostHub.entity.HotelContactInfo;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    private String name;

    @NotBlank(message = "City is required")
    private String city;

    @JsonProperty("photo")
    @JsonAlias({"photo", "photos"})
    private String[] photo;

    @NotEmpty(message = "Amenities cannot be empty")
    private String[] amenities;

    @NotNull(message = "Contact information is required")
    @Valid
    private HotelContactInfo contactInfo;

    private Boolean active = true;

    private Double averageRating = 0.0;
    private Integer reviewCount = 0;
}
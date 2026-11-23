package com.example.HostHub.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateInventoryRequestDto {

    @NotNull(message = "Start date is required")
    @FutureOrPresent(message = "Start date cannot be in the past")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Surge factor is required")
    @DecimalMin(value = "0.50", message = "Surge factor cannot be less than 0.50")
    @DecimalMax(value = "5.00", message = "Surge factor cannot be greater than 5.00")
    private BigDecimal surgeFactor;

    @NotNull(message = "Closed status is required")
    private Boolean closed;
}

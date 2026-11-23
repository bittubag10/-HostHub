package com.example.HostHub.dto;

import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Room;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InventoryDto {

    private Long id;

    @NotNull(message = "Inventory date is required")
    @FutureOrPresent(message = "Inventory date cannot be in the past")
    private LocalDate date;

    @NotNull(message = "Booked count is required")
    @Min(value = 0, message = "Booked count cannot be negative")
    private Integer bookCount;

    @NotNull(message = "Reserved count is required")
    @Min(value = 0, message = "Reserved count cannot be negative")
    private Integer reservedCount;

    @NotNull(message = "Total count is required")
    @Min(value = 1, message = "Total rooms count must be at least 1")
    private Integer totalCount;

    @NotNull(message = "Surge factor is required")
    @DecimalMin(value = "1.00", message = "Surge factor cannot be less than 1.00")
    private BigDecimal surgeFactor;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    private BigDecimal price;

    @NotNull(message = "Closed status is required")
    private Boolean closed;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

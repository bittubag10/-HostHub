package com.example.HostHub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DailyRevenueDto {
    private LocalDate date;
    private BigDecimal revenue;
    private Long bookingsCount;
}

package com.example.HostHub.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HotelReportDto {

    private Long confirmedBookingsCount;

    private Long canceledBookingsCount;

    private BigDecimal totalRevenue;

    private BigDecimal averageBookingValue;

    private Double occupancyRate;

    @Builder.Default
    private List<DailyRevenueDto> dailyRevenueBreakdown = new ArrayList<>();

    // Backward-compatibility aliases
    @JsonProperty("bookingCount")
    public Long getBookingCount() {
        return confirmedBookingsCount;
    }

    @JsonProperty("avgRevenue")
    public BigDecimal getAvgRevenue() {
        return averageBookingValue;
    }

    public HotelReportDto(Long bookingCount, BigDecimal totalRevenue, BigDecimal avgRevenue) {
        this.confirmedBookingsCount = bookingCount;
        this.canceledBookingsCount = 0L;
        this.totalRevenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
        this.averageBookingValue = avgRevenue != null ? avgRevenue : BigDecimal.ZERO;
        this.occupancyRate = 0.0;
        this.dailyRevenueBreakdown = new ArrayList<>();
    }
}

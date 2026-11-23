package com.example.HostHub.service;

import com.example.HostHub.Enum.BookingStatus;
import com.example.HostHub.Enum.Roles;
import com.example.HostHub.dto.DailyRevenueDto;
import com.example.HostHub.dto.HotelReportDto;
import com.example.HostHub.entity.Booking;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Inventory;
import com.example.HostHub.entity.User;
import com.example.HostHub.exception.UnAuthorisedException;
import com.example.HostHub.repository.BookingRepository;
import com.example.HostHub.repository.HotelRepository;
import com.example.HostHub.repository.InventoryRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HotelReportServiceTest {

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private User ownerUser;
    private User intruderUser;
    private Hotel hotel;

    @BeforeEach
    void setUp() {
        ownerUser = new User();
        ownerUser.setId(10L);
        ownerUser.setEmail("owner@hotel.com");
        ownerUser.setRoles(Set.of(Roles.HOTEL_MANAGER));

        intruderUser = new User();
        intruderUser.setId(99L);
        intruderUser.setEmail("intruder@other.com");
        intruderUser.setRoles(Set.of(Roles.HOTEL_MANAGER));

        hotel = new Hotel();
        hotel.setId(1L);
        hotel.setName("Grand Riviera");
        hotel.setOwner(ownerUser);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(User user) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("1. Revenue aggregation: calculates confirmed counts, canceled/expired counts, total revenue, and average")
    void testRevenueAggregation_Success() {
        authenticateAs(ownerUser);
        LocalDate start = LocalDate.of(2026, 11, 1);
        LocalDate end = LocalDate.of(2026, 11, 3);

        Booking b1 = Booking.builder()
                .id(1L)
                .bookingStatus(BookingStatus.CONFIRMED)
                .amount(BigDecimal.valueOf(1500.00))
                .createdAt(LocalDateTime.of(2026, 11, 1, 10, 0))
                .build();

        Booking b2 = Booking.builder()
                .id(2L)
                .bookingStatus(BookingStatus.CONFIRMED)
                .amount(BigDecimal.valueOf(2500.00))
                .createdAt(LocalDateTime.of(2026, 11, 2, 14, 0))
                .build();

        Booking b3 = Booking.builder()
                .id(3L)
                .bookingStatus(BookingStatus.CANCELED)
                .amount(BigDecimal.valueOf(1000.00))
                .createdAt(LocalDateTime.of(2026, 11, 1, 11, 0))
                .build();

        Booking b4 = Booking.builder()
                .id(4L)
                .bookingStatus(BookingStatus.EXPIRED)
                .amount(BigDecimal.valueOf(800.00))
                .createdAt(LocalDateTime.of(2026, 11, 3, 9, 0))
                .build();

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(bookingRepository.findByHotelAndCreatedAtBetween(eq(hotel), any(), any()))
                .thenReturn(List.of(b1, b2, b3, b4));
        when(inventoryRepository.findByHotelAndDateBetween(eq(hotel), eq(start), eq(end)))
                .thenReturn(Collections.emptyList());

        HotelReportDto report = bookingService.getHotelReport(1L, start, end);

        assertNotNull(report);
        assertEquals(2L, report.getConfirmedBookingsCount());
        assertEquals(2L, report.getCanceledBookingsCount()); // 1 CANCELED + 1 EXPIRED
        assertEquals(BigDecimal.valueOf(4000.00), report.getTotalRevenue()); // 1500 + 2500
        assertEquals(new BigDecimal("2000.00"), report.getAverageBookingValue()); // 4000 / 2 = 2000.00
    }

    @Test
    @DisplayName("2. Zero-booking edge case: no division by zero error when no confirmed bookings exist")
    void testZeroBookingEdgeCase_NoDivisionByZero() {
        authenticateAs(ownerUser);
        LocalDate start = LocalDate.now().minusDays(7);
        LocalDate end = LocalDate.now();

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(bookingRepository.findByHotelAndCreatedAtBetween(eq(hotel), any(), any()))
                .thenReturn(Collections.emptyList());
        when(inventoryRepository.findByHotelAndDateBetween(eq(hotel), eq(start), eq(end)))
                .thenReturn(Collections.emptyList());

        HotelReportDto report = bookingService.getHotelReport(1L, start, end);

        assertNotNull(report);
        assertEquals(0L, report.getConfirmedBookingsCount());
        assertEquals(0L, report.getCanceledBookingsCount());
        assertEquals(BigDecimal.ZERO, report.getTotalRevenue());
        assertEquals(BigDecimal.ZERO, report.getAverageBookingValue());
        assertEquals(0.0, report.getOccupancyRate());
    }

    @Test
    @DisplayName("3. Occupancy percentage calculation: (totalBookedRoomNights / totalCapacityNights) * 100")
    void testOccupancyPercentageCalculation() {
        authenticateAs(ownerUser);
        LocalDate start = LocalDate.of(2026, 11, 1);
        LocalDate end = LocalDate.of(2026, 11, 2);

        Inventory inv1 = Inventory.builder().totalCount(10).bookCount(8).date(start).build();
        Inventory inv2 = Inventory.builder().totalCount(10).bookCount(6).date(end).build();

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(bookingRepository.findByHotelAndCreatedAtBetween(eq(hotel), any(), any()))
                .thenReturn(Collections.emptyList());
        when(inventoryRepository.findByHotelAndDateBetween(eq(hotel), eq(start), eq(end)))
                .thenReturn(List.of(inv1, inv2));

        HotelReportDto report = bookingService.getHotelReport(1L, start, end);

        // Booked: 8 + 6 = 14, Capacity: 10 + 10 = 20 -> Occupancy: 14/20 * 100 = 70.0%
        assertEquals(70.0, report.getOccupancyRate());
    }

    @Test
    @DisplayName("4. Occupancy percentage zero capacity edge case: safe 0.0 result")
    void testOccupancyPercentage_ZeroCapacity() {
        authenticateAs(ownerUser);
        LocalDate start = LocalDate.now().minusDays(5);
        LocalDate end = LocalDate.now();

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(bookingRepository.findByHotelAndCreatedAtBetween(eq(hotel), any(), any()))
                .thenReturn(Collections.emptyList());
        when(inventoryRepository.findByHotelAndDateBetween(eq(hotel), eq(start), eq(end)))
                .thenReturn(Collections.emptyList());

        HotelReportDto report = bookingService.getHotelReport(1L, start, end);

        assertEquals(0.0, report.getOccupancyRate());
    }

    @Test
    @DisplayName("5. Unauthorized manager rejection: user who does not own the hotel is rejected")
    void testUnauthorizedManagerRejection() {
        authenticateAs(intruderUser); // Logged in as manager ID 99, but hotel owner is ID 10

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));

        assertThrows(UnAuthorisedException.class, () ->
                bookingService.getHotelReport(1L, LocalDate.now().minusDays(30), LocalDate.now())
        );

        verify(bookingRepository, never()).findByHotelAndCreatedAtBetween(any(), any(), any());
    }

    @Test
    @DisplayName("6. Daily revenue breakdown: generates timeline for all days in date range")
    void testDailyRevenueBreakdown_Timeline() {
        authenticateAs(ownerUser);
        LocalDate start = LocalDate.of(2026, 11, 1);
        LocalDate end = LocalDate.of(2026, 11, 3); // 3 days: Nov 1, Nov 2, Nov 3

        Booking b1 = Booking.builder()
                .id(1L)
                .bookingStatus(BookingStatus.CONFIRMED)
                .amount(BigDecimal.valueOf(1200.00))
                .createdAt(LocalDateTime.of(2026, 11, 1, 12, 0))
                .build();

        Booking b2 = Booking.builder()
                .id(2L)
                .bookingStatus(BookingStatus.CONFIRMED)
                .amount(BigDecimal.valueOf(800.00))
                .createdAt(LocalDateTime.of(2026, 11, 1, 15, 0))
                .build();

        Booking b3 = Booking.builder()
                .id(3L)
                .bookingStatus(BookingStatus.CONFIRMED)
                .amount(BigDecimal.valueOf(1500.00))
                .createdAt(LocalDateTime.of(2026, 11, 3, 10, 0))
                .build();

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(bookingRepository.findByHotelAndCreatedAtBetween(eq(hotel), any(), any()))
                .thenReturn(List.of(b1, b2, b3));
        when(inventoryRepository.findByHotelAndDateBetween(eq(hotel), eq(start), eq(end)))
                .thenReturn(Collections.emptyList());

        HotelReportDto report = bookingService.getHotelReport(1L, start, end);

        List<DailyRevenueDto> breakdown = report.getDailyRevenueBreakdown();
        assertEquals(3, breakdown.size());

        // Nov 1: 2 bookings, 2000.00 revenue
        assertEquals(LocalDate.of(2026, 11, 1), breakdown.get(0).getDate());
        assertEquals(2L, breakdown.get(0).getBookingsCount());
        assertEquals(BigDecimal.valueOf(2000.00), breakdown.get(0).getRevenue());

        // Nov 2: 0 bookings, 0 revenue
        assertEquals(LocalDate.of(2026, 11, 2), breakdown.get(1).getDate());
        assertEquals(0L, breakdown.get(1).getBookingsCount());
        assertEquals(BigDecimal.ZERO, breakdown.get(1).getRevenue());

        // Nov 3: 1 booking, 1500.00 revenue
        assertEquals(LocalDate.of(2026, 11, 3), breakdown.get(2).getDate());
        assertEquals(1L, breakdown.get(2).getBookingsCount());
        assertEquals(BigDecimal.valueOf(1500.00), breakdown.get(2).getRevenue());
    }
}

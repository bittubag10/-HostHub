package com.example.HostHub.strategy;

import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Inventory;
import com.example.HostHub.entity.Room;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.MonthDay;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PricingStrategyTest {

    private Room testRoom;
    private Inventory testInventory;

    @BeforeEach
    void setUp() {
        Hotel hotel = new Hotel();
        hotel.setId(1L);
        hotel.setName("Test Grand Hotel");
        hotel.setCity("Mumbai");

        testRoom = new Room();
        testRoom.setId(10L);
        testRoom.setType("Deluxe Suite");
        testRoom.setBasePrice(BigDecimal.valueOf(100.00));
        testRoom.setTotalCount(10);
        testRoom.setCapacity(2);
        testRoom.setHotel(hotel);

        testInventory = Inventory.builder()
                .id(100L)
                .room(testRoom)
                .hotel(hotel)
                .city("Mumbai")
                .date(LocalDate.now().plusDays(30)) // Far future, non-holiday by default
                .totalCount(10)
                .bookCount(2)
                .reservedCount(0)
                .price(BigDecimal.valueOf(100.00))
                .surgeFactor(BigDecimal.ONE)
                .closed(false)
                .build();
    }

    @Test
    @DisplayName("1. BasePricingStrategy should return the base price of the room")
    void testBasePricingStrategy() {
        PricingStrategy baseStrategy = new BasePricingStrategy();
        BigDecimal price = baseStrategy.calculatePrice(testInventory);

        assertEquals(0, BigDecimal.valueOf(100.00).compareTo(price));
    }

    @Test
    @DisplayName("2. SurgePricingStrategy should multiply price by the inventory surge factor")
    void testSurgePricingStrategy() {
        testInventory.setSurgeFactor(BigDecimal.valueOf(1.5)); // 50% surge
        PricingStrategy strategy = new SurgePricingStrategy(new BasePricingStrategy());

        BigDecimal price = strategy.calculatePrice(testInventory);

        // 100 * 1.5 = 150.0
        assertEquals(0, BigDecimal.valueOf(150.00).compareTo(price));
    }

    @Test
    @DisplayName("3a. OccupancyPricingStrategy should apply 20% surge when occupancy > 80%")
    void testOccupancyPricingStrategy_HighOccupancy() {
        testInventory.setBookCount(9); // 9/10 = 90% > 80%
        PricingStrategy strategy = new OccupancyPricingStrategy(new BasePricingStrategy());

        BigDecimal price = strategy.calculatePrice(testInventory);

        // 100 * 1.20 = 120.0
        assertEquals(0, BigDecimal.valueOf(120.00).compareTo(price));
    }

    @Test
    @DisplayName("3b. OccupancyPricingStrategy should NOT surge when occupancy <= 80%")
    void testOccupancyPricingStrategy_NormalOccupancy() {
        testInventory.setBookCount(8); // 8/10 = 80% (not > 80%)
        PricingStrategy strategy = new OccupancyPricingStrategy(new BasePricingStrategy());

        BigDecimal price = strategy.calculatePrice(testInventory);

        // 100 unchanged
        assertEquals(0, BigDecimal.valueOf(100.00).compareTo(price));
    }

    @Test
    @DisplayName("4a. UrgencyPricingStrategy should apply 15% surge when booking is within 7 days")
    void testUrgencyPricingStrategy_WithinSevenDays() {
        testInventory.setDate(LocalDate.now().plusDays(3)); // 3 days away (< 7)
        PricingStrategy strategy = new UrgencyPricingStrategy(new BasePricingStrategy());

        BigDecimal price = strategy.calculatePrice(testInventory);

        // 100 * 1.15 = 115.0
        assertEquals(0, BigDecimal.valueOf(115.00).compareTo(price));
    }

    @Test
    @DisplayName("4b. UrgencyPricingStrategy should NOT surge when booking is 7 or more days away")
    void testUrgencyPricingStrategy_FarDate() {
        testInventory.setDate(LocalDate.now().plusDays(10)); // 10 days away
        PricingStrategy strategy = new UrgencyPricingStrategy(new BasePricingStrategy());

        BigDecimal price = strategy.calculatePrice(testInventory);

        // 100 unchanged
        assertEquals(0, BigDecimal.valueOf(100.00).compareTo(price));
    }

    @Test
    @DisplayName("5a. HolidayPricingStrategy should apply 25% surge on a recognized public holiday")
    void testHolidayPricingStrategy_OnHoliday() {
        // Set date to Republic Day (Jan 26) of next year
        int nextYear = LocalDate.now().getYear() + 1;
        testInventory.setDate(LocalDate.of(nextYear, 1, 26));

        PricingStrategy strategy = new HolidayPricingStrategy(new BasePricingStrategy());
        BigDecimal price = strategy.calculatePrice(testInventory);

        // 100 * 1.25 = 125.0
        assertEquals(0, BigDecimal.valueOf(125.00).compareTo(price));
    }

    @Test
    @DisplayName("5b. HolidayPricingStrategy should NOT surge on a regular non-holiday date")
    void testHolidayPricingStrategy_OnRegularDay() {
        // Ensure a regular non-holiday date (e.g. Feb 10)
        int nextYear = LocalDate.now().getYear() + 1;
        testInventory.setDate(LocalDate.of(nextYear, 2, 10));

        PricingStrategy strategy = new HolidayPricingStrategy(new BasePricingStrategy());
        BigDecimal price = strategy.calculatePrice(testInventory);

        // 100 unchanged
        assertEquals(0, BigDecimal.valueOf(100.00).compareTo(price));
    }

    @Test
    @DisplayName("5c. HolidayPricingStrategy with custom registered holiday")
    void testHolidayPricingStrategy_CustomHoliday() {
        HolidayCalendar customCalendar = new HolidayCalendar();
        LocalDate specialFestival = LocalDate.of(2027, 3, 25);
        customCalendar.addSpecificHoliday(specialFestival);

        testInventory.setDate(specialFestival);
        PricingStrategy strategy = new HolidayPricingStrategy(new BasePricingStrategy(), customCalendar);

        BigDecimal price = strategy.calculatePrice(testInventory);
        assertEquals(0, BigDecimal.valueOf(125.00).compareTo(price));
    }

    @Test
    @DisplayName("6. PricingService should combine all strategies and calculate list total")
    void testPricingServiceComposite() {
        PricingService pricingService = new PricingService();

        // Far future date, normal occupancy, normal surge, non-holiday
        int nextYear = LocalDate.now().getYear() + 1;
        testInventory.setDate(LocalDate.of(nextYear, 4, 15));
        testInventory.setBookCount(1);
        testInventory.setSurgeFactor(BigDecimal.ONE);

        BigDecimal singleDayPrice = pricingService.calculateDynamicPricing(testInventory);
        assertEquals(0, BigDecimal.valueOf(100.00).compareTo(singleDayPrice));

        // Total price for 3 days
        Inventory day2 = Inventory.builder()
                .id(101L).room(testRoom).hotel(testInventory.getHotel()).city("Mumbai")
                .date(LocalDate.of(nextYear, 4, 16)).totalCount(10).bookCount(1).reservedCount(0)
                .price(BigDecimal.valueOf(100.00)).surgeFactor(BigDecimal.ONE).closed(false).build();

        Inventory day3 = Inventory.builder()
                .id(102L).room(testRoom).hotel(testInventory.getHotel()).city("Mumbai")
                .date(LocalDate.of(nextYear, 4, 17)).totalCount(10).bookCount(1).reservedCount(0)
                .price(BigDecimal.valueOf(100.00)).surgeFactor(BigDecimal.ONE).closed(false).build();

        BigDecimal totalPrice = pricingService.calculateTotalPrice(List.of(testInventory, day2, day3));
        assertEquals(0, BigDecimal.valueOf(300.00).compareTo(totalPrice));
    }
}

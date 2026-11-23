package com.example.HostHub.service;

import com.example.HostHub.dto.HotelPriceDto;
import com.example.HostHub.dto.HotelSearchRequest;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.repository.HotelMinPriceRepository;
import com.example.HostHub.repository.HotelRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HotelSearchFilterTest {

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private HotelMinPriceRepository hotelMinPriceRepository;

    @InjectMocks
    private HotelServiceImpl hotelService;

    private Hotel hotelA;
    private Hotel hotelB;
    private Hotel hotelC;

    @BeforeEach
    void setUp() {
        hotelA = new Hotel();
        hotelA.setId(1L);
        hotelA.setName("Azure Bay Resort");
        hotelA.setCity("Goa");
        hotelA.setActive(true);
        hotelA.setAmenities(new String[]{"WiFi", "Pool", "AC"});

        hotelB = new Hotel();
        hotelB.setId(2L);
        hotelB.setName("Boutique Palms");
        hotelB.setCity("Goa");
        hotelB.setActive(true);
        hotelB.setAmenities(new String[]{"WiFi", "Breakfast"});

        hotelC = new Hotel();
        hotelC.setId(3L);
        hotelC.setName("Coral Palace");
        hotelC.setCity("Goa");
        hotelC.setActive(true);
        hotelC.setAmenities(new String[]{"Parking", "Gym"});
    }

    private HotelSearchRequest createBaseRequest() {
        HotelSearchRequest req = new HotelSearchRequest();
        req.setCity("Goa");
        req.setStartDate(LocalDate.now().plusDays(2));
        req.setEndDate(LocalDate.now().plusDays(5)); // 3 nights
        req.setRoomsCount(1);
        req.setPage(0);
        req.setSize(10);
        return req;
    }

    @Test
    @DisplayName("1. Multi-night room availability should query dates up to endDate.minusDays(1)")
    void testSearchHotels_DateRangeAndAvailabilityParams() {
        HotelSearchRequest request = createBaseRequest();
        LocalDate expectedActualEnd = request.getEndDate().minusDays(1);
        long expectedNights = 3L;

        when(hotelMinPriceRepository.findHotelsWithAvailableInventory(
                eq("Goa"), eq(request.getStartDate()), eq(expectedActualEnd), eq(1), eq(expectedNights)))
                .thenReturn(List.of(new HotelPriceDto(hotelA, 200.0)));

        Page<HotelPriceDto> result = hotelService.searchHotels(request);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());

        verify(hotelMinPriceRepository, times(1)).findHotelsWithAvailableInventory(
                "Goa", request.getStartDate(), expectedActualEnd, 1, expectedNights);
    }

    @Test
    @DisplayName("2. Price range filtering: minPrice and maxPrice should filter candidates")
    void testSearchHotels_PriceFiltering() {
        HotelSearchRequest request = createBaseRequest();
        request.setMinPrice(BigDecimal.valueOf(150.00));
        request.setMaxPrice(BigDecimal.valueOf(250.00));

        HotelPriceDto dtoLow = new HotelPriceDto(hotelA, 100.0);
        HotelPriceDto dtoMid = new HotelPriceDto(hotelB, 200.0);
        HotelPriceDto dtoHigh = new HotelPriceDto(hotelC, 350.0);

        when(hotelMinPriceRepository.findHotelsWithAvailableInventory(any(), any(), any(), anyInt(), anyLong()))
                .thenReturn(List.of(dtoLow, dtoMid, dtoHigh));

        Page<HotelPriceDto> result = hotelService.searchHotels(request);

        assertEquals(1, result.getTotalElements());
        assertEquals(hotelB.getId(), result.getContent().get(0).getHotel().getId());
        assertEquals(200.0, result.getContent().get(0).getPrice());
    }

    @Test
    @DisplayName("3. Amenity filtering: case-insensitive match for all requested amenities")
    void testSearchHotels_AmenityFiltering() {
        HotelSearchRequest request = createBaseRequest();
        // Request "wifi" and "POOL" (mixed case)
        request.setAmenities(List.of("wifi", "POOL"));

        HotelPriceDto dtoA = new HotelPriceDto(hotelA, 250.0); // Has WiFi, Pool, AC -> matches
        HotelPriceDto dtoB = new HotelPriceDto(hotelB, 180.0); // Has WiFi, Breakfast -> missing Pool
        HotelPriceDto dtoC = new HotelPriceDto(hotelC, 150.0); // Has Parking, Gym -> missing both

        when(hotelMinPriceRepository.findHotelsWithAvailableInventory(any(), any(), any(), anyInt(), anyLong()))
                .thenReturn(List.of(dtoA, dtoB, dtoC));

        Page<HotelPriceDto> result = hotelService.searchHotels(request);

        assertEquals(1, result.getTotalElements());
        assertEquals("Azure Bay Resort", result.getContent().get(0).getHotel().getName());
    }

    @Test
    @DisplayName("4. Sorting: PRICE_ASC, PRICE_DESC, and NAME_ASC")
    void testSearchHotels_Sorting() {
        HotelPriceDto dto1 = new HotelPriceDto(hotelA, 300.0); // Azure Bay
        HotelPriceDto dto2 = new HotelPriceDto(hotelB, 100.0); // Boutique Palms
        HotelPriceDto dto3 = new HotelPriceDto(hotelC, 200.0); // Coral Palace

        // Test PRICE_ASC
        HotelSearchRequest reqAsc = createBaseRequest();
        reqAsc.setSortBy("PRICE_ASC");
        when(hotelMinPriceRepository.findHotelsWithAvailableInventory(any(), any(), any(), anyInt(), anyLong()))
                .thenReturn(List.of(dto1, dto2, dto3));

        Page<HotelPriceDto> resultAsc = hotelService.searchHotels(reqAsc);
        assertEquals(100.0, resultAsc.getContent().get(0).getPrice());
        assertEquals(200.0, resultAsc.getContent().get(1).getPrice());
        assertEquals(300.0, resultAsc.getContent().get(2).getPrice());

        // Test PRICE_DESC
        HotelSearchRequest reqDesc = createBaseRequest();
        reqDesc.setSortBy("PRICE_DESC");
        when(hotelMinPriceRepository.findHotelsWithAvailableInventory(any(), any(), any(), anyInt(), anyLong()))
                .thenReturn(List.of(dto1, dto2, dto3));

        Page<HotelPriceDto> resultDesc = hotelService.searchHotels(reqDesc);
        assertEquals(300.0, resultDesc.getContent().get(0).getPrice());
        assertEquals(200.0, resultDesc.getContent().get(1).getPrice());
        assertEquals(100.0, resultDesc.getContent().get(2).getPrice());

        // Test NAME_ASC
        HotelSearchRequest reqName = createBaseRequest();
        reqName.setSortBy("NAME_ASC");
        when(hotelMinPriceRepository.findHotelsWithAvailableInventory(any(), any(), any(), anyInt(), anyLong()))
                .thenReturn(List.of(dto3, dto1, dto2));

        Page<HotelPriceDto> resultName = hotelService.searchHotels(reqName);
        assertEquals("Azure Bay Resort", resultName.getContent().get(0).getHotel().getName());
        assertEquals("Boutique Palms", resultName.getContent().get(1).getHotel().getName());
        assertEquals("Coral Palace", resultName.getContent().get(2).getHotel().getName());
    }

    @Test
    @DisplayName("5. Active cities endpoint should return distinct sorted list")
    void testGetAllActiveCities() {
        when(hotelRepository.findDistinctActiveCities()).thenReturn(List.of("Goa", "Jaipur", "Mumbai"));

        List<String> cities = hotelService.getAllActiveCities();

        assertEquals(3, cities.size());
        assertEquals("Goa", cities.get(0));
        assertEquals("Jaipur", cities.get(1));
        assertEquals("Mumbai", cities.get(2));
    }

    @Test
    @DisplayName("6. Should throw IllegalArgumentException when checkout date is not after checkin date")
    void testSearchHotels_InvalidDateRange() {
        HotelSearchRequest request = createBaseRequest();
        request.setEndDate(request.getStartDate()); // Same day

        assertThrows(IllegalArgumentException.class, () ->
                hotelService.searchHotels(request));
    }
}

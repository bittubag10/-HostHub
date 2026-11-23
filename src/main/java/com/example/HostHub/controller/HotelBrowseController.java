package com.example.HostHub.controller;

import com.example.HostHub.dto.HotelDTO;
import com.example.HostHub.dto.HotelInfoDto;
import com.example.HostHub.dto.HotelPriceDto;
import com.example.HostHub.dto.HotelSearchRequest;
import com.example.HostHub.service.HotelService;
import com.example.HostHub.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hotels")
@RequiredArgsConstructor
public class HotelBrowseController {

    private final InventoryService inventoryService;
    private final HotelService hotelService;

    @PostMapping("/search")
    public ResponseEntity<Page<HotelPriceDto>> searchHotel(@Valid @RequestBody HotelSearchRequest hotelSearchRequest){
        var page = hotelService.searchHotels(hotelSearchRequest);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getAllActiveCities() {
        return ResponseEntity.ok(hotelService.getAllActiveCities());
    }

    @GetMapping("{hotelId}/info")
    public ResponseEntity<HotelInfoDto>getHotelInfo(@PathVariable Long hotelId){
        return ResponseEntity.ok(hotelService.getHotelInfoById(hotelId));
    }
}

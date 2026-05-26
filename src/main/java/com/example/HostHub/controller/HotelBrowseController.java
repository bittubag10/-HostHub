package com.example.HostHub.controller;

import com.example.HostHub.dto.HotelDTO;
import com.example.HostHub.dto.HotelInfoDto;
import com.example.HostHub.dto.HotelPriceDto;
import com.example.HostHub.dto.HotelSearchRequest;
import com.example.HostHub.service.HotelService;
import com.example.HostHub.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/hotels")
@RequiredArgsConstructor
public class HotelBrowseController {

    private final InventoryService inventoryService;
    private final HotelService hotelService;

    @GetMapping("/search")
    public ResponseEntity<Page<HotelPriceDto>> searchHotel(@RequestBody HotelSearchRequest hotelSearchRequest){
        var page=inventoryService.searchHotel(hotelSearchRequest);
        return ResponseEntity.ok(page);
    }


    @GetMapping("{hotelId}/info")
    public ResponseEntity<HotelInfoDto>getHotelInfo(@PathVariable Long hotelId){
        return ResponseEntity.ok(hotelService.getHotelInfoById(hotelId));
    }
}

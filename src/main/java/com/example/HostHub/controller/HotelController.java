package com.example.HostHub.controller;

import com.example.HostHub.dto.BookingDto;
import com.example.HostHub.dto.HotelDTO;
import com.example.HostHub.dto.HotelReportDto;
import com.example.HostHub.service.BookingService;
import com.example.HostHub.service.HotelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/hotels")
@RequiredArgsConstructor
@Slf4j
public class HotelController {
    private final HotelService hotelService;
    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<HotelDTO> createNewHotel(@Valid @RequestBody HotelDTO hotelDTO){
        log.info("Attempting to create a new hotel with name : {}",hotelDTO.getName());

        HotelDTO hotel=hotelService.createNewHotel(hotelDTO);
        return new ResponseEntity<>(hotel, HttpStatus.CREATED);
    }

    @GetMapping("/{hotelId}")
    public ResponseEntity<HotelDTO> getHotelById(@PathVariable Long hotelId){
        HotelDTO hotelDTO=hotelService.getHotelById(hotelId);

        return ResponseEntity.ok(hotelDTO);
    }

    @PutMapping("/{hotelId}")
    public ResponseEntity<HotelDTO> updateHotelById(@Valid @PathVariable Long hotelId,@RequestBody HotelDTO hotelDTO){
        HotelDTO hotel=hotelService.updateHotelById(hotelId,hotelDTO);
        return ResponseEntity.ok(hotel);
    }

    @DeleteMapping("/{hotelId}")
    public ResponseEntity<Void> deleteHotelById(@PathVariable Long hotelId){
        hotelService.deleteHotelById(hotelId);

        return ResponseEntity.noContent().build();

    }

    @PatchMapping("/{hotelId}/activate")
    public ResponseEntity<Void> activateHotel(@PathVariable Long hotelId){
        hotelService.activateHotel(hotelId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<HotelDTO>>getAllHotel(){
        return ResponseEntity.ok(hotelService.getAllHotels());
    }


    @GetMapping("/{hotelId}/bookings")
    public ResponseEntity<List<BookingDto>> getAllBookingsByHotelId(@PathVariable Long hotelId){
        return ResponseEntity.ok(bookingService.getAllBookingsByHotelId(hotelId));
    }


    @GetMapping("/{hotelId}/reports")
    public ResponseEntity<HotelReportDto> getHotelReport(@PathVariable Long hotelId,
                                                         @RequestParam(required = false)LocalDate startDate,
                                                         @RequestParam(required = false)LocalDate endDate){
        if (startDate == null)startDate = LocalDate.now().minusMonths(1);
        if (endDate == null)endDate = LocalDate.now();

        return ResponseEntity.ok(bookingService.getHotelReport(hotelId,startDate,endDate));
    }

    @PostMapping(value = "/{hotelId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<HotelDTO> addHotelPhotos(@PathVariable Long hotelId,
                                                   @RequestParam("files") MultipartFile[] files) {
        return ResponseEntity.ok(hotelService.addPhotos(hotelId, files));
    }

    @DeleteMapping("/{hotelId}/photos")
    public ResponseEntity<HotelDTO> removeHotelPhoto(@PathVariable Long hotelId,
                                                     @RequestParam("photoUrl") String photoUrl) {
        return ResponseEntity.ok(hotelService.removePhoto(hotelId, photoUrl));
    }
}

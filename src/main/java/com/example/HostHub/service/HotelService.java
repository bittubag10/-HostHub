package com.example.HostHub.service;


import com.example.HostHub.dto.HotelDTO;
import com.example.HostHub.dto.HotelInfoDto;

import java.util.List;

public interface HotelService {

   HotelDTO createNewHotel(HotelDTO hotelDTO);

   HotelDTO getHotelById(Long id);

   HotelDTO updateHotelById(Long id,HotelDTO hotelDTO);

   void deleteHotelById(Long id);

   void activateHotel(Long hotelId);


    HotelInfoDto getHotelInfoById(Long hotelId);

    List<HotelDTO> getAllHotels();

    HotelDTO addPhotos(Long hotelId, org.springframework.web.multipart.MultipartFile[] files);

    HotelDTO removePhoto(Long hotelId, String photoUrl);
}

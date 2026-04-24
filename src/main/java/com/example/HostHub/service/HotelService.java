package com.example.HostHub.service;


import com.example.HostHub.dto.HotelDTO;

public interface HotelService {

   HotelDTO createNewHotel(HotelDTO hotelDTO);

   HotelDTO getHotelById(Long id);

   HotelDTO updateHotelById(Long id,HotelDTO hotelDTO);

   void deleteHotelById(Long id);

   void activateHotel(Long hotelId);


}

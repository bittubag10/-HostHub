package com.example.HostHub.service;

import com.example.HostHub.dto.HotelDTO;
import com.example.HostHub.dto.HotelSearchRequest;
import com.example.HostHub.entity.Room;
import org.springframework.data.domain.Page;

public interface InventoryService {

    void initializeRoomForAYear(Room room);

    void deleteAllInventories(Room room);

    Page<HotelDTO> searchHotel(HotelSearchRequest hotelSearchRequest);
}

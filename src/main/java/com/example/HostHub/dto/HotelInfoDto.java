package com.example.HostHub.dto;

import com.example.HostHub.entity.Room;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HotelInfoDto {
    private HotelDTO hotel;
    private List<RoomDTO> rooms;
}

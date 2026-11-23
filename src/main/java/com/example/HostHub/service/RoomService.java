package com.example.HostHub.service;

import com.example.HostHub.dto.RoomDTO;

import java.util.List;

public interface RoomService {

    RoomDTO createNewRoom(Long hotelId,RoomDTO roomDTO);

    List<RoomDTO> getAllRoomsInHotel(Long hotelId);

    RoomDTO getRoomById(Long roomId);

    void deleteRoomById(Long roomId);

    RoomDTO updateRoomById(Long hotelId, Long roomId, RoomDTO roomDTO);

    RoomDTO addPhotos(Long hotelId, Long roomId, org.springframework.web.multipart.MultipartFile[] files);

    RoomDTO removePhoto(Long hotelId, Long roomId, String photoUrl);
}

package com.example.HostHub.controller;

import com.example.HostHub.dto.RoomDTO;
import com.example.HostHub.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/hotels/{hotelId}/rooms")
@RequiredArgsConstructor
public class RoomAdminController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomDTO>createNewRoom(@PathVariable Long hotelId,
                                                @RequestBody RoomDTO roomDTO){
        RoomDTO room=roomService.createNewRoom(hotelId,roomDTO);

        return new ResponseEntity<>(room, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<RoomDTO>>getAllRoomsInHotel(@PathVariable Long hotelId){
        return ResponseEntity.ok(roomService.getAllRoomsInHotel(hotelId));

    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomDTO>getRoomById(@PathVariable Long hotelId,
                                              @PathVariable Long roomId){

        return ResponseEntity.ok(roomService.getRoomById(roomId));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<RoomDTO>deleteRoomById(@PathVariable Long hotelId,
                                                 @PathVariable Long roomId){
        roomService.deleteRoomById(roomId);
        return ResponseEntity.noContent().build();
    }


}

package com.example.HostHub.service;

import com.example.HostHub.dto.RoomDTO;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Room;
import com.example.HostHub.exception.ResourseNotFoundException;
import com.example.HostHub.repository.HotelRepository;
import com.example.HostHub.repository.RoomRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomServiceImpl implements RoomService{

    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final InventoryService inventoryService;
    private final ModelMapper modelMapper;

    @Override
    public RoomDTO createNewRoom(Long hotelId,RoomDTO roomDTO) {
        log.info("Crating the new room in hotel with id : {}",hotelId);
        Hotel hotel=hotelRepository.findById(hotelId)
                .orElseThrow(()->new ResourseNotFoundException("Hotel not found with id: "+hotelId));

        Room room=modelMapper.map(roomDTO, Room.class);
        room.setHotel(hotel);
        room = roomRepository.save(room);

        if (hotel.getActive()){
             inventoryService.initializeRoomForAYear(room);
        }

        return modelMapper.map(room, RoomDTO.class);
    }

    @Override
    public List<RoomDTO> getAllRoomsInHotel(Long hotelId) {
        log.info("Getting all rooms in hotel with id : {}",hotelId);
        Hotel hotel=hotelRepository.findById(hotelId)
                .orElseThrow(()->new ResourseNotFoundException("Hotel not found with id: "+hotelId));

        return hotel.getRooms()
                .stream()
                .map((element)-> modelMapper.map(element, RoomDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public RoomDTO getRoomById(Long roomId) {
        log.info("Getting the rooms with id : {}",roomId);
        Room room=roomRepository.findById(roomId)
                .orElseThrow(()->new ResourseNotFoundException("Room not found with id: "+roomId));

        return modelMapper.map(room, RoomDTO.class);
    }

//    @Override
//    @Transactional
//    public void deleteRoomById(Long roomId) {
//        log.info("Deleting the room with id : {} ",roomId);
//        Room room=roomRepository.findById(roomId)
//                .orElseThrow(()->new ResourseNotFoundException("Room not found with id: "+roomId));
//
//
//        inventoryService.deleteAllInventories(room);
//        roomRepository.deleteById(roomId);
//
//    }
@Override
@Transactional
public void deleteRoomById(Long roomId) {
    Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new ResourseNotFoundException("Room not found"));

    Hotel hotel = room.getHotel();

    inventoryService.deleteAllInventories(room);
    roomRepository.deleteById(roomId);

    // Agar room delete hone ke baad hotel mein 0 rooms bache, toh hotel deactivate kar do
    if (hotel.getRooms().size() <= 1) { // <=1 kyunki abhi list se room delete nahi hua memory mein
        hotel.setActive(false);
        hotelRepository.save(hotel);
        log.info("Hotel {} deactivated because no rooms left", hotel.getId());
    }
}
}

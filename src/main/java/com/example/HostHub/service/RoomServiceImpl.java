package com.example.HostHub.service;

import com.example.HostHub.dto.RoomDTO;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Room;
import com.example.HostHub.entity.User;
import com.example.HostHub.exception.ResourseNotFoundException;
import com.example.HostHub.exception.UnAuthorisedException;
import com.example.HostHub.repository.HotelRepository;
import com.example.HostHub.repository.RoomRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import static com.example.HostHub.util.AppUtils.getCurrentUser;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final InventoryService inventoryService;
    private final ModelMapper modelMapper;
    private final PricingUpdateService pricingUpdateService;

    @Override
    public RoomDTO createNewRoom(Long hotelId, RoomDTO roomDTO) {
        log.info("Creating the new room in hotel with id : {}", hotelId);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with id: " + hotelId));

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // 🔥 FIXED: Object ke bajaye Primary Key (ID) check lagaya
        if (hotel.getOwner() == null || !user.getId().equals(hotel.getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own this hotel with id : " + hotelId);
        }

        Room room = modelMapper.map(roomDTO, Room.class);
        room.setHotel(hotel);
        room = roomRepository.save(room);

        if (hotel.getActive()) {
            inventoryService.initializeRoomForAYear(room);
            pricingUpdateService.updateHotelPrice(hotel);
        }

        return modelMapper.map(room, RoomDTO.class);
    }

    @Override
    public List<RoomDTO> getAllRoomsInHotel(Long hotelId) {
        log.info("Getting all rooms in hotel with id : {}", hotelId);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with id: " + hotelId));

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // 🔥 FIXED: Primary Key (ID) check lagaya
        if (hotel.getOwner() == null || !user.getId().equals(hotel.getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own this hotel with id : " + hotelId);
        }

        return hotel.getRooms()
                .stream()
                .map((element) -> modelMapper.map(element, RoomDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public RoomDTO getRoomById(Long roomId) {
        log.info("Getting the rooms with id : {}", roomId);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourseNotFoundException("Room not found with id: " + roomId));

        return modelMapper.map(room, RoomDTO.class);
    }

    @Override
    @Transactional
    public void deleteRoomById(Long roomId) {
        log.info("Deleting the room with id : {} ", roomId);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourseNotFoundException("Room not found with id: " + roomId));

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // 🔥 FIXED: Primary Key (ID) check lagaya
        if (room.getHotel().getOwner() == null || !user.getId().equals(room.getHotel().getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own this room with id : " + roomId);
        }

        Hotel hotel = room.getHotel();

        inventoryService.deleteAllInventories(room);
        roomRepository.deleteById(roomId);

        if (hotel.getRooms() == null || hotel.getRooms().isEmpty()) {
            hotel.setActive(false);
            hotelRepository.save(hotel);
            log.info("Hotel {} deactivated because no rooms left", hotel.getId());
        } else if (Boolean.TRUE.equals(hotel.getActive())) {
            pricingUpdateService.updateHotelPrice(hotel);
        }
    }

    @Override
    @Transactional
    public RoomDTO updateRoomById(Long hotelId, Long roomId, RoomDTO roomDTO) {
        log.info("Update the room with ID : {}", roomId);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with ID : " + hotelId));

        User user = getCurrentUser();

        // 🔥 FIXED: Primary Key (ID) check lagaya
        if (hotel.getOwner() == null || !user.getId().equals(hotel.getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own the hotel with id: " + hotelId);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourseNotFoundException("Room not found with this ID : " + roomId));

        modelMapper.map(roomDTO, room);
        room.setId(roomId);
        room = roomRepository.save(room);

        return modelMapper.map(room, RoomDTO.class);
    }
}
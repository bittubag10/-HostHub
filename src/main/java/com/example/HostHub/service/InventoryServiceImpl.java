package com.example.HostHub.service;

import com.example.HostHub.dto.*;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Inventory;
import com.example.HostHub.entity.Room;
import com.example.HostHub.entity.User;
import com.example.HostHub.exception.ResourseNotFoundException;
import com.example.HostHub.exception.UnAuthorisedException;
import com.example.HostHub.repository.HotelMinPriceRepository;
import com.example.HostHub.repository.InventoryRepository;
import com.example.HostHub.repository.RoomRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import static com.example.HostHub.util.AppUtils.getCurrentUser;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryServiceImpl implements InventoryService {
    private final RoomRepository roomRepository;
    private final InventoryRepository inventoryRepository;
    private final ModelMapper modelMapper;
    private final HotelMinPriceRepository hotelMinPriceRepository;
    private final PricingUpdateService pricingUpdateService;

    @Override
    @Transactional
    public void initializeRoomForAYear(Room room) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusYears(1);

        for (LocalDate current = today; !current.isAfter(endDate); current = current.plusDays(1)) {
            Inventory inventory = Inventory.builder()
                    .hotel(room.getHotel())
                    .room(room)
                    .bookCount(0)
                    .reservedCount(0)
                    .city(room.getHotel().getCity())
                    .date(current)
                    .price(room.getBasePrice())
                    .surgeFactor(BigDecimal.ONE)
                    .totalCount(room.getTotalCount())
                    .closed(false)
                    .build();

            inventoryRepository.save(inventory);
        }
    }

    @Override
    @Transactional
    public void deleteAllInventories(Room room) {
        log.info("Deleting the inventories of room with id: {}", room.getId());
        inventoryRepository.deleteByRoom(room);
    }

    @Override
    @Transactional
    public Page<HotelPriceDto> searchHotel(HotelSearchRequest hotelSearchRequest) {
        Pageable pageable = PageRequest.of(hotelSearchRequest.getPage(), hotelSearchRequest.getSize());

        long dateCount = ChronoUnit.DAYS.between(hotelSearchRequest.getStartDate(),
                hotelSearchRequest.getEndDate()) + 1;

        log.info("Searching for city: {}, from {} to {}, rooms: {}, days: {}",
                hotelSearchRequest.getCity(), hotelSearchRequest.getStartDate(),
                hotelSearchRequest.getEndDate(), hotelSearchRequest.getRoomsCount(), dateCount);

        Page<HotelPriceDto> hotelPage = hotelMinPriceRepository.findHotelsWithAvailableInventory(
                hotelSearchRequest.getCity(),
                hotelSearchRequest.getStartDate(),
                hotelSearchRequest.getEndDate(),
                pageable
        );

        return hotelPage;
    }

    @Override
    public List<InventoryDto> getAllInventoryByRoom(Long roomId) {
        log.info("Getting All inventory by room for room with id: {}", roomId);

        Room room = roomRepository.findById(roomId).orElseThrow(() ->
                new ResourseNotFoundException("Room not found with this ID : " + roomId));

        User user = getCurrentUser();
        if (!user.getId().equals(room.getHotel().getOwner().getId())) {
            throw new AccessDeniedException("You are not the owner of this hotel for the room : " + roomId);
        }

        return inventoryRepository.findByRoomOrderByDate(room).stream()
                .map((element) -> modelMapper.map(element, InventoryDto.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateInventory(Long roomId, UpdateInventoryRequestDto updateInventoryRequestDto) {
        log.info("Updating All inventory by room for room with ID : {} between date range: {} - {}",
                roomId, updateInventoryRequestDto.getStartDate(), updateInventoryRequestDto.getEndDate());

        Room room = roomRepository.findById(roomId).orElseThrow(() ->
                new ResourseNotFoundException("Room not found with this ID : " + roomId));

        User user = getCurrentUser();
        if (room.getHotel().getOwner() == null || !user.getId().equals(room.getHotel().getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own this room with id : " + roomId);
        }

        if (updateInventoryRequestDto.getEndDate().isBefore(updateInventoryRequestDto.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date for inventory update");
        }

        inventoryRepository.getInventoryAndLockBeforeUpdate(
                roomId,
                updateInventoryRequestDto.getStartDate(),
                updateInventoryRequestDto.getEndDate()
        );

        inventoryRepository.updateInventory(
                roomId,
                updateInventoryRequestDto.getStartDate(),
                updateInventoryRequestDto.getEndDate(),
                updateInventoryRequestDto.getClosed(),
                updateInventoryRequestDto.getSurgeFactor()
        );

        pricingUpdateService.updateHotelPrice(room.getHotel());
    }
}
package com.example.HostHub.service;

import com.example.HostHub.dto.HotelDTO;
import com.example.HostHub.dto.HotelInfoDto;
import com.example.HostHub.dto.HotelPriceDto;
import com.example.HostHub.dto.HotelSearchRequest;
import com.example.HostHub.dto.RoomDTO;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Room;
import com.example.HostHub.entity.User;
import com.example.HostHub.exception.ResourseNotFoundException;
import com.example.HostHub.exception.UnAuthorisedException;
import com.example.HostHub.repository.HotelMinPriceRepository;
import com.example.HostHub.repository.HotelRepository;
import com.example.HostHub.repository.RoomRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import static com.example.HostHub.util.AppUtils.getCurrentUser;

@Service
@RequiredArgsConstructor
@Slf4j
public class HotelServiceImpl implements HotelService {

    private final HotelRepository hotelRepository;
    private final InventoryService inventoryService;
    private final RoomRepository roomRepository;
    private final ModelMapper modelMapper;
    private final PricingUpdateService pricingUpdateService;
    private final StorageService storageService;
    private final HotelMinPriceRepository hotelMinPriceRepository;

    @Override
    public HotelDTO createNewHotel(HotelDTO hotelDTO) {
        log.info("Creating a new hotel with name : {}", hotelDTO.getName());
        Hotel hotel = modelMapper.map(hotelDTO, Hotel.class);
        hotel.setActive(false);

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        hotel.setOwner(user);

        hotel = hotelRepository.save(hotel);
        log.info("Created a new hotel with id : {}", hotel.getId());
        return modelMapper.map(hotel, HotelDTO.class);
    }

    @Override
    public HotelDTO getHotelById(Long id) {
        log.info("Getting the hotel with id: {}", id);
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with id: " + id));

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();


        if (hotel.getOwner() == null || !user.getId().equals(hotel.getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own this hotel with id : " + id);
        }

        return modelMapper.map(hotel, HotelDTO.class);
    }

    @Override
    public HotelDTO updateHotelById(Long id, HotelDTO hotelDTO) {
        log.info("updating the hotel with id: {}", id);
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with id: " + id));
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // 🔥 FIXED: Primary Key (ID) check lagaya
        if (hotel.getOwner() == null || !user.getId().equals(hotel.getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own this hotel with id : " + id);
        }

        modelMapper.map(hotelDTO, hotel);
        hotel.setId(id);
        hotel = hotelRepository.save(hotel);
        return modelMapper.map(hotel, HotelDTO.class);
    }

    @Override
    @Transactional
    public void deleteHotelById(Long id) {
        log.info("Deleting the hotel with id: {}", id);
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with id: " + id));

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // 🔥 FIXED: Primary Key (ID) check lagaya
        if (hotel.getOwner() == null || !user.getId().equals(hotel.getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own this hotel with id : " + id);
        }

        if (hotel.getRooms() != null) {
            for (Room room : hotel.getRooms()) {
                inventoryService.deleteAllInventories(room);
                roomRepository.deleteById(room.getId());
            }
        }
        hotelRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void activateHotel(Long hotelId) {
        log.info("Activating the hotel with id: {}", hotelId);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with id: " + hotelId));

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // 🔥 FIXED: Primary Key (ID) check lagaya
        if (hotel.getOwner() == null || !user.getId().equals(hotel.getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own this hotel with id : " + hotelId);
        }

        hotel.setActive(true);

        if (hotel.getRooms() != null) {
            for (Room room : hotel.getRooms()) {
                inventoryService.initializeRoomForAYear(room);
            }
        }
        hotel = hotelRepository.save(hotel);
        pricingUpdateService.updateHotelPrice(hotel);
    }

    @Override
    public HotelInfoDto getHotelInfoById(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with id: " + hotelId));

        List<RoomDTO> rooms = hotel.getRooms()
                .stream()
                .map((element) -> modelMapper.map(element, RoomDTO.class))
                .toList();

        return new HotelInfoDto(modelMapper.map(hotel, HotelDTO.class), rooms);
    }

    @Override
    public List<HotelDTO> getAllHotels() {
        User user = getCurrentUser();
        log.info("Getting all hotels for the admin user with ID : {}", user.getId());
        List<Hotel> hotels = hotelRepository.findByOwner(user);

        return hotels.stream()
                .map((element) -> modelMapper.map(element, HotelDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public HotelDTO addPhotos(Long hotelId, MultipartFile[] files) {
        log.info("Adding photos to hotel with id: {}", hotelId);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with id: " + hotelId));

        User user = getCurrentUser();
        if (hotel.getOwner() == null || !user.getId().equals(hotel.getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own this hotel with id : " + hotelId);
        }

        List<String> newUrls = storageService.storeFiles(files);
        if (!newUrls.isEmpty()) {
            List<String> photoList = new ArrayList<>();
            if (hotel.getPhoto() != null) {
                photoList.addAll(Arrays.asList(hotel.getPhoto()));
            }
            photoList.addAll(newUrls);
            hotel.setPhoto(photoList.toArray(new String[0]));
            hotel = hotelRepository.save(hotel);
        }

        return modelMapper.map(hotel, HotelDTO.class);
    }

    @Override
    @Transactional
    public HotelDTO removePhoto(Long hotelId, String photoUrl) {
        log.info("Removing photo {} from hotel with id: {}", photoUrl, hotelId);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with id: " + hotelId));

        User user = getCurrentUser();
        if (hotel.getOwner() == null || !user.getId().equals(hotel.getOwner().getId())) {
            throw new UnAuthorisedException("This user does not own this hotel with id : " + hotelId);
        }

        if (hotel.getPhoto() != null && photoUrl != null) {
            List<String> photoList = new ArrayList<>(Arrays.asList(hotel.getPhoto()));
            boolean removed = photoList.remove(photoUrl.trim());
            if (removed) {
                storageService.deleteFile(photoUrl);
                hotel.setPhoto(photoList.toArray(new String[0]));
                hotel = hotelRepository.save(hotel);
            }
        }

        return modelMapper.map(hotel, HotelDTO.class);
    }

    @Override
    public List<String> getAllActiveCities() {
        log.info("Fetching all active cities");
        return hotelRepository.findDistinctActiveCities();
    }

    @Override
    @Transactional
    public Page<HotelPriceDto> searchHotels(HotelSearchRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate()) || request.getEndDate().isEqual(request.getStartDate())) {
            throw new IllegalArgumentException("Check-out date must be after check-in date");
        }

        LocalDate actualEndDate = request.getEndDate().minusDays(1);
        long dateCount = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());

        log.info("Searching hotels in {} from {} to {} ({} nights), rooms: {}",
                request.getCity(), request.getStartDate(), actualEndDate, dateCount, request.getRoomsCount());

        List<HotelPriceDto> candidates = hotelMinPriceRepository.findHotelsWithAvailableInventory(
                request.getCity(),
                request.getStartDate(),
                actualEndDate,
                request.getRoomsCount(),
                dateCount
        );

        // Apply price range filtering
        if (request.getMinPrice() != null) {
            double min = request.getMinPrice().doubleValue();
            candidates = candidates.stream()
                    .filter(c -> c.getPrice() != null && c.getPrice() >= min)
                    .collect(Collectors.toList());
        }
        if (request.getMaxPrice() != null) {
            double max = request.getMaxPrice().doubleValue();
            candidates = candidates.stream()
                    .filter(c -> c.getPrice() != null && c.getPrice() <= max)
                    .collect(Collectors.toList());
        }

        // Apply amenities filter (case-insensitive: hotel must contain all requested amenities)
        if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
            List<String> requiredAmenities = request.getAmenities().stream()
                    .filter(a -> a != null && !a.isBlank())
                    .map(a -> a.trim().toLowerCase())
                    .toList();

            if (!requiredAmenities.isEmpty()) {
                candidates = candidates.stream()
                        .filter(c -> {
                            String[] hotelAmenities = c.getHotel().getAmenities();
                            if (hotelAmenities == null || hotelAmenities.length == 0) {
                                return false;
                            }
                            Set<String> hotelSet = Arrays.stream(hotelAmenities)
                                    .map(String::toLowerCase)
                                    .collect(Collectors.toSet());
                            return hotelSet.containsAll(requiredAmenities);
                        })
                        .collect(Collectors.toList());
            }
        }

        // Apply sorting
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "PRICE_ASC";
        Comparator<HotelPriceDto> comparator = switch (sortBy.toUpperCase()) {
            case "PRICE_DESC" -> Comparator.comparing(HotelPriceDto::getPrice, Comparator.nullsLast(Comparator.reverseOrder()));
            case "NAME_ASC" -> Comparator.comparing(
                    c -> c.getHotel().getName() != null ? c.getHotel().getName() : "",
                    String.CASE_INSENSITIVE_ORDER
            );
            case "PRICE_ASC" -> Comparator.comparing(HotelPriceDto::getPrice, Comparator.nullsLast(Comparator.naturalOrder()));
            default -> Comparator.comparing(HotelPriceDto::getPrice, Comparator.nullsLast(Comparator.naturalOrder()));
        };

        candidates.sort(comparator);

        // Apply pagination
        int page = request.getPage() != null && request.getPage() >= 0 ? request.getPage() : 0;
        int size = request.getSize() != null && request.getSize() > 0 ? request.getSize() : 10;
        int total = candidates.size();
        int start = Math.min(page * size, total);
        int end = Math.min(start + size, total);
        List<HotelPriceDto> pageList = candidates.subList(start, end);

        Pageable pageable = PageRequest.of(page, size);
        return new PageImpl<>(pageList, pageable, total);
    }
}
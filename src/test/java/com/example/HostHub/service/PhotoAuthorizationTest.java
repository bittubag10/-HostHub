package com.example.HostHub.service;

import com.example.HostHub.Enum.Roles;
import com.example.HostHub.dto.HotelDTO;
import com.example.HostHub.dto.RoomDTO;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Room;
import com.example.HostHub.entity.User;
import com.example.HostHub.exception.UnAuthorisedException;
import com.example.HostHub.repository.HotelRepository;
import com.example.HostHub.repository.RoomRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PhotoAuthorizationTest {

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private ModelMapper modelMapper;

    @Mock
    private PricingUpdateService pricingUpdateService;

    @InjectMocks
    private HotelServiceImpl hotelService;

    @InjectMocks
    private RoomServiceImpl roomService;

    private User ownerUser;
    private User intruderManager;
    private Hotel hotel;
    private Room room;

    @BeforeEach
    void setUp() {
        ownerUser = new User();
        ownerUser.setId(10L);
        ownerUser.setEmail("owner@hotel.com");
        ownerUser.setRoles(Set.of(Roles.HOTEL_MANAGER));

        intruderManager = new User();
        intruderManager.setId(99L);
        intruderManager.setEmail("intruder@other.com");
        intruderManager.setRoles(Set.of(Roles.HOTEL_MANAGER));

        hotel = new Hotel();
        hotel.setId(100L);
        hotel.setName("Sunrise Resort");
        hotel.setOwner(ownerUser);
        hotel.setPhoto(new String[]{"/uploads/old1.jpg"});

        room = new Room();
        room.setId(200L);
        room.setType("Ocean Suite");
        room.setHotel(hotel);
        room.setPhoto(new String[]{"/uploads/room_old1.jpg"});
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(User user) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Owner should successfully add photos to their hotel")
    void testAddHotelPhotos_OwnerSuccess() {
        authenticateAs(ownerUser);
        when(hotelRepository.findById(100L)).thenReturn(Optional.of(hotel));
        when(storageService.storeFiles(any())).thenReturn(List.of("/uploads/new1.jpg"));
        when(hotelRepository.save(any(Hotel.class))).thenReturn(hotel);

        HotelDTO expectedDto = new HotelDTO();
        expectedDto.setId(100L);
        expectedDto.setPhoto(new String[]{"/uploads/old1.jpg", "/uploads/new1.jpg"});
        when(modelMapper.map(any(Hotel.class), eq(HotelDTO.class))).thenReturn(expectedDto);

        MockMultipartFile file = new MockMultipartFile("files", "test.jpg", "image/jpeg", "content".getBytes());
        HotelDTO result = hotelService.addPhotos(100L, new MultipartFile[]{file});

        assertNotNull(result);
        assertEquals(2, result.getPhoto().length);
        verify(hotelRepository, times(1)).save(hotel);
    }

    @Test
    @DisplayName("Non-owner manager must be rejected when adding photos to another manager's hotel")
    void testAddHotelPhotos_NonOwnerRejected() {
        authenticateAs(intruderManager);
        when(hotelRepository.findById(100L)).thenReturn(Optional.of(hotel));

        MockMultipartFile file = new MockMultipartFile("files", "test.jpg", "image/jpeg", "content".getBytes());

        assertThrows(UnAuthorisedException.class, () ->
                hotelService.addPhotos(100L, new MultipartFile[]{file}));

        verify(storageService, never()).storeFiles(any());
        verify(hotelRepository, never()).save(any());
    }

    @Test
    @DisplayName("Non-owner manager must be rejected when deleting photos from another manager's hotel")
    void testRemoveHotelPhoto_NonOwnerRejected() {
        authenticateAs(intruderManager);
        when(hotelRepository.findById(100L)).thenReturn(Optional.of(hotel));

        assertThrows(UnAuthorisedException.class, () ->
                hotelService.removePhoto(100L, "/uploads/old1.jpg"));

        verify(storageService, never()).deleteFile(any());
        verify(hotelRepository, never()).save(any());
    }

    @Test
    @DisplayName("Owner should successfully remove photo from hotel")
    void testRemoveHotelPhoto_OwnerSuccess() {
        authenticateAs(ownerUser);
        when(hotelRepository.findById(100L)).thenReturn(Optional.of(hotel));
        when(hotelRepository.save(any(Hotel.class))).thenReturn(hotel);

        HotelDTO expectedDto = new HotelDTO();
        expectedDto.setId(100L);
        expectedDto.setPhoto(new String[0]);
        when(modelMapper.map(any(Hotel.class), eq(HotelDTO.class))).thenReturn(expectedDto);

        HotelDTO result = hotelService.removePhoto(100L, "/uploads/old1.jpg");

        assertNotNull(result);
        verify(storageService, times(1)).deleteFile("/uploads/old1.jpg");
        verify(hotelRepository, times(1)).save(hotel);
    }

    @Test
    @DisplayName("Non-owner manager must be rejected when adding photos to a room in another manager's hotel")
    void testAddRoomPhotos_NonOwnerRejected() {
        authenticateAs(intruderManager);
        when(hotelRepository.findById(100L)).thenReturn(Optional.of(hotel));

        MockMultipartFile file = new MockMultipartFile("files", "room.jpg", "image/jpeg", "content".getBytes());

        assertThrows(UnAuthorisedException.class, () ->
                roomService.addPhotos(100L, 200L, new MultipartFile[]{file}));

        verify(storageService, never()).storeFiles(any());
        verify(roomRepository, never()).save(any());
    }

    @Test
    @DisplayName("Non-owner manager must be rejected when deleting photos from a room in another manager's hotel")
    void testRemoveRoomPhoto_NonOwnerRejected() {
        authenticateAs(intruderManager);
        when(hotelRepository.findById(100L)).thenReturn(Optional.of(hotel));

        assertThrows(UnAuthorisedException.class, () ->
                roomService.removePhoto(100L, 200L, "/uploads/room_old1.jpg"));

        verify(storageService, never()).deleteFile(any());
        verify(roomRepository, never()).save(any());
    }

    @Test
    @DisplayName("Owner should successfully add and remove room photos")
    void testRoomPhoto_OwnerSuccess() {
        authenticateAs(ownerUser);
        when(hotelRepository.findById(100L)).thenReturn(Optional.of(hotel));
        when(roomRepository.findById(200L)).thenReturn(Optional.of(room));
        when(storageService.storeFiles(any())).thenReturn(List.of("/uploads/room_new.jpg"));
        when(roomRepository.save(any(Room.class))).thenReturn(room);

        RoomDTO expectedDto = new RoomDTO();
        expectedDto.setId(200L);
        when(modelMapper.map(any(Room.class), eq(RoomDTO.class))).thenReturn(expectedDto);

        MockMultipartFile file = new MockMultipartFile("files", "room.jpg", "image/jpeg", "content".getBytes());
        RoomDTO addResult = roomService.addPhotos(100L, 200L, new MultipartFile[]{file});

        assertNotNull(addResult);
        verify(storageService, times(1)).storeFiles(any());

        // Remove photo
        roomService.removePhoto(100L, 200L, "/uploads/room_old1.jpg");
        verify(storageService, times(1)).deleteFile("/uploads/room_old1.jpg");
    }
}

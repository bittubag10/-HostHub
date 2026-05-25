package com.example.HostHub.service;

import com.example.HostHub.Enum.BookingStatus;
import com.example.HostHub.dto.BookingDto;
import com.example.HostHub.dto.BookingRequest;
import com.example.HostHub.dto.GuestDto;
import com.example.HostHub.entity.*;
import com.example.HostHub.exception.ResourseNotFoundException;
import com.example.HostHub.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService{
    private final BookingRepository bookingRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final InventoryRepository inventoryRepository;
    private final GuestRepository guestRepository;
    private final ModelMapper modelMapper;


//    @Override
//    @Transactional
//    public BookingDto initialiseBooking(BookingRequest bookingRequest) {
//
//        log.info("Initialising booking for hotel : {}, room: {}, date {}-{}",bookingRequest.getHotelId(),
//                bookingRequest.getRoomId(),bookingRequest.getCheckInDate(),bookingRequest.getCheckOutDate());
//
//
//        Hotel hotel=hotelRepository.findById(bookingRequest.getHotelId()).orElseThrow(()->
//                new ResourseNotFoundException("Hotel not found with id: "+bookingRequest.getHotelId()));
//
//        Room room=roomRepository.findById(bookingRequest.getRoomId()).orElseThrow(()->
//                new ResourseNotFoundException("Room not found with this id : "+ bookingRequest.getRoomId()));
//
//        LocalDate actualEndDate = bookingRequest.getCheckOutDate().minusDays(1);
//
//        List<Inventory>inventoryList=inventoryRepository.findAndLockAvailableInventory(room.getId(),
//                bookingRequest.getCheckInDate(),bookingRequest.getCheckOutDate(), bookingRequest.getRoomCount());
//
//        long daysCount= ChronoUnit.DAYS.between(bookingRequest.getCheckInDate(),bookingRequest.getCheckOutDate())+1;
//
//        if (inventoryList.size()!=daysCount){
//            throw new IllegalArgumentException("Room is not available anymore");
//        }
//        //reserve the room / update the booked count of inventory
//
//        for (Inventory inventory: inventoryList){
//            inventory.setBookCount(inventory.getBookCount()+bookingRequest.getRoomCount());
//
//        }
//        inventoryRepository.saveAll(inventoryList);
//
//
//        //create the booking
//
//        User user=new User();
//        user.setId(1L); //TODO: REMOVE DUMMY USER
//
//        //TODO: CALCULATE DYNAMIC AMOUNT
//
//        Booking booking=Booking.builder()
//                .bookingStatus(BookingStatus.RESERVED)
//                .hotel(hotel)
//                .room(room)
//                .chackInDate(bookingRequest.getCheckInDate())
//                .checkOutDate(bookingRequest.getCheckOutDate())
//                .user(user)
//                .roomsCount(bookingRequest.getRoomCount())
//                .amount(BigDecimal.TEN)
//                .build();
//        booking=bookingRepository.save(booking);
//        return modelMapper.map(booking, BookingDto.class);
//
//
//    }


    @Override
    @Transactional
    public BookingDto initialiseBooking(BookingRequest bookingRequest) {

        log.info("Initialising booking for hotel : {}, room: {}, date {}-{}", bookingRequest.getHotelId(),
                bookingRequest.getRoomId(), bookingRequest.getCheckInDate(), bookingRequest.getCheckOutDate());

        Hotel hotel = hotelRepository.findById(bookingRequest.getHotelId()).orElseThrow(() ->
                new ResourseNotFoundException("Hotel not found with id: " + bookingRequest.getHotelId()));

        Room room = roomRepository.findById(bookingRequest.getRoomId()).orElseThrow(() ->
                new ResourseNotFoundException("Room not found with this id : " + bookingRequest.getRoomId()));

        LocalDate actualEndDate = bookingRequest.getCheckOutDate().minusDays(1);

        List<Inventory> inventoryList = inventoryRepository.findAndLockAvailableInventory(
                room.getId(),
                bookingRequest.getCheckInDate(),
                actualEndDate,
                bookingRequest.getRoomCount()
        );

        long daysCount = ChronoUnit.DAYS.between(bookingRequest.getCheckInDate(), bookingRequest.getCheckOutDate());

        if (inventoryList.size() != daysCount) {
            throw new IllegalArgumentException("Room is not available anymore");
        }

        for (Inventory inventory : inventoryList) {
            inventory.setReservedCount(inventory.getReservedCount() + bookingRequest.getRoomCount());
        }

        inventoryRepository.saveAllAndFlush(inventoryList);



        // TODO: CALCULATE DYNAMIC AMOUNT

        Booking booking = Booking.builder()
                .bookingStatus(BookingStatus.RESERVED)
                .hotel(hotel)
                .room(room)
                .chackInDate(bookingRequest.getCheckInDate())
                .checkOutDate(bookingRequest.getCheckOutDate())
                .user(getCurrentUser())
                .roomsCount(bookingRequest.getRoomCount())
                .amount(BigDecimal.TEN)
                .build();

        booking = bookingRepository.save(booking);


        return modelMapper.map(booking, BookingDto.class);
    }

    @Override
    public BookingDto addGuests(Long bookingId, List<GuestDto> guestDtoList) {
        log.info("Adding guests for booking with id: {}",bookingId);

        Booking booking=bookingRepository.findById(bookingId).orElseThrow(()->
                new ResourseNotFoundException("Booking not found with this id: "+bookingId));

        if (hasBookingExpired(booking)){
            throw new IllegalArgumentException("Booking has already expired");
        }

        if (booking.getBookingStatus() != BookingStatus.RESERVED){
            throw new IllegalArgumentException("Booking is not under reserved state, cannot add guests");

        }

        for (GuestDto guestDto: guestDtoList){
            Guest guest=modelMapper.map(guestDto, Guest.class);
            guest.setUser(getCurrentUser());
            guest=guestRepository.save(guest);
            booking.getGuests().add(guest);

        }

        booking.setBookingStatus(BookingStatus.GUESTS_ADDED);
        booking=bookingRepository.save(booking);
        return modelMapper.map(booking, BookingDto.class);
    }

    public boolean hasBookingExpired(Booking booking){
        return booking.getCreatedAt().plusMinutes(10).isBefore(LocalDateTime.now());
    }

    public User getCurrentUser(){
        User user = new User();
        user.setId(1L);
        return user;
    }
}

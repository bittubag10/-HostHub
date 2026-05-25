package com.example.HostHub.dto;

import com.example.HostHub.Enum.BookingStatus;
import com.example.HostHub.entity.Guest;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Room;
import com.example.HostHub.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingDto {

    private Long id;
    private HotelDTO hotel;
    private RoomDTO room;
    //private User user;
    private Integer roomsCount;
    private LocalDate chackInDate;
    private LocalDate checkOutDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private BookingStatus bookingStatus;
    private Set<Guest> guests;
}

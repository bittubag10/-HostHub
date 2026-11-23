package com.example.HostHub.repository;

import com.example.HostHub.entity.Booking;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking,Long> {


    List<Booking> findByHotel(Hotel hotel);

    List<Booking> findByHotelAndCreatedAtBetween(Hotel hotel, LocalDateTime startDateTime, LocalDateTime endDateTime);

    List<Booking>findByUser(User user);

    Optional<Booking> findByIdempotencyKey(String idempotencyKey);

    List<Booking> findByBookingStatusInAndExpiresAtBefore(
            List<com.example.HostHub.Enum.BookingStatus> statuses,
            LocalDateTime expiresAt
    );

//    Optional<Booking> findByPaymentSessionId(String sessionId);
    Optional<Booking> findByPaymentSessionIdIgnoreCase(String sessionId);
}

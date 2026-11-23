package com.example.HostHub.repository;

import com.example.HostHub.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByHotelIdOrderByCreatedAtDesc(Long hotelId, Pageable pageable);

    boolean existsByBookingId(Long bookingId);

    Optional<Review> findByBookingId(Long bookingId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.hotel.id = :hotelId")
    Double calculateAverageRatingByHotelId(@Param("hotelId") Long hotelId);

    Long countByHotelId(Long hotelId);
}

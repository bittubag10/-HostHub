package com.example.HostHub.service;

import com.example.HostHub.Enum.BookingStatus;
import com.example.HostHub.dto.ReviewDto;
import com.example.HostHub.dto.ReviewRequestDto;
import com.example.HostHub.entity.Booking;
import com.example.HostHub.entity.Hotel;
import com.example.HostHub.entity.Review;
import com.example.HostHub.entity.User;
import com.example.HostHub.exception.ResourseNotFoundException;
import com.example.HostHub.exception.UnAuthorisedException;
import com.example.HostHub.repository.BookingRepository;
import com.example.HostHub.repository.HotelRepository;
import com.example.HostHub.repository.ReviewRepository;
import com.example.HostHub.util.AppUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final HotelRepository hotelRepository;
    private final BookingRepository bookingRepository;

    @Override
    @Transactional
    public ReviewDto createReview(Long hotelId, ReviewRequestDto requestDto) {
        log.info("Creating review for hotel {} with booking {}", hotelId, requestDto.getBookingId());
        User currentUser = AppUtils.getCurrentUser();

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourseNotFoundException("Hotel not found with id: " + hotelId));

        Booking booking = bookingRepository.findById(requestDto.getBookingId())
                .orElseThrow(() -> new ResourseNotFoundException("Booking not found with id: " + requestDto.getBookingId()));

        if (!booking.getHotel().getId().equals(hotelId)) {
            throw new IllegalStateException("Booking does not belong to hotel with id: " + hotelId);
        }

        if (booking.getUser() == null || !booking.getUser().getId().equals(currentUser.getId())) {
            throw new UnAuthorisedException("User is not authorized to review this booking");
        }

        if (booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed bookings can be reviewed");
        }

        if (reviewRepository.existsByBookingId(requestDto.getBookingId())) {
            throw new IllegalStateException("Booking has already been reviewed");
        }

        Review review = Review.builder()
                .hotel(hotel)
                .user(currentUser)
                .booking(booking)
                .rating(requestDto.getRating())
                .comment(requestDto.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);
        updateHotelRating(hotel);

        return mapToDto(savedReview);
    }

    @Override
    public Page<ReviewDto> getHotelReviews(Long hotelId, Pageable pageable) {
        if (!hotelRepository.existsById(hotelId)) {
            throw new ResourseNotFoundException("Hotel not found with id: " + hotelId);
        }

        return reviewRepository.findByHotelIdOrderByCreatedAtDesc(hotelId, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId) {
        log.info("Deleting review with id: {}", reviewId);
        User currentUser = AppUtils.getCurrentUser();

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourseNotFoundException("Review not found with id: " + reviewId));

        if (review.getUser() == null || !review.getUser().getId().equals(currentUser.getId())) {
            throw new UnAuthorisedException("User is not authorized to delete this review");
        }

        Hotel hotel = review.getHotel();
        reviewRepository.delete(review);
        updateHotelRating(hotel);
    }

    private void updateHotelRating(Hotel hotel) {
        Double avg = reviewRepository.calculateAverageRatingByHotelId(hotel.getId());
        Long count = reviewRepository.countByHotelId(hotel.getId());

        if (count == null || count == 0 || avg == null) {
            hotel.setAverageRating(0.0);
            hotel.setReviewCount(0);
        } else {
            double roundedAvg = Math.round(avg * 10.0) / 10.0;
            hotel.setAverageRating(roundedAvg);
            hotel.setReviewCount(count.intValue());
        }
        hotelRepository.save(hotel);
    }

    private ReviewDto mapToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .hotelId(review.getHotel() != null ? review.getHotel().getId() : null)
                .hotelName(review.getHotel() != null ? review.getHotel().getName() : null)
                .bookingId(review.getBooking() != null ? review.getBooking().getId() : null)
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .userName(review.getUser() != null ? review.getUser().getName() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}

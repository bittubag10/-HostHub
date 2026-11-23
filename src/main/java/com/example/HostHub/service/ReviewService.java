package com.example.HostHub.service;

import com.example.HostHub.dto.ReviewDto;
import com.example.HostHub.dto.ReviewRequestDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {

    ReviewDto createReview(Long hotelId, ReviewRequestDto requestDto);

    Page<ReviewDto> getHotelReviews(Long hotelId, Pageable pageable);

    void deleteReview(Long reviewId);
}

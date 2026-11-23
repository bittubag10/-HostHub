package com.example.HostHub.controller;

import com.example.HostHub.dto.ReviewDto;
import com.example.HostHub.dto.ReviewRequestDto;
import com.example.HostHub.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/hotels/{hotelId}/reviews")
    public ResponseEntity<ReviewDto> createReview(
            @PathVariable Long hotelId,
            @Valid @RequestBody ReviewRequestDto requestDto
    ) {
        ReviewDto review = reviewService.createReview(hotelId, requestDto);
        return new ResponseEntity<>(review, HttpStatus.CREATED);
    }

    @GetMapping("/hotels/{hotelId}/reviews")
    public ResponseEntity<Page<ReviewDto>> getHotelReviews(
            @PathVariable Long hotelId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(reviewService.getHotelReviews(hotelId, pageable));
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.noContent().build();
    }
}

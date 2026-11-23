package com.example.HostHub.service;

import com.example.HostHub.Enum.BookingStatus;
import com.example.HostHub.Enum.Roles;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User guestUser;
    private User otherUser;
    private Hotel hotel;
    private Booking confirmedBooking;

    @BeforeEach
    void setUp() {
        guestUser = new User();
        guestUser.setId(1L);
        guestUser.setEmail("guest@example.com");
        guestUser.setName("John Guest");
        guestUser.setRoles(Set.of(Roles.GUEST));

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@example.com");
        otherUser.setName("Other Person");
        otherUser.setRoles(Set.of(Roles.GUEST));

        hotel = new Hotel();
        hotel.setId(10L);
        hotel.setName("Grand Palace");
        hotel.setAverageRating(0.0);
        hotel.setReviewCount(0);

        confirmedBooking = Booking.builder()
                .id(100L)
                .hotel(hotel)
                .user(guestUser)
                .bookingStatus(BookingStatus.CONFIRMED)
                .build();
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
    @DisplayName("1. Eligible CONFIRMED booking review submission and average rating recalculation")
    void testCreateReview_Success() {
        authenticateAs(guestUser);

        ReviewRequestDto requestDto = ReviewRequestDto.builder()
                .bookingId(100L)
                .rating(5)
                .comment("Magnificent stay!")
                .build();

        Review savedReview = Review.builder()
                .id(1L)
                .hotel(hotel)
                .user(guestUser)
                .booking(confirmedBooking)
                .rating(5)
                .comment("Magnificent stay!")
                .createdAt(LocalDateTime.now())
                .build();

        when(hotelRepository.findById(10L)).thenReturn(Optional.of(hotel));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(confirmedBooking));
        when(reviewRepository.existsByBookingId(100L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);

        // Recalculation mocks
        when(reviewRepository.calculateAverageRatingByHotelId(10L)).thenReturn(4.6666);
        when(reviewRepository.countByHotelId(10L)).thenReturn(3L);

        ReviewDto result = reviewService.createReview(10L, requestDto);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(5, result.getRating());
        assertEquals("Magnificent stay!", result.getComment());
        assertEquals("John Guest", result.getUserName());

        // Verify hotel rating updated and rounded to 1 decimal place (4.7)
        verify(hotelRepository, times(1)).save(hotel);
        assertEquals(4.7, hotel.getAverageRating());
        assertEquals(3, hotel.getReviewCount());
    }

    @Test
    @DisplayName("2. Duplicate review rejection: cannot review same booking twice")
    void testCreateReview_DuplicateReviewRejection() {
        authenticateAs(guestUser);

        ReviewRequestDto requestDto = ReviewRequestDto.builder()
                .bookingId(100L)
                .rating(4)
                .comment("Second attempt")
                .build();

        when(hotelRepository.findById(10L)).thenReturn(Optional.of(hotel));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(confirmedBooking));
        when(reviewRepository.existsByBookingId(100L)).thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                reviewService.createReview(10L, requestDto)
        );

        assertTrue(ex.getMessage().contains("already been reviewed"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("3. Unconfirmed booking rejection: only CONFIRMED bookings can be reviewed")
    void testCreateReview_UnconfirmedBookingRejection() {
        authenticateAs(guestUser);

        Booking reservedBooking = Booking.builder()
                .id(101L)
                .hotel(hotel)
                .user(guestUser)
                .bookingStatus(BookingStatus.RESERVED)
                .build();

        ReviewRequestDto requestDto = ReviewRequestDto.builder()
                .bookingId(101L)
                .rating(4)
                .comment("Premature review")
                .build();

        when(hotelRepository.findById(10L)).thenReturn(Optional.of(hotel));
        when(bookingRepository.findById(101L)).thenReturn(Optional.of(reservedBooking));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                reviewService.createReview(10L, requestDto)
        );

        assertTrue(ex.getMessage().contains("Only confirmed bookings can be reviewed"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("4. Unauthorized user rejection: cannot review another user's booking")
    void testCreateReview_UnauthorizedUserRejection() {
        authenticateAs(otherUser); // Authenticated as different user

        ReviewRequestDto requestDto = ReviewRequestDto.builder()
                .bookingId(100L)
                .rating(5)
                .comment("Unauthorized review")
                .build();

        when(hotelRepository.findById(10L)).thenReturn(Optional.of(hotel));
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(confirmedBooking));

        assertThrows(UnAuthorisedException.class, () ->
                reviewService.createReview(10L, requestDto)
        );

        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("5. Mismatched hotel rejection: booking must belong to the requested hotel")
    void testCreateReview_MismatchedHotelRejection() {
        authenticateAs(guestUser);

        ReviewRequestDto requestDto = ReviewRequestDto.builder()
                .bookingId(100L)
                .rating(5)
                .comment("Wrong hotel")
                .build();

        when(hotelRepository.findById(999L)).thenReturn(Optional.of(hotel)); // Passing hotelId 999
        when(bookingRepository.findById(100L)).thenReturn(Optional.of(confirmedBooking)); // Booking belongs to hotel 10

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                reviewService.createReview(999L, requestDto)
        );

        assertTrue(ex.getMessage().contains("does not belong to hotel"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("6. Author can delete review and hotel rating recalculates")
    void testDeleteReview_Success() {
        authenticateAs(guestUser);

        Review review = Review.builder()
                .id(50L)
                .hotel(hotel)
                .user(guestUser)
                .booking(confirmedBooking)
                .rating(5)
                .build();

        when(reviewRepository.findById(50L)).thenReturn(Optional.of(review));
        when(reviewRepository.calculateAverageRatingByHotelId(10L)).thenReturn(null);
        when(reviewRepository.countByHotelId(10L)).thenReturn(0L);

        reviewService.deleteReview(50L);

        verify(reviewRepository, times(1)).delete(review);
        verify(hotelRepository, times(1)).save(hotel);
        assertEquals(0.0, hotel.getAverageRating());
        assertEquals(0, hotel.getReviewCount());
    }

    @Test
    @DisplayName("7. Non-author cannot delete review")
    void testDeleteReview_UnauthorizedRejection() {
        authenticateAs(otherUser);

        Review review = Review.builder()
                .id(50L)
                .hotel(hotel)
                .user(guestUser)
                .booking(confirmedBooking)
                .rating(5)
                .build();

        when(reviewRepository.findById(50L)).thenReturn(Optional.of(review));

        assertThrows(UnAuthorisedException.class, () ->
                reviewService.deleteReview(50L)
        );

        verify(reviewRepository, never()).delete(any());
    }

    @Test
    @DisplayName("8. Public paginated reviews retrieval")
    void testGetHotelReviews_Success() {
        Pageable pageable = PageRequest.of(0, 5);
        Review review = Review.builder()
                .id(1L)
                .hotel(hotel)
                .user(guestUser)
                .booking(confirmedBooking)
                .rating(4)
                .comment("Nice place")
                .createdAt(LocalDateTime.now())
                .build();

        when(hotelRepository.existsById(10L)).thenReturn(true);
        when(reviewRepository.findByHotelIdOrderByCreatedAtDesc(10L, pageable))
                .thenReturn(new PageImpl<>(List.of(review), pageable, 1));

        Page<ReviewDto> result = reviewService.getHotelReviews(10L, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(4, result.getContent().get(0).getRating());
        assertEquals("Nice place", result.getContent().get(0).getComment());
    }
}

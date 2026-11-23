package com.example.HostHub.service;

import com.example.HostHub.entity.Booking;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailNotificationServiceImpl implements EmailNotificationService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.from:noreply@hosthub.com}")
    private String mailFrom;

    @Async
    @Override
    public void sendBookingConfirmation(Booking booking) {
        if (booking == null || booking.getUser() == null) {
            log.warn("Cannot send booking confirmation: booking or user is null");
            return;
        }

        String to = booking.getUser().getEmail();
        String hotelName = booking.getHotel() != null ? booking.getHotel().getName() : "HostHub Hotel";
        String userName = booking.getUser().getName() != null ? booking.getUser().getName() : "Guest";

        String subject = "Booking Confirmed - #" + booking.getId() + " at " + hotelName;
        String body = String.format(
                "Dear %s,\n\n" +
                "Great news! Your booking at %s has been CONFIRMED.\n\n" +
                "Booking Details:\n" +
                "  Booking ID: %d\n" +
                "  Check-in:   %s\n" +
                "  Check-out:  %s\n" +
                "  Rooms:      %d\n" +
                "  Total Paid: INR %s\n\n" +
                "We look forward to hosting you!\n\n" +
                "Warm regards,\n" +
                "The HostHub Team",
                userName, hotelName, booking.getId(), booking.getCheckInDate(),
                booking.getCheckOutDate(), booking.getRoomsCount(),
                booking.getAmount() != null ? booking.getAmount().toString() : "0.00"
        );

        sendEmailOrLog(to, subject, body);
    }

    @Async
    @Override
    public void sendBookingCancellation(Booking booking) {
        if (booking == null || booking.getUser() == null) {
            log.warn("Cannot send booking cancellation: booking or user is null");
            return;
        }

        String to = booking.getUser().getEmail();
        String hotelName = booking.getHotel() != null ? booking.getHotel().getName() : "HostHub Hotel";
        String userName = booking.getUser().getName() != null ? booking.getUser().getName() : "Guest";

        String subject = "Booking Cancelled - #" + booking.getId() + " at " + hotelName;
        String body = String.format(
                "Dear %s,\n\n" +
                "Your booking at %s (Booking ID: %d) has been CANCELLED.\n\n" +
                "If a refund is applicable, it will be credited back to your original payment method within 5-7 business days.\n\n" +
                "Regards,\n" +
                "HostHub Support",
                userName, hotelName, booking.getId()
        );

        sendEmailOrLog(to, subject, body);
    }

    private void sendEmailOrLog(String to, String subject, String body) {
        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            log.info("[SIMULATED EMAIL NOTIFICATION - SMTP not configured]\nTo: {}\nSubject: {}\nBody:\n{}", to, subject, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Sent email successfully to: {}", to);
        } catch (Exception e) {
            log.warn("Failed to deliver real email to {}: {}. Falling back to simulation log:\nSubject: {}\nBody:\n{}",
                    to, e.getMessage(), subject, body);
        }
    }
}

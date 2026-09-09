package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@tripnest.com}")
    private String fromEmail;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    public EmailServiceImpl(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private String getEffectiveSenderEmail() {
        if (fromEmail != null && !fromEmail.trim().isBlank()) {
            return fromEmail.trim();
        }
        return "noreply@tripnest.com";
    }

    @Override
    public void sendNotificationEmail(String toEmail, String subject, String body) {
        if (toEmail == null || toEmail.trim().isBlank()) {
            log.warn("Cannot send email: recipient address is empty.");
            return;
        }

        if (mailSender == null) {
            log.info("[Mock Mail Dispatcher] Recipient: {}, Subject: {}, Body: {}", toEmail, subject, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getEffectiveSenderEmail());
            message.setTo(toEmail.trim());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Notification email successfully dispatched to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to dispatch notification email to {} (Details logged): {}", toEmail, e.getMessage());
            log.info("[Email Content Fallback] Recipient: {}, Subject: {}, Body: {}", toEmail, subject, body);
        }
    }

    @Override
    public boolean sendInvitationEmail(String toEmail, String recipientName, String inviterName, String tripTitle, String destinationName, String dates, Long tripId) {
        if (toEmail == null || toEmail.trim().isBlank()) {
            log.warn("Cannot send invitation email: recipient address is empty.");
            return false;
        }

        String subject = "You're invited to join a TripNest trip";
        String rName = (recipientName != null && !recipientName.isBlank()) ? recipientName : "Traveler";
        String iName = (inviterName != null && !inviterName.isBlank()) ? inviterName : "A TripNest user";
        String dest = (destinationName != null && !destinationName.isBlank()) ? destinationName : "Custom Destination";
        String dt = (dates != null && !dates.isBlank()) ? dates : "Upcoming Dates";
        String tripUrl = appBaseUrl + "/trips/" + (tripId != null ? tripId : "");

        String body = String.format(
                "Hi %s,\n\n" +
                "%s invited you to join:\n\n" +
                "%s\n\n" +
                "Destination:\n%s\n\n" +
                "Dates:\n%s\n\n" +
                "View and manage this trip:\n%s\n\n" +
                "Best regards,\n" +
                "The TripNest Team",
                rName, iName, tripTitle, dest, dt, tripUrl
        );

        log.info("[TRIPNEST EMAIL] Attempting to send invitation to: {}", toEmail);

        if (mailSender == null) {
            log.error("[TRIPNEST EMAIL] FAILED to send invitation to: {}", toEmail);
            log.error("[TRIPNEST EMAIL] Error: JavaMailSender bean is not present or configured.");
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(getEffectiveSenderEmail());
            message.setTo(toEmail.trim());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("[TRIPNEST EMAIL] Invitation email sent successfully");
            return true;
        } catch (Exception e) {
            log.error("[TRIPNEST EMAIL] FAILED to send invitation to: {}", toEmail);
            log.error("[TRIPNEST EMAIL] Error: {}", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            return false;
        }
    }
}

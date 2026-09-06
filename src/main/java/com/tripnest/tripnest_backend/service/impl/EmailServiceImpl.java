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

    public EmailServiceImpl(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
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
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Notification email dispatched to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to dispatch notification email to {}: {}", toEmail, e.getMessage());
        }
    }
}

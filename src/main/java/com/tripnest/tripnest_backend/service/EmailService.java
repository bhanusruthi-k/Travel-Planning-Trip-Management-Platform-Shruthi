package com.tripnest.tripnest_backend.service;

public interface EmailService {
    void sendNotificationEmail(String toEmail, String subject, String body);
}

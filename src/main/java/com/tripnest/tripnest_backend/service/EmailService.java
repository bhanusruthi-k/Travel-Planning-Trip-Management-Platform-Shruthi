package com.tripnest.tripnest_backend.service;

public interface EmailService {
    void sendNotificationEmail(String toEmail, String subject, String body);
    boolean sendInvitationEmail(String toEmail, String recipientName, String inviterName, String tripTitle, String destinationName, String dates, Long tripId);
}


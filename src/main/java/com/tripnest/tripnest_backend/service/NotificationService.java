package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.dto.notification.NotificationResponseDTO;
import com.tripnest.tripnest_backend.dto.notification.UnreadCountResponseDTO;
import com.tripnest.tripnest_backend.model.NotificationType;
import com.tripnest.tripnest_backend.model.User;

import java.util.List;

public interface NotificationService {

    NotificationResponseDTO createNotification(User user, NotificationType type, String message, boolean sendEmail);

    List<NotificationResponseDTO> getUserNotifications(String userEmail);

    UnreadCountResponseDTO getUnreadNotificationCount(String userEmail);

    NotificationResponseDTO markAsRead(Long notificationId, String userEmail);

    void markAllAsRead(String userEmail);
}

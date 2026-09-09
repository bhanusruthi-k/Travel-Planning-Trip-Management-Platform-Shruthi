package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.notification.NotificationResponseDTO;
import com.tripnest.tripnest_backend.dto.notification.UnreadCountResponseDTO;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.Notification;
import com.tripnest.tripnest_backend.model.NotificationType;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.NotificationRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.service.EmailService;
import com.tripnest.tripnest_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public NotificationResponseDTO createNotification(User user, NotificationType type, String message, boolean sendEmail) {
        return createNotification(user, type, message, null, sendEmail);
    }

    @Override
    @Transactional
    public NotificationResponseDTO createNotification(User user, NotificationType type, String message, Long tripId, boolean sendEmail) {
        Notification notification = Notification.builder()
                .user(user)
                .notifType(type)
                .message(message)
                .tripId(tripId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        if (sendEmail && user.getEmail() != null) {
            String subject = getSubjectForType(type);
            emailService.sendNotificationEmail(user.getEmail(), subject, message);
        }

        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getUserNotifications(String userEmail) {
        User user = getUser(userEmail);
        List<Notification> notifications = notificationRepository.findByUserIdOrderByIdDesc(user.getId());
        return notifications.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadCountResponseDTO getUnreadNotificationCount(String userEmail) {
        User user = getUser(userEmail);
        long count = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        return new UnreadCountResponseDTO(count);
    }

    @Override
    @Transactional
    public NotificationResponseDTO markAsRead(Long notificationId, String userEmail) {
        User user = getUser(userEmail);
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        notification.setRead(true);
        Notification updated = notificationRepository.save(notification);
        return mapToDTO(updated);
    }

    @Override
    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = getUser(userEmail);
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());

        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private NotificationResponseDTO mapToDTO(Notification n) {
        if (n == null) return null;
        return NotificationResponseDTO.builder()
                .id(n.getId())
                .type(n.getNotifType())
                .message(n.getMessage())
                .tripId(n.getTripId())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }

    private String getSubjectForType(NotificationType type) {
        switch (type) {
            case TRIP_INVITATION:
                return "TripNest — You have been invited to join a trip";
            case INVITATION_ACCEPTED:
                return "TripNest — Your trip invitation was accepted";
            case INVITATION_REJECTED:
                return "TripNest — Your trip invitation was rejected";
            case MEMBER_ADDED:
                return "TripNest — You have been added to a trip";
            case JOIN_REQUEST_SUBMITTED:
                return "TripNest — New join request for your trip";
            case JOIN_REQUEST_APPROVED:
                return "TripNest — Your join request was approved";
            case JOIN_REQUEST_REJECTED:
                return "TripNest — Your join request update";
            case TRIP_UPDATE:
                return "TripNest — Trip Details Updated";
            case TRIP_REMINDER:
                return "TripNest — Upcoming Trip Reminder";
            case ACTIVITY_REMINDER:
                return "TripNest — Upcoming Activity Reminder";
            case BUDGET_ALERT:
                return "TripNest — Trip Budget Alert";
            default:
                return "TripNest — Notification Update";
        }
    }
}

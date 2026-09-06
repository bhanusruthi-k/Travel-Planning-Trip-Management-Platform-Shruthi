package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.ActivityRepository;
import com.tripnest.tripnest_backend.repository.ReminderLogRepository;
import com.tripnest.tripnest_backend.repository.TripMembershipRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.service.NotificationService;
import com.tripnest.tripnest_backend.service.ReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderServiceImpl implements ReminderService {

    private final TripRepository tripRepository;
    private final ActivityRepository activityRepository;
    private final TripMembershipRepository tripMembershipRepository;
    private final NotificationService notificationService;
    private final ReminderLogRepository reminderLogRepository;

    @Override
    @Transactional
    public int sendUpcomingTripReminders(LocalDate targetDate) {
        if (targetDate == null) {
            targetDate = LocalDate.now().plusDays(1);
        }

        List<Trip> upcomingTrips = tripRepository.findTripsStartingOnDate(targetDate);
        int sentCount = 0;

        for (Trip trip : upcomingTrips) {
            String destinationName = trip.getDestination() != null ? trip.getDestination().getName() : "your destination";
            String message = String.format("Your trip to %s starts tomorrow.", destinationName);
            String reminderKey = targetDate.toString();

            Set<User> recipients = getTripParticipants(trip);

            for (User recipient : recipients) {
                boolean alreadySent = reminderLogRepository.existsByReminderTypeAndEntityIdAndUserIdAndReminderKey(
                        NotificationType.TRIP_REMINDER.name(), trip.getId(), recipient.getId(), reminderKey);

                if (!alreadySent) {
                    notificationService.createNotification(recipient, NotificationType.TRIP_REMINDER, message, false);
                    reminderLogRepository.save(ReminderLog.builder()
                            .reminderType(NotificationType.TRIP_REMINDER.name())
                            .entityId(trip.getId())
                            .userId(recipient.getId())
                            .reminderKey(reminderKey)
                            .sentAt(LocalDateTime.now())
                            .build());
                    sentCount++;
                }
            }
        }

        log.info("Sent {} upcoming trip reminders for date {}", sentCount, targetDate);
        return sentCount;
    }

    @Override
    @Transactional
    public int sendUpcomingActivityReminders(LocalDate targetDate) {
        if (targetDate == null) {
            targetDate = LocalDate.now().plusDays(1);
        }

        List<Activity> upcomingActivities = activityRepository.findActivitiesScheduledForDate(targetDate);
        int sentCount = 0;

        for (Activity activity : upcomingActivities) {
            ItineraryDay day = activity.getItineraryDay();
            if (day == null || day.getTrip() == null) continue;

            Trip trip = day.getTrip();
            String timeStr = (activity.getTime() != null && !activity.getTime().isBlank()) ? " at " + activity.getTime() : "";
            String locationStr = (activity.getLocation() != null && !activity.getLocation().isBlank()) ? " at " + activity.getLocation() : "";
            
            // Format: "Reminder: Eiffel Tower visit is scheduled tomorrow at 6:00 PM."
            String message = String.format("Reminder: %s is scheduled tomorrow%s%s.", activity.getTitle(), timeStr, locationStr);
            String reminderKey = targetDate.toString();

            Set<User> recipients = getTripParticipants(trip);

            for (User recipient : recipients) {
                boolean alreadySent = reminderLogRepository.existsByReminderTypeAndEntityIdAndUserIdAndReminderKey(
                        NotificationType.ACTIVITY_REMINDER.name(), activity.getId(), recipient.getId(), reminderKey);

                if (!alreadySent) {
                    notificationService.createNotification(recipient, NotificationType.ACTIVITY_REMINDER, message, false);
                    reminderLogRepository.save(ReminderLog.builder()
                            .reminderType(NotificationType.ACTIVITY_REMINDER.name())
                            .entityId(activity.getId())
                            .userId(recipient.getId())
                            .reminderKey(reminderKey)
                            .sentAt(LocalDateTime.now())
                            .build());
                    sentCount++;
                }
            }
        }

        log.info("Sent {} upcoming activity reminders for date {}", sentCount, targetDate);
        return sentCount;
    }

    private Set<User> getTripParticipants(Trip trip) {
        Set<User> participants = new LinkedHashSet<>();
        if (trip.getUser() != null) {
            participants.add(trip.getUser());
        }

        List<TripMembership> memberships = tripMembershipRepository.findByTripIdWithUser(trip.getId());
        for (TripMembership tm : memberships) {
            if (tm.getUser() != null) {
                participants.add(tm.getUser());
            }
        }
        return participants;
    }
}

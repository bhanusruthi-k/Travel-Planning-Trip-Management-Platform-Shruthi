package com.tripnest.tripnest_backend.scheduler;

import com.tripnest.tripnest_backend.service.ReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class TripReminderScheduler {

    private final ReminderService reminderService;

    // Runs every day at 8:00 AM server time
    @Scheduled(cron = "${app.scheduling.trip-reminders.cron:0 0 8 * * *}")
    public void runDailyTripReminders() {
        log.info("Starting scheduled daily trip reminders execution");
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        int sent = reminderService.sendUpcomingTripReminders(tomorrow);
        log.info("Completed scheduled daily trip reminders execution. Dispatched: {}", sent);
    }
}

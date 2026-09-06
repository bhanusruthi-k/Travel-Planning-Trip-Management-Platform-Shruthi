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
public class ActivityReminderScheduler {

    private final ReminderService reminderService;

    // Runs every day at 8:00 AM server time
    @Scheduled(cron = "${app.scheduling.activity-reminders.cron:0 0 8 * * *}")
    public void runDailyActivityReminders() {
        log.info("Starting scheduled daily activity reminders execution");
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        int sent = reminderService.sendUpcomingActivityReminders(tomorrow);
        log.info("Completed scheduled daily activity reminders execution. Dispatched: {}", sent);
    }
}

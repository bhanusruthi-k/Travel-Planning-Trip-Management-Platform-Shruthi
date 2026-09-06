package com.tripnest.tripnest_backend.service;

import java.time.LocalDate;

public interface ReminderService {

    int sendUpcomingTripReminders(LocalDate targetDate);

    int sendUpcomingActivityReminders(LocalDate targetDate);
}

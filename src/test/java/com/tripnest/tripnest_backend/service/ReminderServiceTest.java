package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.TripnestBackendApplication;
import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = TripnestBackendApplication.class)
@Transactional
public class ReminderServiceTest {

    @Autowired
    private ReminderService reminderService;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripMembershipRepository tripMembershipRepository;

    @Autowired
    private ItineraryDayRepository itineraryDayRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ReminderLogRepository reminderLogRepository;

    private User owner;
    private User member;
    private User unrelatedUser;
    private Destination destination;
    private Trip upcomingTrip;

    @BeforeEach
    void setUp() {
        owner = userRepository.save(User.builder()
                .email("owner_rem@tripnest.com")
                .fullName("Owner Rem")
                .password("Password123!")
                .role(Role.TRAVELER)
                .build());

        member = userRepository.save(User.builder()
                .email("member_rem@tripnest.com")
                .fullName("Member Rem")
                .password("Password123!")
                .role(Role.TRAVELER)
                .build());

        unrelatedUser = userRepository.save(User.builder()
                .email("unrelated_rem@tripnest.com")
                .fullName("Unrelated User")
                .password("Password123!")
                .role(Role.TRAVELER)
                .build());

        destination = destinationRepository.save(Destination.builder()
                .name("Rome")
                .country("Italy")
                .description("Eternal City")
                .category("HISTORICAL")
                .averageCost(110.0)
                .build());

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        upcomingTrip = tripRepository.save(Trip.builder()
                .title("Rome Holiday")
                .startDate(tomorrow)
                .endDate(tomorrow.plusDays(5))
                .destination(destination)
                .user(owner)
                .status(TripStatus.PLANNED)
                .build());

        tripMembershipRepository.save(TripMembership.builder()
                .trip(upcomingTrip)
                .user(member)
                .memberRole(MemberRole.MEMBER)
                .build());
    }

    @Test
    @DisplayName("Upcoming trip generates reminders for owner and member, but not unrelated user")
    void testTripRemindersGeneration() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        int dispatched = reminderService.sendUpcomingTripReminders(tomorrow);

        assertEquals(2, dispatched, "Should send exactly 2 notifications (owner and member)");

        List<Notification> ownerNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(owner.getId());
        assertEquals(1, ownerNotifs.size());
        assertTrue(ownerNotifs.get(0).getMessage().contains("Rome"));
        assertEquals(NotificationType.TRIP_REMINDER, ownerNotifs.get(0).getNotifType());

        List<Notification> memberNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(member.getId());
        assertEquals(1, memberNotifs.size());
        assertTrue(memberNotifs.get(0).getMessage().contains("Rome"));

        List<Notification> unrelatedNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(unrelatedUser.getId());
        assertTrue(unrelatedNotifs.isEmpty(), "Unrelated users must receive no reminders");
    }

    @Test
    @DisplayName("Duplicate trip reminder is prevented on consecutive scheduler runs")
    void testPreventDuplicateTripReminder() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        int firstRun = reminderService.sendUpcomingTripReminders(tomorrow);
        assertEquals(2, firstRun);

        // Run scheduler a second time (simulating re-run or server restart)
        int secondRun = reminderService.sendUpcomingTripReminders(tomorrow);
        assertEquals(0, secondRun, "Duplicate reminders must be skipped");

        List<Notification> ownerNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(owner.getId());
        assertEquals(1, ownerNotifs.size(), "Owner should still only have 1 notification");
    }

    @Test
    @DisplayName("Upcoming activity generates reminder for owner and member and prevents duplicates")
    void testActivityReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        ItineraryDay day = itineraryDayRepository.save(ItineraryDay.builder()
                .trip(upcomingTrip)
                .dayNumber(1)
                .date(tomorrow)
                .title("Day 1 - Colosseum")
                .build());

        Activity activity = activityRepository.save(Activity.builder()
                .itineraryDay(day)
                .title("Colosseum Tour")
                .time("10:00 AM")
                .location("Piazza del Colosseo")
                .build());

        int firstRun = reminderService.sendUpcomingActivityReminders(tomorrow);
        assertEquals(2, firstRun, "Should send activity reminder to owner and member");

        List<Notification> ownerNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(owner.getId());
        assertEquals(1, ownerNotifs.size());
        assertTrue(ownerNotifs.get(0).getMessage().contains("Colosseum Tour"));
        assertTrue(ownerNotifs.get(0).getMessage().contains("10:00 AM"));
        assertEquals(NotificationType.ACTIVITY_REMINDER, ownerNotifs.get(0).getNotifType());

        // Repeated run prevents duplicate
        int secondRun = reminderService.sendUpcomingActivityReminders(tomorrow);
        assertEquals(0, secondRun, "Repeated activity scheduler run should send 0 new reminders");
    }
}

package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.TripnestBackendApplication;
import com.tripnest.tripnest_backend.dto.trip.TripRequestDTO;
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
public class TripTravelUpdateTest {

    @Autowired
    private TripService tripService;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripMembershipRepository tripMembershipRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User owner;
    private User member1;
    private User member2;
    private Destination destinationParis;
    private Destination destinationDubai;
    private Trip trip;

    @BeforeEach
    void setUp() {
        owner = userRepository.save(User.builder()
                .email("owner_update@tripnest.com")
                .fullName("Owner Update")
                .password("Password123!")
                .role(Role.TRAVELER)
                .build());

        member1 = userRepository.save(User.builder()
                .email("member1_update@tripnest.com")
                .fullName("Member One")
                .password("Password123!")
                .role(Role.TRAVELER)
                .build());

        member2 = userRepository.save(User.builder()
                .email("member2_update@tripnest.com")
                .fullName("Member Two")
                .password("Password123!")
                .role(Role.TRAVELER)
                .build());

        destinationParis = destinationRepository.save(Destination.builder()
                .name("Paris")
                .country("France")
                .description("City of Light")
                .build());

        destinationDubai = destinationRepository.save(Destination.builder()
                .name("Dubai")
                .country("UAE")
                .description("City of Gold")
                .build());

        trip = tripRepository.save(Trip.builder()
                .title("Euro Trip")
                .startDate(LocalDate.of(2026, 9, 10))
                .endDate(LocalDate.of(2026, 9, 18))
                .destination(destinationParis)
                .user(owner)
                .status(TripStatus.PLANNED)
                .build());

        tripMembershipRepository.save(TripMembership.builder()
                .trip(trip)
                .user(member1)
                .memberRole(MemberRole.MEMBER)
                .build());

        tripMembershipRepository.save(TripMembership.builder()
                .trip(trip)
                .user(member2)
                .memberRole(MemberRole.MEMBER)
                .build());
    }

    @Test
    @DisplayName("Destination change notifies other members and not the modifying owner")
    void testDestinationChangeNotification() {
        TripRequestDTO updateDTO = TripRequestDTO.builder()
                .title(trip.getTitle())
                .destinationId(destinationDubai.getId())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .build();

        tripService.updateTrip(trip.getId(), updateDTO, owner.getEmail());

        // Modifying owner should NOT receive a notification
        List<Notification> ownerNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(owner.getId());
        assertTrue(ownerNotifs.isEmpty(), "Updater must not receive own update notification");

        // Member 1 should receive notification
        List<Notification> member1Notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(member1.getId());
        assertEquals(1, member1Notifs.size());
        assertTrue(member1Notifs.get(0).getMessage().contains("destination has changed from Paris to Dubai"));
        assertEquals(NotificationType.TRIP_UPDATE, member1Notifs.get(0).getNotifType());

        // Member 2 should also receive notification
        List<Notification> member2Notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(member2.getId());
        assertEquals(1, member2Notifs.size());
    }

    @Test
    @DisplayName("Date change notifies other members")
    void testDateChangeNotification() {
        TripRequestDTO updateDTO = TripRequestDTO.builder()
                .title(trip.getTitle())
                .destinationId(destinationParis.getId())
                .startDate(LocalDate.of(2026, 9, 12))
                .endDate(LocalDate.of(2026, 9, 20))
                .build();

        tripService.updateTrip(trip.getId(), updateDTO, owner.getEmail());

        List<Notification> member1Notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(member1.getId());
        assertEquals(1, member1Notifs.size());
        assertTrue(member1Notifs.get(0).getMessage().contains("dates have been updated"));
    }

    @Test
    @DisplayName("Updating non-core details (e.g., description only) produces no Travel Update notifications")
    void testNonCoreUpdateNoNotification() {
        TripRequestDTO updateDTO = TripRequestDTO.builder()
                .title("Updated Title")
                .description("New Description")
                .destinationId(destinationParis.getId())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .build();

        tripService.updateTrip(trip.getId(), updateDTO, owner.getEmail());

        List<Notification> member1Notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(member1.getId());
        assertTrue(member1Notifs.isEmpty(), "Non-core updates should not send travel update notifications");
    }

    @Test
    @DisplayName("Changing both destination and dates produces one consolidated notification")
    void testCombinedUpdateNotification() {
        TripRequestDTO updateDTO = TripRequestDTO.builder()
                .title(trip.getTitle())
                .destinationId(destinationDubai.getId())
                .startDate(LocalDate.of(2026, 9, 12))
                .endDate(LocalDate.of(2026, 9, 20))
                .build();

        tripService.updateTrip(trip.getId(), updateDTO, owner.getEmail());

        List<Notification> member1Notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(member1.getId());
        assertEquals(1, member1Notifs.size(), "Should send exactly one consolidated notification");
        String msg = member1Notifs.get(0).getMessage();
        assertTrue(msg.contains("destination has changed from Paris to Dubai"));
        assertTrue(msg.contains("trip dates have been updated"));
    }
}

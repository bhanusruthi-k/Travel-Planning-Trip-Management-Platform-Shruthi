package com.tripnest.tripnest_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tripnest.tripnest_backend.model.Notification;
import com.tripnest.tripnest_backend.model.NotificationType;
import com.tripnest.tripnest_backend.model.Role;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.NotificationRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tripnest.tripnest_backend.TripnestBackendApplication;

@SpringBootTest(classes = TripnestBackendApplication.class)
public class NotificationControllerTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        notificationRepository.deleteAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        userA = userRepository.save(User.builder()
                .email("userA_" + suffix + "@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("User Alpha")
                .role(Role.TRAVELER)
                .build());

        userB = userRepository.save(User.builder()
                .email("userB_" + suffix + "@test.com")
                .password(passwordEncoder.encode("Password123!"))
                .fullName("User Beta")
                .role(Role.TRAVELER)
                .build());

        tokenA = "Bearer " + jwtTokenProvider.generateToken(userA.getEmail(), userA.getRole());
        tokenB = "Bearer " + jwtTokenProvider.generateToken(userB.getEmail(), userB.getRole());
    }

    @Test
    @DisplayName("User can retrieve only their own notifications (newest first)")
    void testGetNotifications_isolation() throws Exception {
        Notification n1 = notificationRepository.save(Notification.builder()
                .user(userA)
                .notifType(NotificationType.MEMBER_ADDED)
                .message("User A Notif 1")
                .isRead(false)
                .build());

        Notification n2 = notificationRepository.save(Notification.builder()
                .user(userA)
                .notifType(NotificationType.JOIN_REQUEST_APPROVED)
                .message("User A Notif 2")
                .isRead(true)
                .build());

        notificationRepository.save(Notification.builder()
                .user(userB)
                .notifType(NotificationType.JOIN_REQUEST_SUBMITTED)
                .message("User B Notif")
                .isRead(false)
                .build());

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].message", is("User A Notif 2")))
                .andExpect(jsonPath("$[1].message", is("User A Notif 1")));
    }

    @Test
    @DisplayName("Unread count returns correct count for authenticated user")
    void testGetUnreadCount() throws Exception {
        notificationRepository.save(Notification.builder()
                .user(userA)
                .notifType(NotificationType.MEMBER_ADDED)
                .message("Unread 1")
                .isRead(false)
                .build());

        notificationRepository.save(Notification.builder()
                .user(userA)
                .notifType(NotificationType.TRIP_UPDATE)
                .message("Unread 2")
                .isRead(false)
                .build());

        notificationRepository.save(Notification.builder()
                .user(userA)
                .notifType(NotificationType.JOIN_REQUEST_APPROVED)
                .message("Read 1")
                .isRead(true)
                .build());

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count", is(2)));
    }

    @Test
    @DisplayName("User can mark their own notification as read")
    void testMarkAsRead_success() throws Exception {
        Notification n = notificationRepository.save(Notification.builder()
                .user(userA)
                .notifType(NotificationType.MEMBER_ADDED)
                .message("Unread 1")
                .isRead(false)
                .build());

        mockMvc.perform(put("/api/notifications/" + n.getId() + "/read")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead", is(true)));
    }

    @Test
    @DisplayName("User cannot mark another user's notification as read")
    void testMarkAsRead_cannotAccessOtherUserNotification() throws Exception {
        Notification nB = notificationRepository.save(Notification.builder()
                .user(userB)
                .notifType(NotificationType.MEMBER_ADDED)
                .message("User B secret notif")
                .isRead(false)
                .build());

        mockMvc.perform(put("/api/notifications/" + nB.getId() + "/read")
                        .header("Authorization", tokenA))
                .andExpect(status().isNotFound());
    }
}

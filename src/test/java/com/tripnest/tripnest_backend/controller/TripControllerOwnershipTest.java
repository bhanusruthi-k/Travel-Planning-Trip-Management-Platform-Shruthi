package com.tripnest.tripnest_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tripnest.tripnest_backend.dto.trip.TripRequestDTO;
import com.tripnest.tripnest_backend.model.Destination;
import com.tripnest.tripnest_backend.model.Role;
import com.tripnest.tripnest_backend.model.TripStatus;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class TripControllerOwnershipTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private MockMvc mockMvc;
    private String userAToken;
    private String userBToken;
    private Long destinationId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        if (!userRepository.existsByEmail("usera@tripnest.com")) {
            userRepository.save(User.builder()
                    .email("usera@tripnest.com")
                    .password(passwordEncoder.encode("Pass1234"))
                    .fullName("User Alice")
                    .role(Role.TRAVELER)
                    .build());
        }
        if (!userRepository.existsByEmail("userb@tripnest.com")) {
            userRepository.save(User.builder()
                    .email("userb@tripnest.com")
                    .password(passwordEncoder.encode("Pass1234"))
                    .fullName("User Bob")
                    .role(Role.TRAVELER)
                    .build());
        }

        userAToken = "Bearer " + tokenProvider.generateToken("usera@tripnest.com", Role.TRAVELER);
        userBToken = "Bearer " + tokenProvider.generateToken("userb@tripnest.com", Role.TRAVELER);

        Destination destination = destinationRepository.findAll().get(0);
        destinationId = destination.getId();
    }

    @Test
    @DisplayName("Should enforce trip ownership: User A creates a trip, User B cannot read/update/delete it")
    void testTripOwnershipEnforcement() throws Exception {
        // 1. User A creates a trip
        TripRequestDTO createDto = TripRequestDTO.builder()
                .title("Alice's Dream Vacation")
                .description("Exploring museums and cafes")
                .destinationId(destinationId)
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(20))
                .budget(2500.0)
                .status(TripStatus.PLANNED)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/trips")
                        .header("Authorization", userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Alice's Dream Vacation")))
                .andExpect(jsonPath("$.user.email", is("usera@tripnest.com")))
                .andReturn();

        String responseContent = createResult.getResponse().getContentAsString();
        Long tripId = objectMapper.readTree(responseContent).get("id").asLong();

        // 2. User A can view their own trip
        mockMvc.perform(get("/api/trips/" + tripId)
                        .header("Authorization", userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(tripId.intValue())))
                .andExpect(jsonPath("$.title", is("Alice's Dream Vacation")));

        // 3. User B CANNOT view User A's trip -> 403 Forbidden
        mockMvc.perform(get("/api/trips/" + tripId)
                        .header("Authorization", userBToken))
                .andExpect(status().isForbidden());

        // 4. User B CANNOT update User A's trip -> 403 Forbidden
        TripRequestDTO updateDto = TripRequestDTO.builder()
                .title("Hacked Title by Bob")
                .destinationId(destinationId)
                .startDate(LocalDate.now().plusDays(15))
                .endDate(LocalDate.now().plusDays(25))
                .budget(100.0)
                .build();

        mockMvc.perform(put("/api/trips/" + tripId)
                        .header("Authorization", userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isForbidden());

        // 5. User B CANNOT delete User A's trip -> 403 Forbidden
        mockMvc.perform(delete("/api/trips/" + tripId)
                        .header("Authorization", userBToken))
                .andExpect(status().isForbidden());

        // 6. User A CAN update their own trip
        TripRequestDTO validUpdateDto = TripRequestDTO.builder()
                .title("Alice's Updated Dream Vacation")
                .destinationId(destinationId)
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(22))
                .budget(2800.0)
                .status(TripStatus.ONGOING)
                .build();

        mockMvc.perform(put("/api/trips/" + tripId)
                        .header("Authorization", userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validUpdateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Alice's Updated Dream Vacation")))
                .andExpect(jsonPath("$.status", is("ONGOING")));

        // 7. User A CAN delete their own trip
        mockMvc.perform(delete("/api/trips/" + tripId)
                        .header("Authorization", userAToken))
                .andExpect(status().isNoContent());

        // 8. Trip is no longer accessible
        mockMvc.perform(get("/api/trips/" + tripId)
                        .header("Authorization", userAToken))
                .andExpect(status().isNotFound());
    }
}

package com.tripnest.tripnest_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripnest.tripnest_backend.dto.destination.AttractionRequestDTO;
import com.tripnest.tripnest_backend.model.Attraction;
import com.tripnest.tripnest_backend.model.Destination;
import com.tripnest.tripnest_backend.model.Role;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.AttractionRepository;
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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tripnest.tripnest_backend.TripnestBackendApplication;

@SpringBootTest(classes = TripnestBackendApplication.class)
@Transactional
public class AttractionControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AttractionRepository attractionRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private MockMvc mockMvc;
    private Destination destination;
    private String adminToken;
    private String travelerToken;
    private String groupAdminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        destination = destinationRepository.save(Destination.builder()
                .name("Paris Test")
                .country("France")
                .description("City of Light")
                .category("CULTURE")
                .averageCost(120.0)
                .build());

        User admin = userRepository.save(User.builder()
                .email("admin_attr@tripnest.com")
                .fullName("Admin Attr")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.ADMINISTRATOR)
                .build());
        adminToken = "Bearer " + jwtTokenProvider.generateToken(admin.getEmail(), admin.getRole());

        User traveler = userRepository.save(User.builder()
                .email("traveler_attr@tripnest.com")
                .fullName("Traveler Attr")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.TRAVELER)
                .build());
        travelerToken = "Bearer " + jwtTokenProvider.generateToken(traveler.getEmail(), traveler.getRole());

        User groupAdmin = userRepository.save(User.builder()
                .email("groupadmin_attr@tripnest.com")
                .fullName("Group Admin Attr")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.GROUP_ADMIN)
                .build());
        groupAdminToken = "Bearer " + jwtTokenProvider.generateToken(groupAdmin.getEmail(), groupAdmin.getRole());
    }

    @Test
    @DisplayName("Administrator can create attraction successfully")
    void testAdminCreateAttraction() throws Exception {
        AttractionRequestDTO request = AttractionRequestDTO.builder()
                .name("Eiffel Tower")
                .description("Iconic iron lattice tower on the Champ de Mars.")
                .build();

        mockMvc.perform(post("/api/destinations/" + destination.getId() + "/attractions")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Eiffel Tower"))
                .andExpect(jsonPath("$.destinationId").value(destination.getId()));
    }

    @Test
    @DisplayName("Traveler cannot create attraction (403 Forbidden)")
    void testTravelerCannotCreateAttraction() throws Exception {
        AttractionRequestDTO request = AttractionRequestDTO.builder()
                .name("Louvre Museum")
                .description("World's largest art museum.")
                .build();

        mockMvc.perform(post("/api/destinations/" + destination.getId() + "/attractions")
                        .header("Authorization", travelerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Group Admin cannot create attraction (403 Forbidden)")
    void testGroupAdminCannotCreateAttraction() throws Exception {
        AttractionRequestDTO request = AttractionRequestDTO.builder()
                .name("Arc de Triomphe")
                .description("Monument honoring fallen soldiers.")
                .build();

        mockMvc.perform(post("/api/destinations/" + destination.getId() + "/attractions")
                        .header("Authorization", groupAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated user cannot create attraction (401 Unauthorized / 403 Forbidden)")
    void testUnauthenticatedCannotCreateAttraction() throws Exception {
        AttractionRequestDTO request = AttractionRequestDTO.builder()
                .name("Notre Dame")
                .description("Medieval Catholic cathedral.")
                .build();

        mockMvc.perform(post("/api/destinations/" + destination.getId() + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("List attractions by destination ID (public / authenticated)")
    void testGetAttractionsByDestination() throws Exception {
        attractionRepository.save(Attraction.builder()
                .destination(destination)
                .name("Eiffel Tower")
                .description("Famous tower")
                .build());
        attractionRepository.save(Attraction.builder()
                .destination(destination)
                .name("Louvre Museum")
                .description("Famous art museum")
                .build());

        mockMvc.perform(get("/api/destinations/" + destination.getId() + "/attractions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Eiffel Tower"))
                .andExpect(jsonPath("$[1].name").value("Louvre Museum"));
    }

    @Test
    @DisplayName("Invalid destination returns 404 Not Found")
    void testInvalidDestinationReturns404() throws Exception {
        mockMvc.perform(get("/api/destinations/999999/attractions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Invalid attraction request (blank name) is rejected with 400 Bad Request")
    void testInvalidAttractionDataRejected() throws Exception {
        AttractionRequestDTO invalidRequest = AttractionRequestDTO.builder()
                .name("") // Blank name
                .description("Valid description")
                .build();

        mockMvc.perform(post("/api/destinations/" + destination.getId() + "/attractions")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }
}

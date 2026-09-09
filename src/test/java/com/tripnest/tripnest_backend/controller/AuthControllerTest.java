package com.tripnest.tripnest_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tripnest.tripnest_backend.TripnestBackendApplication;
import com.tripnest.tripnest_backend.dto.auth.LoginRequest;
import com.tripnest.tripnest_backend.dto.auth.RegisterRequest;
import com.tripnest.tripnest_backend.model.Role;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.UserRepository;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = TripnestBackendApplication.class)
public class AuthControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    @DisplayName("1. User Registration: Should register a new traveler successfully")
    void testUserRegisterSuccess() throws Exception {
        String testEmail = "traveler.flow" + System.currentTimeMillis() + "@tripnest.com";
        RegisterRequest request = RegisterRequest.builder()
                .email(testEmail)
                .password("Password@123")
                .fullName("Traveler Flow")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(testEmail.toLowerCase()))
                .andExpect(jsonPath("$.user.role").value("TRAVELER"));

        Optional<User> savedUser = userRepository.findByEmail(testEmail.toLowerCase());
        assertTrue(savedUser.isPresent());
        assertEquals(Role.TRAVELER, savedUser.get().getRole());
        assertTrue(passwordEncoder.matches("Password@123", savedUser.get().getPassword()));
    }

    @Test
    @DisplayName("2. Admin Registration: Should register a new administrator successfully")
    void testAdminRegisterSuccess() throws Exception {
        String testEmail = "admin.flow" + System.currentTimeMillis() + "@tripnest.com";
        RegisterRequest request = RegisterRequest.builder()
                .email(testEmail)
                .password("AdminPass@123")
                .fullName("Admin Flow")
                .build();

        mockMvc.perform(post("/api/auth/register-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(testEmail.toLowerCase()))
                .andExpect(jsonPath("$.user.role").value("ADMINISTRATOR"));

        Optional<User> savedUser = userRepository.findByEmail(testEmail.toLowerCase());
        assertTrue(savedUser.isPresent());
        assertEquals(Role.ADMINISTRATOR, savedUser.get().getRole());
    }

    @Test
    @DisplayName("3. User Login: Should allow Traveler on User Login")
    void testUserLoginSuccess() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("traveler@tripnest.com")
                .password("Traveler@123")
                .expectedRole(Role.TRAVELER)
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("traveler@tripnest.com"))
                .andExpect(jsonPath("$.user.role").value("TRAVELER"));
    }

    @Test
    @DisplayName("4. Admin Login: Should allow Administrator on Admin Login")
    void testAdminLoginSuccess() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("admin@tripnest.com")
                .password("Admin@123")
                .expectedRole(Role.ADMINISTRATOR)
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("admin@tripnest.com"))
                .andExpect(jsonPath("$.user.role").value("ADMINISTRATOR"));
    }

    @Test
    @DisplayName("5. Universal Login: Admin credentials authenticate and return ADMINISTRATOR role")
    void testAdminUniversalLogin() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("admin@tripnest.com")
                .password("Admin@123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("ADMINISTRATOR"));
    }

    @Test
    @DisplayName("6. Universal Login: Traveler credentials authenticate and return TRAVELER role")
    void testTravelerUniversalLogin() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("traveler@tripnest.com")
                .password("Traveler@123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("TRAVELER"));
    }

    @Test
    @DisplayName("7. Authentication: Should reject invalid password")
    void testLoginInvalidPassword() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("traveler@tripnest.com")
                .password("WrongPassword")
                .expectedRole(Role.TRAVELER)
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("8. Registration: Should reject duplicate email registration")
    void testDuplicateRegistration() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("traveler@tripnest.com")
                .password("Password@123")
                .fullName("Duplicate User")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("An account with this email already exists: traveler@tripnest.com"));
    }

    @Test
    @DisplayName("9. JWT Context: Should load authenticated user profile via /api/auth/me")
    void testGetCurrentUser() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("traveler@tripnest.com")
                .password("Traveler@123")
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("traveler@tripnest.com"))
                .andExpect(jsonPath("$.role").value("TRAVELER"));
    }
}

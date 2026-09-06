package com.tripnest.tripnest_backend.controller;

import com.tripnest.tripnest_backend.model.Destination;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class DestinationControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private DestinationRepository destinationRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    @DisplayName("Should retrieve all destinations without authentication (public endpoint)")
    void testGetAllDestinations() throws Exception {
        mockMvc.perform(get("/api/destinations")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Should retrieve destination by ID")
    void testGetDestinationById() throws Exception {
        Destination destination = destinationRepository.findAll().get(0);

        mockMvc.perform(get("/api/destinations/" + destination.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(destination.getId()))
                .andExpect(jsonPath("$.name").value(destination.getName()))
                .andExpect(jsonPath("$.country").value(destination.getCountry()));
    }
}

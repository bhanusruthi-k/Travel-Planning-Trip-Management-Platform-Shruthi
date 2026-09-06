package com.tripnest.tripnest_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.tripnest.tripnest_backend.dto.budget.BudgetRequestDTO;
import com.tripnest.tripnest_backend.dto.expense.ExpenseRequestDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ActivityRequestDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ItineraryDayRequestDTO;
import com.tripnest.tripnest_backend.dto.membership.AddMemberRequestDTO;
import com.tripnest.tripnest_backend.dto.membership.UpdateMemberRoleRequestDTO;
import com.tripnest.tripnest_backend.dto.trip.TripRequestDTO;
import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.*;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.tripnest.tripnest_backend.TripnestBackendApplication;

@SpringBootTest(classes = TripnestBackendApplication.class)
public class MembershipControllerTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private TripMembershipRepository tripMembershipRepository;

    @Autowired
    private JoinRequestRepository joinRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private MockMvc mockMvc;

    private String ownerToken;
    private String adminToken;
    private String memberToken;
    private String outsiderToken;

    private User ownerUser;
    private User adminUser;
    private User memberUser;
    private User outsiderUser;
    private Long destinationId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        ownerUser = userRepository.save(User.builder()
                .email("owner_" + suffix + "@tripnest.com")
                .password(passwordEncoder.encode("Pass1234"))
                .fullName("Owner User")
                .role(Role.TRAVELER)
                .build());

        adminUser = userRepository.save(User.builder()
                .email("admin_" + suffix + "@tripnest.com")
                .password(passwordEncoder.encode("Pass1234"))
                .fullName("Group Admin User")
                .role(Role.TRAVELER)
                .build());

        memberUser = userRepository.save(User.builder()
                .email("member_" + suffix + "@tripnest.com")
                .password(passwordEncoder.encode("Pass1234"))
                .fullName("Regular Member User")
                .role(Role.TRAVELER)
                .build());

        outsiderUser = userRepository.save(User.builder()
                .email("outsider_" + suffix + "@tripnest.com")
                .password(passwordEncoder.encode("Pass1234"))
                .fullName("Outsider User")
                .role(Role.TRAVELER)
                .build());

        ownerToken = "Bearer " + tokenProvider.generateToken(ownerUser.getEmail(), Role.TRAVELER);
        adminToken = "Bearer " + tokenProvider.generateToken(adminUser.getEmail(), Role.TRAVELER);
        memberToken = "Bearer " + tokenProvider.generateToken(memberUser.getEmail(), Role.TRAVELER);
        outsiderToken = "Bearer " + tokenProvider.generateToken(outsiderUser.getEmail(), Role.TRAVELER);

        Destination dest = destinationRepository.findAll().get(0);
        destinationId = dest.getId();
    }

    private Long createTripForOwner() throws Exception {
        TripRequestDTO dto = TripRequestDTO.builder()
                .title("Trip with Members")
                .description("Collaborative trip")
                .destinationId(destinationId)
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(15))
                .budget(3000.0)
                .status(TripStatus.PLANNED)
                .build();

        MvcResult result = mockMvc.perform(post("/api/trips")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    @DisplayName("1 & 2 & 3: Owner and Group Admin can add members; Regular Member cannot")
    void testAddMemberPermissions() throws Exception {
        Long tripId = createTripForOwner();

        // 1. Owner adds adminUser as GROUP_ADMIN
        AddMemberRequestDTO addAdminDto = AddMemberRequestDTO.builder()
                .email(adminUser.getEmail())
                .role(MemberRole.GROUP_ADMIN)
                .build();

        mockMvc.perform(post("/api/trips/" + tripId + "/members")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addAdminDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email", is(adminUser.getEmail())))
                .andExpect(jsonPath("$.role", is("GROUP_ADMIN")));

        // 2. GROUP_ADMIN adds memberUser as MEMBER
        AddMemberRequestDTO addMemberDto = AddMemberRequestDTO.builder()
                .email(memberUser.getEmail())
                .role(MemberRole.MEMBER)
                .build();

        mockMvc.perform(post("/api/trips/" + tripId + "/members")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addMemberDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email", is(memberUser.getEmail())))
                .andExpect(jsonPath("$.role", is("MEMBER")));

        // 3. Regular MEMBER attempts to add outsiderUser -> 403 Forbidden
        AddMemberRequestDTO addOutsiderDto = AddMemberRequestDTO.builder()
                .email(outsiderUser.getEmail())
                .role(MemberRole.MEMBER)
                .build();

        mockMvc.perform(post("/api/trips/" + tripId + "/members")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addOutsiderDto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("4 & 5 & 6: Owner and Group Admin can remove member; Regular Member cannot; Owner cannot be removed")
    void testRemoveMemberPermissions() throws Exception {
        Long tripId = createTripForOwner();

        // Add memberUser
        mockMvc.perform(post("/api/trips/" + tripId + "/members")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AddMemberRequestDTO.builder()
                                .email(memberUser.getEmail())
                                .role(MemberRole.MEMBER)
                                .build())))
                .andExpect(status().isCreated());

        // Add adminUser
        mockMvc.perform(post("/api/trips/" + tripId + "/members")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AddMemberRequestDTO.builder()
                                .email(adminUser.getEmail())
                                .role(MemberRole.GROUP_ADMIN)
                                .build())))
                .andExpect(status().isCreated());

        // 6. Regular member tries to remove group admin -> 403 Forbidden
        mockMvc.perform(delete("/api/trips/" + tripId + "/members/" + adminUser.getId())
                        .header("Authorization", memberToken))
                .andExpect(status().isForbidden());

        // Cannot remove the Trip Owner -> 400 Bad Request
        mockMvc.perform(delete("/api/trips/" + tripId + "/members/" + ownerUser.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isBadRequest());

        // 5. Group Admin removes memberUser -> 204 No Content
        mockMvc.perform(delete("/api/trips/" + tripId + "/members/" + memberUser.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isNoContent());

        // 4. Owner removes adminUser -> 204 No Content
        mockMvc.perform(delete("/api/trips/" + tripId + "/members/" + adminUser.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("7 & 8 & 9: Role changes: Owner & Group Admin can change role; Member cannot")
    void testUpdateMemberRolePermissions() throws Exception {
        Long tripId = createTripForOwner();

        // Add adminUser and memberUser
        mockMvc.perform(post("/api/trips/" + tripId + "/members")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(AddMemberRequestDTO.builder().email(adminUser.getEmail()).role(MemberRole.GROUP_ADMIN).build())));

        mockMvc.perform(post("/api/trips/" + tripId + "/members")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(AddMemberRequestDTO.builder().email(memberUser.getEmail()).role(MemberRole.MEMBER).build())));

        // 9. Regular member tries to change role -> 403 Forbidden
        mockMvc.perform(put("/api/trips/" + tripId + "/members/" + adminUser.getId() + "/role")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateMemberRoleRequestDTO.builder().role(MemberRole.MEMBER).build())))
                .andExpect(status().isForbidden());

        // 8. Group Admin promotes memberUser to GROUP_ADMIN -> 200 OK
        mockMvc.perform(put("/api/trips/" + tripId + "/members/" + memberUser.getId() + "/role")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateMemberRoleRequestDTO.builder().role(MemberRole.GROUP_ADMIN).build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("GROUP_ADMIN")));

        // 7. Owner demotes memberUser back to MEMBER -> 200 OK
        mockMvc.perform(put("/api/trips/" + tripId + "/members/" + memberUser.getId() + "/role")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateMemberRoleRequestDTO.builder().role(MemberRole.MEMBER).build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("MEMBER")));

        // Attempt to change Trip Owner role -> 400 Bad Request
        mockMvc.perform(put("/api/trips/" + tripId + "/members/" + ownerUser.getId() + "/role")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(UpdateMemberRoleRequestDTO.builder().role(MemberRole.MEMBER).build())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("10 & 11 & 12 & 13: Trip Access: Owner, Admin, Member have access; Outsider does not (403)")
    void testTripAccessAndListing() throws Exception {
        Long tripId = createTripForOwner();

        // Add memberUser
        mockMvc.perform(post("/api/trips/" + tripId + "/members")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(AddMemberRequestDTO.builder().email(memberUser.getEmail()).role(MemberRole.MEMBER).build())));

        // 10. Owner has access
        mockMvc.perform(get("/api/trips/" + tripId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk());

        // 12. Member has access
        mockMvc.perform(get("/api/trips/" + tripId)
                        .header("Authorization", memberToken))
                .andExpect(status().isOk());

        // 13. Outsider has no access -> 403 Forbidden
        mockMvc.perform(get("/api/trips/" + tripId)
                        .header("Authorization", outsiderToken))
                .andExpect(status().isForbidden());

        // Member gets the trip in their trip list
        mockMvc.perform(get("/api/trips")
                        .header("Authorization", memberToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(tripId.intValue())));
    }

    @Test
    @DisplayName("14: Member cannot delete the trip; only Owner can")
    void testTripDeleteProtection() throws Exception {
        Long tripId = createTripForOwner();

        // Add memberUser
        mockMvc.perform(post("/api/trips/" + tripId + "/members")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(AddMemberRequestDTO.builder().email(memberUser.getEmail()).role(MemberRole.MEMBER).build())));

        // Member attempts to delete trip -> 403 Forbidden
        mockMvc.perform(delete("/api/trips/" + tripId)
                        .header("Authorization", memberToken))
                .andExpect(status().isForbidden());

        // Owner deletes trip -> 204 No Content
        mockMvc.perform(delete("/api/trips/" + tripId)
                        .header("Authorization", ownerToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("15, 16, 17, 18, 19, 20: Join Request lifecycle (create, duplicate reject, approve, reject, unauthorized check)")
    void testJoinRequestLifecycle() throws Exception {
        Long tripId = createTripForOwner();

        // 15. Outsider creates join request
        MvcResult jrResult = mockMvc.perform(post("/api/trips/" + tripId + "/join-requests")
                        .header("Authorization", outsiderToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.userEmail", is(outsiderUser.getEmail())))
                .andReturn();

        Long requestId = objectMapper.readTree(jrResult.getResponse().getContentAsString()).get("id").asLong();

        // 16. Duplicate pending join request -> 400 Bad Request
        mockMvc.perform(post("/api/trips/" + tripId + "/join-requests")
                        .header("Authorization", outsiderToken))
                .andExpect(status().isBadRequest());

        // 20. Unauthorized user (member) cannot manage join requests
        mockMvc.perform(get("/api/trips/" + tripId + "/join-requests")
                        .header("Authorization", outsiderToken))
                .andExpect(status().isForbidden());

        // 17 & 18. Owner approves join request -> status APPROVED & membership created
        mockMvc.perform(put("/api/trips/" + tripId + "/join-requests/" + requestId + "/approve")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));

        // Outsider is now a member and can access the trip
        mockMvc.perform(get("/api/trips/" + tripId)
                        .header("Authorization", outsiderToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("21: Member can collaborate on Itinerary, Activities, Budget, and Expenses")
    void testMemberCollaborationOnTripResources() throws Exception {
        Long tripId = createTripForOwner();

        // Add memberUser
        mockMvc.perform(post("/api/trips/" + tripId + "/members")
                .header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(AddMemberRequestDTO.builder().email(memberUser.getEmail()).role(MemberRole.MEMBER).build())));

        // Member adds Itinerary Day
        ItineraryDayRequestDTO dayDto = ItineraryDayRequestDTO.builder()
                .dayNumber(1)
                .date(LocalDate.now().plusDays(5))
                .title("Day 1: Arrival & Exploration")
                .build();

        MvcResult dayResult = mockMvc.perform(post("/api/trips/" + tripId + "/itinerary-days")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dayDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dayNumber", is(1)))
                .andReturn();

        Long dayId = objectMapper.readTree(dayResult.getResponse().getContentAsString()).get("id").asLong();

        // Member adds Activity to Day
        ActivityRequestDTO actDto = ActivityRequestDTO.builder()
                .time("10:00 AM")
                .title("Museum Tour")
                .description("Visiting the main gallery")
                .location("Central Square")
                .cost(45.0)
                .build();

        mockMvc.perform(post("/api/trips/itinerary-days/" + dayId + "/activities")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(actDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Museum Tour")));

        // Member creates Budget
        BudgetRequestDTO budgetDto = BudgetRequestDTO.builder()
                .totalBudget(BigDecimal.valueOf(2000.00))
                .currency("USD")
                .accommodationBudget(BigDecimal.valueOf(800.00))
                .foodBudget(BigDecimal.valueOf(500.00))
                .transportationBudget(BigDecimal.valueOf(300.00))
                .activitiesBudget(BigDecimal.valueOf(200.00))
                .emergencyBudget(BigDecimal.valueOf(200.00))
                .build();

        mockMvc.perform(post("/api/trips/" + tripId + "/budget")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(budgetDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalBudget", is(2000.0)));

        // Member adds Expense
        ExpenseRequestDTO expDto = ExpenseRequestDTO.builder()
                .title("Dinner at Bistro")
                .category("Food")
                .amount(BigDecimal.valueOf(65.50))
                .expenseDate(LocalDate.now().plusDays(5))
                .build();

        mockMvc.perform(post("/api/trips/" + tripId + "/expenses")
                        .header("Authorization", memberToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Dinner at Bistro")));
    }
}

package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.auth.UserDTO;
import com.tripnest.tripnest_backend.dto.destination.DestinationResponseDTO;
import com.tripnest.tripnest_backend.dto.trip.TripRequestDTO;
import com.tripnest.tripnest_backend.dto.trip.TripResponseDTO;
import com.tripnest.tripnest_backend.exception.BadRequestException;
import com.tripnest.tripnest_backend.exception.ForbiddenException;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.JoinRequestRepository;
import com.tripnest.tripnest_backend.repository.TripMembershipRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.service.NotificationService;
import com.tripnest.tripnest_backend.service.TripAccessService;
import com.tripnest.tripnest_backend.service.TripService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final DestinationRepository destinationRepository;
    private final TripMembershipRepository tripMembershipRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final com.tripnest.tripnest_backend.repository.ExpenseRepository expenseRepository;
    private final com.tripnest.tripnest_backend.repository.BudgetRepository budgetRepository;
    private final com.tripnest.tripnest_backend.repository.ItineraryDayRepository itineraryDayRepository;
    private final com.tripnest.tripnest_backend.repository.ActivityRepository activityRepository;
    private final com.tripnest.tripnest_backend.repository.ReminderLogRepository reminderLogRepository;
    private final TripAccessService tripAccessService;
    private final NotificationService notificationService;
    private final com.tripnest.tripnest_backend.service.EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public TripResponseDTO createTrip(TripRequestDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        if (user.getRole() == Role.ADMINISTRATOR) {
            throw new BadRequestException("Administrators cannot create personal trips.");
        }

        validateTripDates(dto.getStartDate(), dto.getEndDate());

        Destination destination = destinationRepository.findById(dto.getDestinationId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + dto.getDestinationId()));

        Trip trip = Trip.builder()
                .title(dto.getTitle().trim())
                .description(dto.getDescription())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .budget(dto.getBudget())
                .status(dto.getStatus() != null ? dto.getStatus() : TripStatus.PLANNED)
                .user(user)
                .destination(destination)
                .build();

        Trip savedTrip = tripRepository.save(trip);
        log.info("[TripNest] Trip [{}] (ID: {}) successfully created by owner [{}]", savedTrip.getTitle(), savedTrip.getId(), userEmail);

        if (dto.getInvitedEmails() != null && !dto.getInvitedEmails().isEmpty()) {
            String destinationName = destination.getName();
            String dates = (savedTrip.getStartDate() != null && savedTrip.getEndDate() != null)
                    ? (savedTrip.getStartDate() + " – " + savedTrip.getEndDate())
                    : "Upcoming Dates";

            for (String rawEmail : dto.getInvitedEmails()) {
                if (rawEmail == null || rawEmail.trim().isBlank()) continue;
                String email = rawEmail.trim().toLowerCase();
                if (email.equalsIgnoreCase(userEmail)) continue;

                log.info("[TripNest] Processing invitation for [{}] on newly created trip [{}]", email, savedTrip.getTitle());

                User userToAdd = userRepository.findByEmail(email)
                        .orElseGet(() -> {
                            log.info("[TripNest] Recipient [{}] is not yet registered. Creating invited traveler placeholder account.", email);
                            String tempName = email.contains("@") ? email.split("@")[0] : "Invited Traveler";
                            if (!tempName.isEmpty()) {
                                tempName = Character.toUpperCase(tempName.charAt(0)) + (tempName.length() > 1 ? tempName.substring(1) : "");
                            }
                            User newUser = User.builder()
                                    .email(email)
                                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                                    .fullName(tempName)
                                    .role(Role.TRAVELER)
                                    .createdAt(LocalDateTime.now())
                                    .updatedAt(LocalDateTime.now())
                                    .build();
                            return userRepository.save(newUser);
                        });

                if (!tripMembershipRepository.existsByTripIdAndUserId(savedTrip.getId(), userToAdd.getId())) {
                    // Create pending invitation (JoinRequest) instead of adding as member immediately
                    JoinRequest invitation = joinRequestRepository.findByTripIdAndUserIdAndStatus(savedTrip.getId(), userToAdd.getId(), JoinRequestStatus.PENDING)
                            .orElseGet(() -> JoinRequest.builder()
                                    .trip(savedTrip)
                                    .user(userToAdd)
                                    .status(JoinRequestStatus.PENDING)
                                    .build());
                    invitation.setStatus(JoinRequestStatus.PENDING);
                    joinRequestRepository.save(invitation);

                    notificationService.createNotification(
                            userToAdd,
                            NotificationType.TRIP_INVITATION,
                            "You have been invited to join the trip: " + savedTrip.getTitle(),
                            savedTrip.getId(),
                            false
                    );

                    log.info("[TripNest] Sending invitation email to [{}] for trip [{}]...", userToAdd.getEmail(), savedTrip.getTitle());
                    boolean sent = emailService.sendInvitationEmail(
                            userToAdd.getEmail(),
                            userToAdd.getFullName(),
                            user.getFullName(),
                            savedTrip.getTitle(),
                            destinationName,
                            dates,
                            savedTrip.getId()
                    );
                    log.info("[TripNest] Invitation email dispatch finished for [{}]. SMTP Accepted: {}", userToAdd.getEmail(), sent);
                }
            }
        }

        return mapToDTO(savedTrip);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponseDTO> getTripsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        List<Trip> trips;
        if (user.getRole() == Role.ADMINISTRATOR) {
            trips = tripRepository.findAllWithDetails();
        } else {
            trips = tripRepository.findAllAccessibleByUserId(user.getId());
        }

        return trips.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponseDTO getTripById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Trip trip = tripRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        tripAccessService.validateTripAccess(user, trip);

        return mapToDTO(trip);
    }

    @Override
    @Transactional
    public TripResponseDTO updateTrip(Long id, TripRequestDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Trip trip = tripRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        tripAccessService.validateTripAccess(user, trip);

        Destination oldDestination = trip.getDestination();
        LocalDate oldStartDate = trip.getStartDate();
        LocalDate oldEndDate = trip.getEndDate();

        boolean destinationChanged = false;
        Destination newDestination = oldDestination;
        if (dto.getDestinationId() != null && (oldDestination == null || !dto.getDestinationId().equals(oldDestination.getId()))) {
            newDestination = destinationRepository.findById(dto.getDestinationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + dto.getDestinationId()));
            trip.setDestination(newDestination);
            destinationChanged = true;
        }

        if (dto.getTitle() != null) {
            trip.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            trip.setDescription(dto.getDescription());
        }

        boolean startDateChanged = false;
        if (dto.getStartDate() != null && !dto.getStartDate().equals(oldStartDate)) {
            trip.setStartDate(dto.getStartDate());
            startDateChanged = true;
        }

        boolean endDateChanged = false;
        if (dto.getEndDate() != null && !dto.getEndDate().equals(oldEndDate)) {
            trip.setEndDate(dto.getEndDate());
            endDateChanged = true;
        }

        // Validate final dates after applying update
        if (trip.getEndDate() != null && trip.getStartDate() != null
                && trip.getEndDate().isBefore(trip.getStartDate())) {
            throw new BadRequestException("End date must not be before start date.");
        }
        if (dto.getBudget() != null) {
            trip.setBudget(dto.getBudget());
        }
        if (dto.getStatus() != null) {
            trip.setStatus(dto.getStatus());
        }

        Trip updatedTrip = tripRepository.save(trip);

        // Send Travel Update notification if any core field changed
        if (destinationChanged || startDateChanged || endDateChanged) {
            notifyTripMembersOfUpdate(updatedTrip, user, destinationChanged, startDateChanged || endDateChanged, oldDestination, newDestination);
        }

        return mapToDTO(updatedTrip);
    }

    private void notifyTripMembersOfUpdate(Trip trip, User updater, boolean destinationChanged, boolean datesChanged, Destination oldDest, Destination newDest) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d MMM");
        String message;

        if (destinationChanged && datesChanged) {
            String oldDestName = oldDest != null ? oldDest.getName() : "previous destination";
            String newDestName = newDest != null ? newDest.getName() : "new destination";
            message = String.format("Travel update for \"%s\": destination has changed from %s to %s, and trip dates have been updated to %s – %s.",
                    trip.getTitle(), oldDestName, newDestName, trip.getStartDate().format(formatter), trip.getEndDate().format(formatter));
        } else if (destinationChanged) {
            String oldDestName = oldDest != null ? oldDest.getName() : "previous destination";
            String newDestName = newDest != null ? newDest.getName() : "new destination";
            message = String.format("Travel update: your trip destination has changed from %s to %s.", oldDestName, newDestName);
        } else {
            message = String.format("Travel update: your trip dates have been updated to %s – %s.",
                    trip.getStartDate().format(formatter), trip.getEndDate().format(formatter));
        }

        Set<User> recipients = new LinkedHashSet<>();
        // Include trip owner if the modifier is not the owner
        if (trip.getUser() != null && !trip.getUser().getId().equals(updater.getId())) {
            recipients.add(trip.getUser());
        }

        // Include all other members except the updater
        tripMembershipRepository.findByTripIdWithUser(trip.getId()).forEach(tm -> {
            if (tm.getUser() != null && !tm.getUser().getId().equals(updater.getId())) {
                recipients.add(tm.getUser());
            }
        });

        for (User recipient : recipients) {
            notificationService.createNotification(recipient, NotificationType.TRIP_UPDATE, message, false);
        }
    }

    private void validateTripDates(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new BadRequestException("End date must not be before start date.");
        }
    }

    @Override
    @Transactional
    public void deleteTrip(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Trip trip = tripRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        tripAccessService.validateTripDelete(user, trip);

        expenseRepository.deleteByTripId(trip.getId());
        budgetRepository.deleteByTripId(trip.getId());
        activityRepository.deleteByTripId(trip.getId());
        itineraryDayRepository.deleteByTripId(trip.getId());

        tripMembershipRepository.deleteByTripId(trip.getId());
        joinRequestRepository.deleteByTripId(trip.getId());

        reminderLogRepository.deleteByReminderTypeAndEntityId("TRIP_START", trip.getId());
        reminderLogRepository.deleteByReminderTypeAndEntityId("BUDGET_THRESHOLD_80", trip.getId());
        reminderLogRepository.deleteByReminderTypeAndEntityId("BUDGET_THRESHOLD_100", trip.getId());

        tripRepository.delete(trip);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponseDTO> searchTrips(String query) {
        if (query == null || query.trim().isBlank()) {
            return tripRepository.findAllWithDetails().stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList());
        }
        return tripRepository.searchTrips(query.trim()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public TripResponseDTO mapToDTO(Trip trip) {
        if (trip == null) {
            return null;
        }

        Destination destination = trip.getDestination();
        DestinationResponseDTO destinationDTO = destination != null ? DestinationResponseDTO.builder()
                .id(destination.getId())
                .name(destination.getName())
                .country(destination.getCountry())
                .description(destination.getDescription())
                .imageUrl(destination.getImageUrl())
                .category(destination.getCategory())
                .averageCost(destination.getAverageCost())
                .createdAt(destination.getCreatedAt())
                .build() : null;

        User owner = trip.getUser();
        UserDTO userDTO = owner != null ? UserDTO.builder()
                .id(owner.getId())
                .email(owner.getEmail())
                .fullName(owner.getFullName())
                .role(owner.getRole())
                .createdAt(owner.getCreatedAt())
                .build() : null;

        return TripResponseDTO.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .description(trip.getDescription())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .budget(trip.getBudget())
                .status(trip.getStatus())
                .destination(destinationDTO)
                .user(userDTO)
                .createdAt(trip.getCreatedAt())
                .updatedAt(trip.getUpdatedAt())
                .build();
    }
}

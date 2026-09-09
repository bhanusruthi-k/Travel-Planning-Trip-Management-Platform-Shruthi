package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.membership.AddMemberRequestDTO;
import com.tripnest.tripnest_backend.dto.membership.JoinRequestResponseDTO;
import com.tripnest.tripnest_backend.dto.membership.MemberResponseDTO;
import com.tripnest.tripnest_backend.dto.membership.UpdateMemberRoleRequestDTO;
import com.tripnest.tripnest_backend.exception.BadRequestException;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.JoinRequestRepository;
import com.tripnest.tripnest_backend.repository.TripMembershipRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.service.MembershipService;
import com.tripnest.tripnest_backend.service.TripAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class MembershipServiceImpl implements MembershipService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMembershipRepository tripMembershipRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final com.tripnest.tripnest_backend.repository.NotificationRepository notificationRepository;
    private final TripAccessService tripAccessService;
    private final com.tripnest.tripnest_backend.service.NotificationService notificationService;
    private final com.tripnest.tripnest_backend.service.EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public MemberResponseDTO addMember(Long tripId, AddMemberRequestDTO dto, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Trip trip = getTrip(tripId);

        tripAccessService.validateMemberManagementAccess(requester, trip);

        if (dto.getEmail() == null || dto.getEmail().trim().isBlank()) {
            throw new BadRequestException("Email is required.");
        }

        String cleanEmail = dto.getEmail().trim().toLowerCase();
        log.info("[TRIPNEST INVITATION] Creating invitation for: {}", cleanEmail);

        User userToAdd = userRepository.findByEmail(cleanEmail)
                .orElseGet(() -> {
                    log.info("[TripNest] Recipient [{}] is not yet registered. Creating invited traveler placeholder account.", cleanEmail);
                    String tempName = cleanEmail.contains("@") ? cleanEmail.split("@")[0] : "Invited Traveler";
                    if (!tempName.isEmpty()) {
                        tempName = Character.toUpperCase(tempName.charAt(0)) + (tempName.length() > 1 ? tempName.substring(1) : "");
                    }
                    User newUser = User.builder()
                            .email(cleanEmail)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .fullName(tempName)
                            .role(Role.TRAVELER)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return userRepository.save(newUser);
                });

        if (trip.getUser().getId().equals(userToAdd.getId())) {
            throw new BadRequestException("The trip owner cannot be added as a regular member.");
        }

        if (tripMembershipRepository.existsByTripIdAndUserId(tripId, userToAdd.getId())) {
            throw new BadRequestException("User is already a member of this trip.");
        }

        if (joinRequestRepository.existsByTripIdAndUserIdAndStatus(tripId, userToAdd.getId(), JoinRequestStatus.PENDING)) {
            throw new BadRequestException("An invitation is already pending for this user.");
        }

        log.info("[TripNest] Creating pending invitation for user [{}] on trip [{}]", userToAdd.getEmail(), trip.getTitle());

        // Create or update JoinRequest with PENDING status
        JoinRequest invitation = joinRequestRepository.findByTripIdAndUserIdAndStatus(tripId, userToAdd.getId(), JoinRequestStatus.PENDING)
                .orElseGet(() -> JoinRequest.builder()
                        .trip(trip)
                        .user(userToAdd)
                        .status(JoinRequestStatus.PENDING)
                        .build());
        invitation.setStatus(JoinRequestStatus.PENDING);
        joinRequestRepository.save(invitation);

        // Send in-app notification to invited user
        notificationService.createNotification(
                userToAdd,
                NotificationType.TRIP_INVITATION,
                "You have been invited to join the trip: " + trip.getTitle(),
                trip.getId(),
                false
        );

        // Send dedicated invitation email
        String destinationName = trip.getDestination() != null ? trip.getDestination().getName() : "Custom Destination";
        String dates = (trip.getStartDate() != null && trip.getEndDate() != null)
                ? (trip.getStartDate() + " – " + trip.getEndDate())
                : "Upcoming Dates";

        log.info("[TRIPNEST EMAIL] Attempting to send invitation to: {}", userToAdd.getEmail());
        boolean emailSent = emailService.sendInvitationEmail(
                userToAdd.getEmail(),
                userToAdd.getFullName(),
                requester.getFullName(),
                trip.getTitle(),
                destinationName,
                dates,
                trip.getId()
        );
        log.info("[TripNest] Invitation email dispatch finished for [{}]. SMTP Accepted: {}", userToAdd.getEmail(), emailSent);

        MemberResponseDTO dtoResponse = MemberResponseDTO.builder()
                .id(null)
                .userId(userToAdd.getId())
                .fullName(userToAdd.getFullName())
                .email(userToAdd.getEmail())
                .role("PENDING_INVITATION")
                .joinedAt(LocalDateTime.now())
                .emailDelivered(emailSent)
                .build();
        return dtoResponse;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberResponseDTO> getTripMembers(Long tripId, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Trip trip = getTrip(tripId);

        tripAccessService.validateTripAccess(requester, trip);

        List<MemberResponseDTO> members = new ArrayList<>();

        // Add Trip Owner as first member
        User owner = trip.getUser();
        members.add(MemberResponseDTO.builder()
                .id(null)
                .userId(owner.getId())
                .fullName(owner.getFullName())
                .email(owner.getEmail())
                .role("OWNER")
                .joinedAt(trip.getCreatedAt())
                .build());

        // Add all other trip members
        List<TripMembership> memberships = tripMembershipRepository.findByTripIdWithUser(tripId);
        for (TripMembership tm : memberships) {
            members.add(mapToMemberDTO(tm));
        }

        return members;
    }

    @Override
    @Transactional
    public void removeMember(Long tripId, Long userId, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Trip trip = getTrip(tripId);

        tripAccessService.validateMemberManagementAccess(requester, trip);

        if (trip.getUser().getId().equals(userId)) {
            throw new BadRequestException("The trip owner cannot be removed from the trip.");
        }

        TripMembership membership = tripMembershipRepository.findByTripIdAndUserId(tripId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member record not found for user id: " + userId));

        tripMembershipRepository.delete(membership);
    }

    @Override
    @Transactional
    public MemberResponseDTO updateMemberRole(Long tripId, Long userId, UpdateMemberRoleRequestDTO dto, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Trip trip = getTrip(tripId);

        tripAccessService.validateMemberManagementAccess(requester, trip);

        if (trip.getUser().getId().equals(userId)) {
            throw new BadRequestException("The trip owner's role cannot be changed.");
        }

        if (dto.getRole() == null) {
            throw new BadRequestException("Role must be specified as MEMBER or GROUP_ADMIN.");
        }

        TripMembership membership = tripMembershipRepository.findByTripIdAndUserId(tripId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member record not found for user id: " + userId));

        membership.setMemberRole(dto.getRole());
        TripMembership updated = tripMembershipRepository.save(membership);
        return mapToMemberDTO(updated);
    }

    @Override
    @Transactional
    public JoinRequestResponseDTO createJoinRequest(Long tripId, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Trip trip = getTrip(tripId);

        if (trip.getUser().getId().equals(requester.getId())) {
            throw new BadRequestException("You are already the owner of this trip.");
        }

        if (tripMembershipRepository.existsByTripIdAndUserId(tripId, requester.getId())) {
            throw new BadRequestException("You are already a member of this trip.");
        }

        if (joinRequestRepository.existsByTripIdAndUserIdAndStatus(tripId, requester.getId(), JoinRequestStatus.PENDING)) {
            throw new BadRequestException("You already have a pending join request for this trip.");
        }

        JoinRequest request = JoinRequest.builder()
                .trip(trip)
                .user(requester)
                .status(JoinRequestStatus.PENDING)
                .build();

        JoinRequest saved = joinRequestRepository.save(request);

        // Notify trip owner about join request
        notificationService.createNotification(
                trip.getUser(),
                NotificationType.JOIN_REQUEST_SUBMITTED,
                requester.getFullName() + " requested to join your trip: " + trip.getTitle(),
                true
        );

        return mapToJoinRequestDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JoinRequestResponseDTO> getJoinRequests(Long tripId, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Trip trip = getTrip(tripId);

        tripAccessService.validateMemberManagementAccess(requester, trip);

        List<JoinRequest> requests = joinRequestRepository.findByTripIdWithDetails(tripId);
        return requests.stream().map(this::mapToJoinRequestDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public JoinRequestResponseDTO approveJoinRequest(Long tripId, Long requestId, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Trip trip = getTrip(tripId);

        tripAccessService.validateMemberManagementAccess(requester, trip);

        JoinRequest joinRequest = joinRequestRepository.findByIdAndTripId(requestId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found with id: " + requestId));

        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new BadRequestException("Join request has already been " + joinRequest.getStatus().name().toLowerCase() + ".");
        }

        joinRequest.setStatus(JoinRequestStatus.APPROVED);
        JoinRequest updated = joinRequestRepository.save(joinRequest);

        // Add as trip member if not already member
        if (!tripMembershipRepository.existsByTripIdAndUserId(tripId, joinRequest.getUser().getId())) {
            TripMembership membership = TripMembership.builder()
                    .trip(trip)
                    .user(joinRequest.getUser())
                    .memberRole(MemberRole.MEMBER)
                    .build();
            tripMembershipRepository.save(membership);
        }

        // Notify the requester that their join request was approved
        notificationService.createNotification(
                joinRequest.getUser(),
                NotificationType.JOIN_REQUEST_APPROVED,
                "Your request to join " + trip.getTitle() + " has been approved.",
                true
        );

        return mapToJoinRequestDTO(updated);
    }

    @Override
    @Transactional
    public JoinRequestResponseDTO rejectJoinRequest(Long tripId, Long requestId, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Trip trip = getTrip(tripId);

        tripAccessService.validateMemberManagementAccess(requester, trip);

        JoinRequest joinRequest = joinRequestRepository.findByIdAndTripId(requestId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found with id: " + requestId));

        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new BadRequestException("Join request has already been " + joinRequest.getStatus().name().toLowerCase() + ".");
        }

        joinRequest.setStatus(JoinRequestStatus.REJECTED);
        JoinRequest updated = joinRequestRepository.save(joinRequest);

        // Notify the requester that their join request was rejected
        notificationService.createNotification(
                joinRequest.getUser(),
                NotificationType.JOIN_REQUEST_REJECTED,
                "Your request to join " + trip.getTitle() + " was rejected.",
                true
        );

        return mapToJoinRequestDTO(updated);
    }

    @Override
    @Transactional
    public MemberResponseDTO acceptInvitation(Long tripId, String userEmail) {
        User user = getUser(userEmail);
        Trip trip = getTrip(tripId);

        if (trip.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("The trip owner cannot accept an invitation to their own trip.");
        }

        // 1. Validate that the invitation exists and is PENDING for this user
        List<JoinRequest> pendingInvitations = joinRequestRepository.findByTripIdAndStatus(tripId, JoinRequestStatus.PENDING)
                .stream()
                .filter(jr -> jr.getUser().getId().equals(user.getId()))
                .collect(Collectors.toList());

        if (pendingInvitations.isEmpty()) {
            // Check if already accepted / member
            Optional<TripMembership> existingMembership = tripMembershipRepository.findByTripIdAndUserId(tripId, user.getId());
            if (existingMembership.isPresent()) {
                return mapToMemberDTO(existingMembership.get());
            }
            throw new BadRequestException("No pending invitation found for this trip.");
        }

        // 2. Mark invitation as APPROVED
        for (JoinRequest jr : pendingInvitations) {
            jr.setStatus(JoinRequestStatus.APPROVED);
            joinRequestRepository.save(jr);
        }

        // 3. Create trip membership if not already existing
        Optional<TripMembership> existing = tripMembershipRepository.findByTripIdAndUserId(tripId, user.getId());
        TripMembership membership;
        if (existing.isPresent()) {
            membership = existing.get();
        } else {
            membership = TripMembership.builder()
                    .trip(trip)
                    .user(user)
                    .memberRole(MemberRole.MEMBER)
                    .build();
            membership = tripMembershipRepository.save(membership);
        }

        // 4. Mark related invitation notifications as read
        List<Notification> userNotifs = notificationRepository.findByUserIdOrderByIdDesc(user.getId());
        for (Notification n : userNotifs) {
            if ((n.getNotifType() == NotificationType.TRIP_INVITATION || n.getNotifType() == NotificationType.MEMBER_ADDED) &&
                    (tripId.equals(n.getTripId()) || (n.getMessage() != null && n.getMessage().contains(trip.getTitle())))) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        }

        // 5. Notify trip owner
        if (trip.getUser() != null && !trip.getUser().getId().equals(user.getId())) {
            String inviterMessage = (user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail())
                    + " accepted your invitation to join the trip: " + trip.getTitle();
            notificationService.createNotification(
                    trip.getUser(),
                    NotificationType.INVITATION_ACCEPTED,
                    inviterMessage,
                    trip.getId(),
                    true
            );
        }

        return mapToMemberDTO(membership);
    }

    @Override
    @Transactional
    public void rejectInvitation(Long tripId, String userEmail) {
        User user = getUser(userEmail);
        Trip trip = getTrip(tripId);

        if (trip.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("The trip owner cannot reject an invitation.");
        }

        // 1. Validate that the invitation exists and is PENDING for this user
        List<JoinRequest> pendingInvitations = joinRequestRepository.findByTripIdAndStatus(tripId, JoinRequestStatus.PENDING)
                .stream()
                .filter(jr -> jr.getUser().getId().equals(user.getId()))
                .collect(Collectors.toList());

        if (pendingInvitations.isEmpty()) {
            throw new BadRequestException("No pending invitation found for this trip.");
        }

        // 2. Mark invitation as REJECTED
        for (JoinRequest jr : pendingInvitations) {
            jr.setStatus(JoinRequestStatus.REJECTED);
            joinRequestRepository.save(jr);
        }

        // 3. Mark related invitation notifications as read
        List<Notification> userNotifs = notificationRepository.findByUserIdOrderByIdDesc(user.getId());
        for (Notification n : userNotifs) {
            if ((n.getNotifType() == NotificationType.TRIP_INVITATION || n.getNotifType() == NotificationType.MEMBER_ADDED) &&
                    (tripId.equals(n.getTripId()) || (n.getMessage() != null && n.getMessage().contains(trip.getTitle())))) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        }

        // 4. Notify trip owner
        if (trip.getUser() != null && !trip.getUser().getId().equals(user.getId())) {
            String inviterMessage = (user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail())
                    + " rejected your invitation to join the trip: " + trip.getTitle();
            notificationService.createNotification(
                    trip.getUser(),
                    NotificationType.INVITATION_REJECTED,
                    inviterMessage,
                    trip.getId(),
                    true
            );
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private Trip getTrip(Long tripId) {
        return tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
    }

    private MemberResponseDTO mapToMemberDTO(TripMembership tm) {
        if (tm == null) return null;
        User user = tm.getUser();
        return MemberResponseDTO.builder()
                .id(tm.getId())
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(tm.getMemberRole().name())
                .joinedAt(tm.getCreatedAt())
                .build();
    }

    private JoinRequestResponseDTO mapToJoinRequestDTO(JoinRequest jr) {
        if (jr == null) return null;
        return JoinRequestResponseDTO.builder()
                .id(jr.getId())
                .tripId(jr.getTrip().getId())
                .tripTitle(jr.getTrip().getTitle())
                .userId(jr.getUser().getId())
                .userName(jr.getUser().getFullName())
                .userEmail(jr.getUser().getEmail())
                .status(jr.getStatus())
                .createdAt(jr.getCreatedAt())
                .updatedAt(jr.getUpdatedAt())
                .build();
    }
}

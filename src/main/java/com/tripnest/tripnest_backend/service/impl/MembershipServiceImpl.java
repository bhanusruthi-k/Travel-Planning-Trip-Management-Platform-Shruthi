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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MembershipServiceImpl implements MembershipService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMembershipRepository tripMembershipRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final TripAccessService tripAccessService;
    private final com.tripnest.tripnest_backend.service.NotificationService notificationService;

    @Override
    @Transactional
    public MemberResponseDTO addMember(Long tripId, AddMemberRequestDTO dto, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Trip trip = getTrip(tripId);

        tripAccessService.validateMemberManagementAccess(requester, trip);

        if (dto.getEmail() == null || dto.getEmail().trim().isBlank()) {
            throw new BadRequestException("Email is required.");
        }

        User userToAdd = userRepository.findByEmail(dto.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + dto.getEmail()));

        if (trip.getUser().getId().equals(userToAdd.getId())) {
            throw new BadRequestException("The trip owner cannot be added as a regular member.");
        }

        if (tripMembershipRepository.existsByTripIdAndUserId(tripId, userToAdd.getId())) {
            throw new BadRequestException("User is already a member of this trip.");
        }

        MemberRole role = dto.getRole() != null ? dto.getRole() : MemberRole.MEMBER;

        TripMembership membership = TripMembership.builder()
                .trip(trip)
                .user(userToAdd)
                .memberRole(role)
                .build();

        TripMembership saved = tripMembershipRepository.save(membership);

        // Send notification to newly added user
        notificationService.createNotification(
                userToAdd,
                NotificationType.MEMBER_ADDED,
                "You have been added to the trip: " + trip.getTitle(),
                true
        );

        return mapToMemberDTO(saved);
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

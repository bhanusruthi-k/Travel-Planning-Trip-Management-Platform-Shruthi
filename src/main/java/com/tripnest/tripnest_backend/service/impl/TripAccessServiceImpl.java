package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.exception.ForbiddenException;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.MemberRole;
import com.tripnest.tripnest_backend.model.Role;
import com.tripnest.tripnest_backend.model.Trip;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.TripMembershipRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.service.TripAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TripAccessServiceImpl implements TripAccessService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMembershipRepository tripMembershipRepository;

    @Override
    @Transactional(readOnly = true)
    public boolean hasTripAccess(User user, Trip trip) {
        if (user == null || trip == null) {
            return false;
        }
        if (user.getRole() == Role.ADMINISTRATOR) {
            return true;
        }
        if (trip.getUser() != null && trip.getUser().getId().equals(user.getId())) {
            return true;
        }
        return tripMembershipRepository.existsByTripIdAndUserId(trip.getId(), user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasTripAccess(Long userId, Long tripId) {
        if (userId == null || tripId == null) {
            return false;
        }
        User user = userRepository.findById(userId).orElse(null);
        Trip trip = tripRepository.findById(tripId).orElse(null);
        return hasTripAccess(user, trip);
    }

    @Override
    @Transactional(readOnly = true)
    public void validateTripAccess(User user, Trip trip) {
        if (!hasTripAccess(user, trip)) {
            throw new ForbiddenException("You do not have permission to access this trip.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canManageMembers(User user, Trip trip) {
        if (user == null || trip == null) {
            return false;
        }
        if (user.getRole() == Role.ADMINISTRATOR) {
            return true;
        }
        if (trip.getUser() != null && trip.getUser().getId().equals(user.getId())) {
            return true;
        }
        return tripMembershipRepository.findByTripIdAndUserId(trip.getId(), user.getId())
                .map(m -> m.getMemberRole() == MemberRole.GROUP_ADMIN)
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canManageMembers(Long userId, Long tripId) {
        if (userId == null || tripId == null) {
            return false;
        }
        User user = userRepository.findById(userId).orElse(null);
        Trip trip = tripRepository.findById(tripId).orElse(null);
        return canManageMembers(user, trip);
    }

    @Override
    @Transactional(readOnly = true)
    public void validateMemberManagementAccess(User user, Trip trip) {
        if (!canManageMembers(user, trip)) {
            throw new ForbiddenException("You do not have permission to manage members for this trip.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canDeleteTrip(User user, Trip trip) {
        if (user == null || trip == null) {
            return false;
        }
        if (user.getRole() == Role.ADMINISTRATOR) {
            return true;
        }
        return trip.getUser() != null && trip.getUser().getId().equals(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public void validateTripDelete(User user, Trip trip) {
        if (!canDeleteTrip(user, trip)) {
            throw new ForbiddenException("Only the trip owner can delete this trip.");
        }
    }

    @Override
    public boolean isTripOwner(User user, Trip trip) {
        if (user == null || trip == null || trip.getUser() == null) {
            return false;
        }
        return trip.getUser().getId().equals(user.getId());
    }
}

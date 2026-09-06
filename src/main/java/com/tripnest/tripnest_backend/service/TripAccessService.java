package com.tripnest.tripnest_backend.service;

import com.tripnest.tripnest_backend.model.Trip;
import com.tripnest.tripnest_backend.model.User;

public interface TripAccessService {

    boolean hasTripAccess(User user, Trip trip);

    boolean hasTripAccess(Long userId, Long tripId);

    void validateTripAccess(User user, Trip trip);

    boolean canManageMembers(User user, Trip trip);

    boolean canManageMembers(Long userId, Long tripId);

    void validateMemberManagementAccess(User user, Trip trip);

    boolean canDeleteTrip(User user, Trip trip);

    void validateTripDelete(User user, Trip trip);

    boolean isTripOwner(User user, Trip trip);
}

package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.MemberRole;
import com.tripnest.tripnest_backend.model.TripMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TripMembershipRepository extends JpaRepository<TripMembership, Long> {

    @Query("SELECT tm FROM TripMembership tm JOIN FETCH tm.user WHERE tm.trip.id = :tripId")
    List<TripMembership> findByTripIdWithUser(@Param("tripId") Long tripId);

    List<TripMembership> findByTripId(Long tripId);

    Optional<TripMembership> findByTripIdAndUserId(Long tripId, Long userId);

    boolean existsByTripIdAndUserId(Long tripId, Long userId);

    void deleteByTripIdAndUserId(Long tripId, Long userId);

    void deleteByTripId(Long tripId);

    List<TripMembership> findByUserId(Long userId);

    @Query("SELECT tm.memberRole FROM TripMembership tm WHERE tm.trip.id = :tripId AND tm.user.id = :userId")
    Optional<MemberRole> findMemberRole(@Param("tripId") Long tripId, @Param("userId") Long userId);
}

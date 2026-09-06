package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.JoinRequest;
import com.tripnest.tripnest_backend.model.JoinRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {

    @Query("SELECT jr FROM JoinRequest jr JOIN FETCH jr.user JOIN FETCH jr.trip WHERE jr.trip.id = :tripId ORDER BY jr.createdAt DESC")
    List<JoinRequest> findByTripIdWithDetails(@Param("tripId") Long tripId);

    List<JoinRequest> findByTripId(Long tripId);

    void deleteByTripId(Long tripId);

    List<JoinRequest> findByTripIdAndStatus(Long tripId, JoinRequestStatus status);

    Optional<JoinRequest> findByIdAndTripId(Long id, Long tripId);

    boolean existsByTripIdAndUserIdAndStatus(Long tripId, Long userId, JoinRequestStatus status);

    Optional<JoinRequest> findByTripIdAndUserIdAndStatus(Long tripId, Long userId, JoinRequestStatus status);
}

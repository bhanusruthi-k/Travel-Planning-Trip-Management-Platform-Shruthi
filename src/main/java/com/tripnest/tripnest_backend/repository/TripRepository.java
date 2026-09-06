package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.dto.dashboard.DestinationAnalyticsDTO;
import com.tripnest.tripnest_backend.dto.dashboard.DestinationVisitDTO;
import com.tripnest.tripnest_backend.model.Trip;
import com.tripnest.tripnest_backend.model.TripStatus;
import com.tripnest.tripnest_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByUser(User user);

    List<Trip> findByUserId(Long userId);

    Optional<Trip> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT t FROM Trip t LEFT JOIN FETCH t.destination LEFT JOIN FETCH t.user WHERE t.user.id = :userId")
    List<Trip> findAllWithDetailsByUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Trip t LEFT JOIN FETCH t.destination LEFT JOIN FETCH t.user")
    List<Trip> findAllWithDetails();

    @Query("SELECT t FROM Trip t LEFT JOIN FETCH t.destination LEFT JOIN FETCH t.user WHERE t.id = :id")
    Optional<Trip> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT DISTINCT t FROM Trip t LEFT JOIN FETCH t.destination LEFT JOIN FETCH t.user " +
           "WHERE t.user.id = :userId OR t.id IN (SELECT tm.trip.id FROM TripMembership tm WHERE tm.user.id = :userId) " +
           "ORDER BY t.startDate DESC")
    List<Trip> findAllAccessibleByUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Trip t LEFT JOIN FETCH t.destination " +
           "WHERE t.user.id = :userId AND t.startDate >= :today ORDER BY t.startDate ASC")
    List<Trip> findUpcomingTripsByUserId(@Param("userId") Long userId, @Param("today") LocalDate today);

    long countByUserId(Long userId);

    @Query("SELECT COUNT(DISTINCT t.destination.id) FROM Trip t WHERE t.user.id = :userId AND t.destination IS NOT NULL")
    long countDistinctDestinationsByUserId(@Param("userId") Long userId);

    @Query("SELECT new com.tripnest.tripnest_backend.dto.dashboard.DestinationVisitDTO(d.id, d.name, d.country, COUNT(t)) " +
           "FROM Trip t JOIN t.destination d WHERE t.user.id = :userId " +
           "GROUP BY d.id, d.name, d.country ORDER BY COUNT(t) DESC")
    List<DestinationVisitDTO> getMostVisitedDestinationsByUserId(@Param("userId") Long userId);

    @Query("SELECT new com.tripnest.tripnest_backend.dto.dashboard.DestinationAnalyticsDTO(d.id, d.name, d.country, COUNT(t)) " +
           "FROM Trip t JOIN t.destination d " +
           "GROUP BY d.id, d.name, d.country ORDER BY COUNT(t) DESC")
    List<DestinationAnalyticsDTO> getPopularDestinationsAcrossPlatform();

    long countByStatus(TripStatus status);

    @Query("SELECT t FROM Trip t LEFT JOIN FETCH t.destination LEFT JOIN FETCH t.user " +
           "WHERE t.startDate = :targetDate AND t.status != com.tripnest.tripnest_backend.model.TripStatus.CANCELLED")
    List<Trip> findTripsStartingOnDate(@Param("targetDate") LocalDate targetDate);
}

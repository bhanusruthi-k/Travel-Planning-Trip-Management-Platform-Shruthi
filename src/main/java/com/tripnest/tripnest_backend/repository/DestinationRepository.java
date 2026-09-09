package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long> {
    List<Destination> findByCountryIgnoreCase(String country);
    List<Destination> findByCategoryIgnoreCase(String category);
    Optional<Destination> findByNameIgnoreCaseAndCountryIgnoreCase(String name, String country);
    boolean existsByNameIgnoreCaseAndCountryIgnoreCase(String name, String country);

    List<Destination> findByIsActiveTrue();
    List<Destination> findByIsPopularTrueAndIsActiveTrue();

    @Query("SELECT d FROM Destination d WHERE d.isActive = true " +
           "AND (:category IS NULL OR :category = '' OR :category = 'ALL' OR LOWER(d.category) LIKE LOWER(CONCAT('%', :category, '%'))) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.country) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Destination> searchDestinations(@Param("category") String category, @Param("search") String search);
}


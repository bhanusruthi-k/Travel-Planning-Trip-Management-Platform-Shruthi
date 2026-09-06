package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long> {
    List<Destination> findByCountryIgnoreCase(String country);
    List<Destination> findByCategoryIgnoreCase(String category);
}

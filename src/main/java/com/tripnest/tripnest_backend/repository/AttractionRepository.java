package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.Attraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttractionRepository extends JpaRepository<Attraction, Long> {

    List<Attraction> findByDestinationIdOrderByIdAsc(Long destinationId);

    List<Attraction> findByDestinationId(Long destinationId);
}

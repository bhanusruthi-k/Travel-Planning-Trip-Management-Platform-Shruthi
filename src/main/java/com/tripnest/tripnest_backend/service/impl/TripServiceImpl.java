package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.auth.UserDTO;
import com.tripnest.tripnest_backend.dto.destination.DestinationResponseDTO;
import com.tripnest.tripnest_backend.dto.trip.TripRequestDTO;
import com.tripnest.tripnest_backend.dto.trip.TripResponseDTO;
import com.tripnest.tripnest_backend.exception.BadRequestException;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.Destination;
import com.tripnest.tripnest_backend.model.Role;
import com.tripnest.tripnest_backend.model.Trip;
import com.tripnest.tripnest_backend.model.TripStatus;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.JoinRequestRepository;
import com.tripnest.tripnest_backend.repository.TripMembershipRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.service.TripAccessService;
import com.tripnest.tripnest_backend.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final DestinationRepository destinationRepository;
    private final TripMembershipRepository tripMembershipRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final TripAccessService tripAccessService;

    @Override
    @Transactional
    public TripResponseDTO createTrip(TripRequestDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Destination destination = destinationRepository.findById(dto.getDestinationId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + dto.getDestinationId()));

        if (dto.getEndDate() != null && dto.getStartDate() != null
                && dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new BadRequestException("End date must not be before start date.");
        }

        Trip trip = Trip.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .budget(dto.getBudget())
                .status(dto.getStatus() != null ? dto.getStatus() : TripStatus.PLANNED)
                .user(user)
                .destination(destination)
                .build();

        Trip savedTrip = tripRepository.save(trip);
        return mapToDTO(savedTrip);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponseDTO> getTripsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        List<Trip> trips;
        if (user.getRole() == Role.ADMINISTRATOR) {
            trips = tripRepository.findAllWithDetails();
        } else {
            trips = tripRepository.findAllAccessibleByUserId(user.getId());
        }

        return trips.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponseDTO getTripById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Trip trip = tripRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        tripAccessService.validateTripAccess(user, trip);

        return mapToDTO(trip);
    }

    @Override
    @Transactional
    public TripResponseDTO updateTrip(Long id, TripRequestDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Trip trip = tripRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        tripAccessService.validateTripAccess(user, trip);

        if (dto.getDestinationId() != null && !dto.getDestinationId().equals(trip.getDestination().getId())) {
            Destination destination = destinationRepository.findById(dto.getDestinationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + dto.getDestinationId()));
            trip.setDestination(destination);
        }

        if (dto.getTitle() != null) {
            trip.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            trip.setDescription(dto.getDescription());
        }
        if (dto.getStartDate() != null) {
            trip.setStartDate(dto.getStartDate());
        }
        if (dto.getEndDate() != null) {
            trip.setEndDate(dto.getEndDate());
        }

        // Validate final dates after applying update
        if (trip.getEndDate() != null && trip.getStartDate() != null
                && trip.getEndDate().isBefore(trip.getStartDate())) {
            throw new BadRequestException("End date must not be before start date.");
        }
        if (dto.getBudget() != null) {
            trip.setBudget(dto.getBudget());
        }
        if (dto.getStatus() != null) {
            trip.setStatus(dto.getStatus());
        }

        Trip updatedTrip = tripRepository.save(trip);
        return mapToDTO(updatedTrip);
    }

    @Override
    @Transactional
    public void deleteTrip(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Trip trip = tripRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));

        tripAccessService.validateTripDelete(user, trip);

        tripMembershipRepository.deleteByTripId(trip.getId());
        joinRequestRepository.deleteByTripId(trip.getId());

        tripRepository.delete(trip);
    }

    public TripResponseDTO mapToDTO(Trip trip) {
        if (trip == null) {
            return null;
        }

        Destination destination = trip.getDestination();
        DestinationResponseDTO destinationDTO = destination != null ? DestinationResponseDTO.builder()
                .id(destination.getId())
                .name(destination.getName())
                .country(destination.getCountry())
                .description(destination.getDescription())
                .imageUrl(destination.getImageUrl())
                .category(destination.getCategory())
                .averageCost(destination.getAverageCost())
                .createdAt(destination.getCreatedAt())
                .build() : null;

        User owner = trip.getUser();
        UserDTO userDTO = owner != null ? UserDTO.builder()
                .id(owner.getId())
                .email(owner.getEmail())
                .fullName(owner.getFullName())
                .role(owner.getRole())
                .createdAt(owner.getCreatedAt())
                .build() : null;

        return TripResponseDTO.builder()
                .id(trip.getId())
                .title(trip.getTitle())
                .description(trip.getDescription())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .budget(trip.getBudget())
                .status(trip.getStatus())
                .destination(destinationDTO)
                .user(userDTO)
                .createdAt(trip.getCreatedAt())
                .updatedAt(trip.getUpdatedAt())
                .build();
    }
}

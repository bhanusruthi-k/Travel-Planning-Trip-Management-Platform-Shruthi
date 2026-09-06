package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.itinerary.ActivityRequestDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ActivityResponseDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ItineraryDayRequestDTO;
import com.tripnest.tripnest_backend.dto.itinerary.ItineraryDayResponseDTO;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.*;
import com.tripnest.tripnest_backend.repository.ActivityRepository;
import com.tripnest.tripnest_backend.repository.ItineraryDayRepository;
import com.tripnest.tripnest_backend.repository.TripRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.service.ItineraryService;
import com.tripnest.tripnest_backend.service.TripAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItineraryServiceImpl implements ItineraryService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final ItineraryDayRepository itineraryDayRepository;
    private final ActivityRepository activityRepository;
    private final TripAccessService tripAccessService;

    @Override
    @Transactional
    public ItineraryDayResponseDTO addDay(Long tripId, ItineraryDayRequestDTO dto, String userEmail) {
        User user = getUser(userEmail);
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
        tripAccessService.validateTripAccess(user, trip);

        ItineraryDay day = ItineraryDay.builder()
                .dayNumber(dto.getDayNumber())
                .date(dto.getDate() != null ? dto.getDate() : trip.getStartDate().plusDays(dto.getDayNumber() - 1))
                .title(dto.getTitle() != null ? dto.getTitle() : "Day " + dto.getDayNumber())
                .trip(trip)
                .build();

        ItineraryDay saved = itineraryDayRepository.save(day);
        return mapToDayDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItineraryDayResponseDTO> getItineraryForTrip(Long tripId, String userEmail) {
        User user = getUser(userEmail);
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
        tripAccessService.validateTripAccess(user, trip);

        List<ItineraryDay> days = itineraryDayRepository.findByTripIdWithActivitiesOrderByDayNumberAsc(tripId);
        return days.stream().map(this::mapToDayDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteDay(Long tripId, Long dayId, String userEmail) {
        User user = getUser(userEmail);
        Trip trip = tripRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + tripId));
        tripAccessService.validateTripAccess(user, trip);

        ItineraryDay day = itineraryDayRepository.findByIdAndTripId(dayId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary day not found with id: " + dayId));

        itineraryDayRepository.delete(day);
    }

    @Override
    @Transactional
    public ActivityResponseDTO addActivity(Long dayId, ActivityRequestDTO dto, String userEmail) {
        User user = getUser(userEmail);
        ItineraryDay day = itineraryDayRepository.findById(dayId)
                .orElseThrow(() -> new ResourceNotFoundException("Itinerary day not found with id: " + dayId));
        tripAccessService.validateTripAccess(user, day.getTrip());

        Activity activity = Activity.builder()
                .time(dto.getTime())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .location(dto.getLocation())
                .cost(dto.getCost())
                .itineraryDay(day)
                .build();

        Activity saved = activityRepository.save(activity);
        return mapToActivityDTO(saved);
    }

    @Override
    @Transactional
    public ActivityResponseDTO updateActivity(Long activityId, ActivityRequestDTO dto, String userEmail) {
        User user = getUser(userEmail);
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + activityId));
        tripAccessService.validateTripAccess(user, activity.getItineraryDay().getTrip());

        if (dto.getTitle() != null) activity.setTitle(dto.getTitle());
        if (dto.getTime() != null) activity.setTime(dto.getTime());
        if (dto.getDescription() != null) activity.setDescription(dto.getDescription());
        if (dto.getLocation() != null) activity.setLocation(dto.getLocation());
        if (dto.getCost() != null) activity.setCost(dto.getCost());

        Activity updated = activityRepository.save(activity);
        return mapToActivityDTO(updated);
    }

    @Override
    @Transactional
    public void deleteActivity(Long activityId, String userEmail) {
        User user = getUser(userEmail);
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + activityId));
        tripAccessService.validateTripAccess(user, activity.getItineraryDay().getTrip());

        activityRepository.delete(activity);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public ItineraryDayResponseDTO mapToDayDTO(ItineraryDay day) {
        if (day == null) return null;
        List<ActivityResponseDTO> activityDTOs = day.getActivities() != null
                ? day.getActivities().stream().map(this::mapToActivityDTO).collect(Collectors.toList())
                : List.of();

        return ItineraryDayResponseDTO.builder()
                .id(day.getId())
                .dayNumber(day.getDayNumber())
                .date(day.getDate())
                .title(day.getTitle())
                .tripId(day.getTrip() != null ? day.getTrip().getId() : null)
                .activities(activityDTOs)
                .createdAt(day.getCreatedAt())
                .updatedAt(day.getUpdatedAt())
                .build();
    }

    public ActivityResponseDTO mapToActivityDTO(Activity activity) {
        if (activity == null) return null;
        return ActivityResponseDTO.builder()
                .id(activity.getId())
                .time(activity.getTime())
                .title(activity.getTitle())
                .description(activity.getDescription())
                .location(activity.getLocation())
                .cost(activity.getCost())
                .itineraryDayId(activity.getItineraryDay() != null ? activity.getItineraryDay().getId() : null)
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt())
                .build();
    }
}

package com.tripnest.tripnest_backend.service.impl;

import com.tripnest.tripnest_backend.dto.destination.DestinationRequestDTO;
import com.tripnest.tripnest_backend.dto.destination.DestinationResponseDTO;
import com.tripnest.tripnest_backend.dto.destination.PlaceDTO;
import com.tripnest.tripnest_backend.dto.destination.WeatherResponseDTO;
import com.tripnest.tripnest_backend.exception.ResourceNotFoundException;
import com.tripnest.tripnest_backend.model.Destination;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.service.DestinationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DestinationServiceImpl implements DestinationService {

    private final DestinationRepository destinationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DestinationResponseDTO> getAllDestinations() {
        return destinationRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DestinationResponseDTO> getPopularDestinations() {
        return destinationRepository.findAll().stream()
                .limit(4)
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DestinationResponseDTO getDestinationById(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));
        return mapToDTO(destination);
    }

    @Override
    @Transactional
    public DestinationResponseDTO createDestination(DestinationRequestDTO dto) {
        Destination destination = Destination.builder()
                .name(dto.getName())
                .country(dto.getCountry())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .category(dto.getCategory())
                .averageCost(dto.getAverageCost())
                .build();

        Destination saved = destinationRepository.save(destination);
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public WeatherResponseDTO getDestinationWeather(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));

        String name = destination.getName().toLowerCase();
        double temp;
        String condition;
        int humidity;
        double wind;
        String icon;

        if (name.contains("paris") || name.contains("london")) {
            temp = 19.5;
            condition = "Partly Cloudy";
            humidity = 62;
            wind = 12.0;
            icon = "cloud-sun";
        } else if (name.contains("tokyo") || name.contains("singapore")) {
            temp = 28.0;
            condition = "Warm & Clear";
            humidity = 70;
            wind = 8.5;
            icon = "sun";
        } else if (name.contains("dubai")) {
            temp = 34.2;
            condition = "Sunny & Warm";
            humidity = 45;
            wind = 14.0;
            icon = "sun";
        } else if (name.contains("bali")) {
            temp = 29.0;
            condition = "Tropical Breeze";
            humidity = 78;
            wind = 10.0;
            icon = "cloud-sun";
        } else {
            temp = 22.0;
            condition = "Pleasant & Clear";
            humidity = 55;
            wind = 9.0;
            icon = "sun";
        }

        List<WeatherResponseDTO.ForecastDayDTO> forecast = List.of(
                WeatherResponseDTO.ForecastDayDTO.builder().day("Tomorrow").temp(temp + 1).condition(condition).build(),
                WeatherResponseDTO.ForecastDayDTO.builder().day("Day 2").temp(temp - 1).condition("Mostly Sunny").build(),
                WeatherResponseDTO.ForecastDayDTO.builder().day("Day 3").temp(temp).condition(condition).build()
        );

        return WeatherResponseDTO.builder()
                .destinationName(destination.getName() + ", " + destination.getCountry())
                .temperature(temp)
                .condition(condition)
                .humidity(humidity)
                .windSpeed(wind)
                .icon(icon)
                .forecast(forecast)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlaceDTO> getDestinationPlaces(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination not found with id: " + id));

        String name = destination.getName().toLowerCase();
        List<PlaceDTO> places = new ArrayList<>();

        if (name.contains("paris")) {
            places.add(PlaceDTO.builder()
                    .id("place-1")
                    .name("Eiffel Tower & Champ de Mars")
                    .category("Historic Landmark")
                    .rating(4.8)
                    .reviewCount(142000)
                    .address("Champ de Mars, 5 Av. Anatole France, Paris")
                    .imageUrl("https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=600&q=80")
                    .description("Iconic wrought-iron lattice tower offering panoramic views of Paris.")
                    .build());
            places.add(PlaceDTO.builder()
                    .id("place-2")
                    .name("Louvre Museum")
                    .category("Art & Culture")
                    .rating(4.7)
                    .reviewCount(118000)
                    .address("Rue de Rivoli, 75001 Paris")
                    .imageUrl("https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80")
                    .description("The world's largest art museum and historic monument in Paris.")
                    .build());
            places.add(PlaceDTO.builder()
                    .id("place-3")
                    .name("Montmartre & Sacré-Cœur")
                    .category("Scenic Viewpoint")
                    .rating(4.7)
                    .reviewCount(64000)
                    .address("35 Rue du Chevalier de la Barre, Paris")
                    .imageUrl("https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80")
                    .description("Historic hilltop basilica offering charming bohemian streets and cafe culture.")
                    .build());
        } else if (name.contains("tokyo")) {
            places.add(PlaceDTO.builder()
                    .id("place-4")
                    .name("Senso-ji Temple")
                    .category("Cultural Heritage")
                    .rating(4.7)
                    .reviewCount(85000)
                    .address("2 Chome-3-1 Asakusa, Taito City, Tokyo")
                    .imageUrl("https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80")
                    .description("Tokyo's oldest and most famous Buddhist temple with bustling Nakamise street.")
                    .build());
            places.add(PlaceDTO.builder()
                    .id("place-5")
                    .name("Shibuya Crossing & Hachiko")
                    .category("Urban Landmark")
                    .rating(4.6)
                    .reviewCount(92000)
                    .address("Shibuya City, Tokyo")
                    .imageUrl("https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=600&q=80")
                    .description("World-famous bustling intersection surrounded by neon lights and entertainment.")
                    .build());
        } else {
            places.add(PlaceDTO.builder()
                    .id("place-gen-1")
                    .name(destination.getName() + " Historic Old Town")
                    .category("Cultural Quarter")
                    .rating(4.8)
                    .reviewCount(45000)
                    .address("City Center, " + destination.getCountry())
                    .imageUrl(destination.getImageUrl())
                    .description("Cobblestone streets, local markets, and signature architectural sights.")
                    .build());
            places.add(PlaceDTO.builder()
                    .id("place-gen-2")
                    .name(destination.getName() + " Scenic Waterfront & Gardens")
                    .category("Nature & Leisure")
                    .rating(4.7)
                    .reviewCount(38000)
                    .address("Waterfront Promenade, " + destination.getCountry())
                    .imageUrl(destination.getImageUrl())
                    .description("Tranquil promenade featuring panoramic viewpoints and authentic dining.")
                    .build());
        }

        return places;
    }

    public DestinationResponseDTO mapToDTO(Destination destination) {
        if (destination == null) {
            return null;
        }
        return DestinationResponseDTO.builder()
                .id(destination.getId())
                .name(destination.getName())
                .country(destination.getCountry())
                .description(destination.getDescription())
                .imageUrl(destination.getImageUrl())
                .category(destination.getCategory())
                .averageCost(destination.getAverageCost())
                .createdAt(destination.getCreatedAt())
                .build();
    }
}

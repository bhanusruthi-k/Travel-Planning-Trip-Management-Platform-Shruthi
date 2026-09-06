package com.tripnest.tripnest_backend.config;

import com.tripnest.tripnest_backend.model.Destination;
import com.tripnest.tripnest_backend.model.Role;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DestinationRepository destinationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedDestinations();
        seedDefaultUsers();
    }

    private void seedDestinations() {
        if (destinationRepository.count() == 0) {
            log.info("Seeding initial TripNest destinations...");
            List<Destination> destinations = List.of(
                    Destination.builder()
                            .name("Paris")
                            .country("France")
                            .category("Culture & Romance")
                            .description("The City of Light dazzles with iconic landmarks like the Eiffel Tower, world-class art at the Louvre, and charming Parisian bistros.")
                            .imageUrl("https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80")
                            .averageCost(2200.0)
                            .build(),
                    Destination.builder()
                            .name("Tokyo")
                            .country("Japan")
                            .category("Adventure & Culture")
                            .description("A vibrant metropolis blending futuristic technology, historic temples, bustling neon markets, and world-class gastronomy.")
                            .imageUrl("https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80")
                            .averageCost(2600.0)
                            .build(),
                    Destination.builder()
                            .name("Dubai")
                            .country("United Arab Emirates")
                            .category("Luxury & Architecture")
                            .description("An oasis of ultra-modern architectural feats including the Burj Khalifa, luxurious desert safaris, and premier shopping destinations.")
                            .imageUrl("https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80")
                            .averageCost(2500.0)
                            .build(),
                    Destination.builder()
                            .name("London")
                            .country("United Kingdom")
                            .category("Heritage & City")
                            .description("Rich in history and dynamic culture, boasting royal palaces, the Thames riverfront, iconic museums, and West End theatres.")
                            .imageUrl("https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80")
                            .averageCost(2400.0)
                            .build(),
                    Destination.builder()
                            .name("Singapore")
                            .country("Singapore")
                            .category("Modern City & Gardens")
                            .description("A futuristic garden city celebrated for Gardens by the Bay, Marina Bay Sands skyline, and legendary hawker street food.")
                            .imageUrl("https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80")
                            .averageCost(2100.0)
                            .build(),
                    Destination.builder()
                            .name("New York")
                            .country("United States")
                            .category("Urban & Entertainment")
                            .description("The city that never sleeps, featuring Broadway shows, Central Park strolls, world-class dining, and majestic skyscraper views.")
                            .imageUrl("https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80")
                            .averageCost(2900.0)
                            .build(),
                    Destination.builder()
                            .name("Bali")
                            .country("Indonesia")
                            .category("Beach & Wellness")
                            .description("Tropical paradise featuring lush emerald rice terraces, sacred volcanic temples, world-class surf breaks, and tranquil retreats.")
                            .imageUrl("https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80")
                            .averageCost(1500.0)
                            .build()
            );
            destinationRepository.saveAll(destinations);
            log.info("Successfully seeded {} destinations.", destinations.size());
        }
    }

    private void seedDefaultUsers() {
        if (!userRepository.existsByEmail("admin@tripnest.com")) {
            User admin = User.builder()
                    .email("admin@tripnest.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .fullName("TripNest Administrator")
                    .role(Role.ADMINISTRATOR)
                    .build();
            userRepository.save(admin);
            log.info("Default administrator account created: admin@tripnest.com");
        }

        if (!userRepository.existsByEmail("traveler@tripnest.com")) {
            User traveler = User.builder()
                    .email("traveler@tripnest.com")
                    .password(passwordEncoder.encode("Traveler@123"))
                    .fullName("Alex Traveler")
                    .role(Role.TRAVELER)
                    .build();
            userRepository.save(traveler);
            log.info("Default traveler account created: traveler@tripnest.com");
        }
    }
}

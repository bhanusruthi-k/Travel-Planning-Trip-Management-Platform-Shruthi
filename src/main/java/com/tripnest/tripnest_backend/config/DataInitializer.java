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
        if (destinationRepository.count() <= 7) {
            log.info("Seeding comprehensive TripNest global destinations collection...");
            destinationRepository.deleteAll(); // Refresh with comprehensive collection

            List<Destination> destinations = List.of(
                    Destination.builder()
                            .name("Manhattan, New York")
                            .country("USA")
                            .category("Urban & Skylines")
                            .description("A bewildering place with unmatched energy! Famous for iconic skyscraper skylines, Broadway theatre, Central Park, and thrilling helicopter tours over the borough.")
                            .imageUrl("https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2800.0)
                            .build(),
                    Destination.builder()
                            .name("Dubai")
                            .country("UAE")
                            .category("Luxury & Modern Marvels")
                            .description("Home of architectural superlatives. Getting to the top of Burj Khalifa is a must, alongside exploring Dubai Marina, desert dune safaris, and underwater aquariums.")
                            .imageUrl("https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2500.0)
                            .build(),
                    Destination.builder()
                            .name("Tokyo")
                            .country("Japan")
                            .category("Culture & Megacity")
                            .description("Another world in all dimensions, especially when the cherry blossoms are in bloom. Blends ancient temples with neon-lit Shibuya crossings and world-class dining.")
                            .imageUrl("https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2600.0)
                            .build(),
                    Destination.builder()
                            .name("Paris")
                            .country("France")
                            .category("Culture & Romance")
                            .description("The quintessential romantic city. Key highlights include the Eiffel Tower, Notre Dame, the Louvre Museum, charming Montmartre bistros, and Seine river cruises.")
                            .imageUrl("https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2200.0)
                            .build(),
                    Destination.builder()
                            .name("Singapore")
                            .country("Singapore")
                            .category("Garden City & Gastronomy")
                            .description("A futuristic island metropolis celebrated for Gardens by the Bay, Marina Bay Sands, world-renowned seafood restaurants, and lush botanical garden canopies.")
                            .imageUrl("https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2100.0)
                            .build(),
                    Destination.builder()
                            .name("London")
                            .country("United Kingdom")
                            .category("Heritage & City")
                            .description("When a man is tired of London, he is tired of life. Packed with royal landmarks, Big Ben, the London Eye, West End theatres, and charming historic pubs.")
                            .imageUrl("https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2400.0)
                            .build(),
                    Destination.builder()
                            .name("Rome")
                            .country("Italy")
                            .category("Ancient History")
                            .description("The Eternal City. Must-haves: good walking shoes and curiosity to explore the Colosseum, Roman Forum, Trevi Fountain, Vatican City, and Trastevere trattorias.")
                            .imageUrl("https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(1900.0)
                            .build(),
                    Destination.builder()
                            .name("Barcelona")
                            .country("Spain")
                            .category("Art & Coastal Life")
                            .description("Gaudí's architectural wonders, vibrant La Rambla, Mediterranean beaches, and a care-free Catalonian atmosphere with nearby Costa Brava coastal drives.")
                            .imageUrl("https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(1800.0)
                            .build(),
                    Destination.builder()
                            .name("Sydney")
                            .country("Australia")
                            .category("Harbor & Coastal")
                            .description("Stunning natural harbor, the iconic Opera House, Bondi Beach surfing, and breathtaking day excursions into the Blue Mountains National Park.")
                            .imageUrl("https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2700.0)
                            .build(),
                    Destination.builder()
                            .name("Kyoto")
                            .country("Japan")
                            .category("Temples & Traditions")
                            .description("The former imperial capital of Japan, filled with thousands of classical Buddhist temples, Zen rock gardens, torii gates at Fushimi Inari, and bamboo groves.")
                            .imageUrl("https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2200.0)
                            .build(),
                    Destination.builder()
                            .name("Grand Canyon, Arizona")
                            .country("USA")
                            .category("Natural Wonders")
                            .description("One of the world's greatest geologic spectacles. Marvel at the immense crimson gorges, helicopter tours over the South Rim, and the glass Skywalk.")
                            .imageUrl("https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(1600.0)
                            .build(),
                    Destination.builder()
                            .name("Machu Picchu")
                            .country("Peru")
                            .category("Ancient Ruins")
                            .description("The legendary Lost City of the Incas, perched high in the cloud forests of the Andes. A breathtaking testament to ancient architecture and mountain spirituality.")
                            .imageUrl("https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2000.0)
                            .build(),
                    Destination.builder()
                            .name("Santorini")
                            .country("Greece")
                            .category("Islands & Volcanoes")
                            .description("Mediterranean volcanic paradise famous for whitewashed cliffside villages, blue-domed churches, dramatic caldera vistas, and world-class sunsets in Oia.")
                            .imageUrl("https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2300.0)
                            .build(),
                    Destination.builder()
                            .name("Iceland")
                            .country("Iceland")
                            .category("Glaciers & Volcanism")
                            .description("Land of fire and ice, featuring active volcanoes, cascading waterfalls, geothermal hot springs like the Blue Lagoon, and dancing Northern Lights.")
                            .imageUrl("https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(2800.0)
                            .build(),
                    Destination.builder()
                            .name("Taj Mahal, Agra")
                            .country("India")
                            .category("Monuments & Wonder")
                            .description("An ivory-white marble mausoleum on the Yamuna riverbank, universally admired as one of the world's greatest architectural masterpieces of eternal love.")
                            .imageUrl("https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(1200.0)
                            .build(),
                    Destination.builder()
                            .name("Bali")
                            .country("Indonesia")
                            .category("Beach & Wellness")
                            .description("Tropical haven featuring emerald Tegallalang rice terraces, Uluwatu cliff temples, vibrant coral reefs, and tranquil spiritual retreats in Ubud.")
                            .imageUrl("https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(1500.0)
                            .build(),
                    Destination.builder()
                            .name("Hawaii")
                            .country("USA")
                            .category("Island Paradise")
                            .description("Polynesian volcanic archipelago offering dramatic coastal cliffs, active lava flows at Kilauea, legendary surf breaks, and lush rainforest waterfalls.")
                            .imageUrl("https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(3100.0)
                            .build(),
                    Destination.builder()
                            .name("Cape Town")
                            .country("South Africa")
                            .category("Mountains & Coast")
                            .description("Set against the majestic Table Mountain, featuring dramatic coastal peninsulas, the Cape of Good Hope, penguin colonies, and world-renowned vineyards.")
                            .imageUrl("https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1400&q=85")
                            .averageCost(1900.0)
                            .build()
            );
            destinationRepository.saveAll(destinations);
            log.info("Successfully seeded {} curated global destinations.", destinations.size());
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

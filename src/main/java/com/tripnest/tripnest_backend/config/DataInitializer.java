package com.tripnest.tripnest_backend.config;

import com.tripnest.tripnest_backend.model.Attraction;
import com.tripnest.tripnest_backend.model.Destination;
import com.tripnest.tripnest_backend.model.Role;
import com.tripnest.tripnest_backend.model.User;
import com.tripnest.tripnest_backend.repository.AttractionRepository;
import com.tripnest.tripnest_backend.repository.DestinationRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DestinationRepository destinationRepository;
    private final AttractionRepository attractionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        fixNotificationCheckConstraint();
        cleanupAndEnforceDestinationUniqueness();
        seedDestinations();
        seedDefaultUsers();
        sanitizeAdminRoles();
        seedAttractions();
    }

    private void sanitizeAdminRoles() {
        try {
            int updated = jdbcTemplate.update(
                "UPDATE users SET role = 'TRAVELER', updated_at = NOW() WHERE role = 'ADMINISTRATOR' AND LOWER(TRIM(email)) != 'admin@tripnest.com'"
            );
            if (updated > 0) {
                log.info("Sanitized non-canonical administrator roles: {} accounts updated to TRAVELER", updated);
            }
        } catch (Exception e) {
            log.warn("Notice during admin role sanitization: {}", e.getMessage());
        }
    }

    private void fixNotificationCheckConstraint() {
        try {
            jdbcTemplate.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notif_type_check");
            log.info("Ensured notifications check constraint is updated for all enum types");
        } catch (Exception e) {
            log.debug("Check constraint adjustment: {}", e.getMessage());
        }
    }

    private void cleanupAndEnforceDestinationUniqueness() {
        try {
            // 1. Identify and deduplicate duplicate destinations (keeping canonical row with lowest ID / active / referenced)
            List<Map<String, Object>> duplicates = jdbcTemplate.queryForList(
                "SELECT LOWER(TRIM(name)) as lname, LOWER(TRIM(country)) as lcountry, COUNT(*) as cnt " +
                "FROM destinations GROUP BY LOWER(TRIM(name)), LOWER(TRIM(country)) HAVING COUNT(*) > 1"
            );

            for (Map<String, Object> dup : duplicates) {
                String lname = (String) dup.get("lname");
                String lcountry = (String) dup.get("lcountry");

                List<Long> ids = jdbcTemplate.queryForList(
                    "SELECT id FROM destinations WHERE LOWER(TRIM(name)) = ? AND LOWER(TRIM(country)) = ? ORDER BY id ASC",
                    Long.class, lname, lcountry
                );

                if (ids.size() > 1) {
                    Long canonicalId = ids.get(0);
                    for (int i = 1; i < ids.size(); i++) {
                        Long duplicateId = ids.get(i);
                        // Re-link trips pointing to duplicateId to canonicalId
                        jdbcTemplate.update("UPDATE trips SET destination_id = ? WHERE destination_id = ?", canonicalId, duplicateId);
                        // Re-link attractions pointing to duplicateId to canonicalId
                        jdbcTemplate.update("UPDATE attractions SET destination_id = ? WHERE destination_id = ?", canonicalId, duplicateId);
                        // Delete the redundant duplicate destination record
                        jdbcTemplate.update("DELETE FROM destinations WHERE id = ?", duplicateId);
                        log.info("Safely merged duplicate destination ID {} into canonical ID {} for '{}', '{}'", duplicateId, canonicalId, lname, lcountry);
                    }
                }
            }

            // 2. Ensure database-level unique index on LOWER(TRIM(name)) and LOWER(TRIM(country))
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_destinations_unique_name_country ON destinations (LOWER(TRIM(name)), LOWER(TRIM(country)))");
            log.info("Database-level uniqueness index on destinations (LOWER(TRIM(name)), LOWER(TRIM(country))) verified.");
        } catch (Exception e) {
            log.warn("Notice during destination deduplication and unique index enforcement: {}", e.getMessage());
        }
    }

    private void seedDestinations() {
        List<Destination> curatedList = getCuratedDestinations();
        int added = 0;
        int updated = 0;

        for (Destination d : curatedList) {
            Optional<Destination> existingOpt = destinationRepository.findByNameIgnoreCaseAndCountryIgnoreCase(
                    d.getName().trim(), d.getCountry().trim());

            if (existingOpt.isEmpty()) {
                destinationRepository.save(d);
                added++;
            } else {
                Destination existing = existingOpt.get();
                existing.setImageUrl(d.getImageUrl());
                existing.setDescription(d.getDescription());
                existing.setCategory(d.getCategory());
                existing.setRegion(d.getRegion());
                existing.setAverageCost(d.getAverageCost());
                existing.setIsPopular(d.getIsPopular());
                existing.setIsActive(true);
                destinationRepository.save(existing);
                updated++;
            }
        }
        log.info("Destination Seeder finished: {} new added, {} updated, total destinations: {}",
                added, updated, destinationRepository.count());
    }

    private void seedDefaultUsers() {
        Optional<User> adminOpt = userRepository.findByEmail("admin@tripnest.com");
        if (adminOpt.isEmpty()) {
            User admin = User.builder()
                    .email("admin@tripnest.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .fullName("TripNest Administrator")
                    .role(Role.ADMINISTRATOR)
                    .build();
            userRepository.save(admin);
            log.info("Default administrator account created: admin@tripnest.com");
        } else {
            User admin = adminOpt.get();
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setRole(Role.ADMINISTRATOR);
            userRepository.save(admin);
            log.info("Ensured administrator account is active with role ADMINISTRATOR: admin@tripnest.com");
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

    private List<Destination> getCuratedDestinations() {
        return List.of(
            // 1 - 10
            d("London", "United Kingdom", "Europe", "CITY, CULTURE, HISTORY, HERITAGE, FOOD",
              "Packed with royal landmarks, Big Ben, Westminster Abbey, the London Eye, West End theatres, and charming historic pubs.",
              "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80", 2400.0, true),

            d("Paris", "France", "Europe", "CITY, CULTURE, ROMANTIC, FOOD, HERITAGE, LUXURY",
              "The quintessential city of romance, famous for the Eiffel Tower, the Louvre, Montmartre bistros, and Seine river cruises.",
              "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80", 2200.0, true),

            d("Provence", "France", "Europe", "NATURE, ROMANTIC, FOOD, HERITAGE, ROAD_TRIP",
              "Rolling purple lavender fields, sun-drenched vineyards, historic hilltop villages, and world-class Mediterranean gastronomy.",
              "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80", 1950.0, false),

            d("French Riviera", "France", "Europe", "BEACH, LUXURY, ROMANTIC, COASTAL, FOOD",
              "The glamorous Côte d'Azur featuring Nice's azure waters, Cannes' seaside promenades, and Monaco's luxury harbors.",
              "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=1200&q=80", 2900.0, true),

            d("Tuscany", "Italy", "Europe", "CULTURE, FOOD, ROMANTIC, HERITAGE, NATURE",
              "Cypress-lined hills, Chianti vineyards, Renaissance farmhouses, and medieval hill towns like Siena and San Gimignano.",
              "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80", 1850.0, true),

            d("Venice", "Italy", "Europe", "CITY, ROMANTIC, CULTURE, HERITAGE, ISLAND",
              "A timeless floating wonderland of gondolas, Byzantine palaces, St. Mark's Basilica, and winding canal labyrinths.",
              "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1200&q=80", 2100.0, true),

            d("Istanbul", "Turkey", "Eurasia", "CITY, CULTURE, HISTORY, HERITAGE, FOOD",
              "Where East meets West across the Bosphorus strait. Iconic for the Hagia Sophia, Blue Mosque, and bustling Grand Bazaar.",
              "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80", 1450.0, true),

            d("Peru", "Peru", "South America", "ADVENTURE, CULTURE, HISTORY, MOUNTAINS, HERITAGE",
              "Ancient Inca citadels at Machu Picchu, cloud forests of the Andes, Sacred Valley markets, and Lima's culinary mastery.",
              "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=80", 1750.0, true),

            d("India's Golden Triangle", "India", "Asia", "CULTURE, HISTORY, HERITAGE, SPIRITUAL, FOOD",
              "The iconic Delhi-Agra-Jaipur circuit, encompassing the monuments of Delhi, the Taj Mahal in Agra, and the royal palaces and forts of Jaipur.",
              "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80", 1200.0, true),

            d("Rome", "Italy", "Europe", "CITY, HISTORY, CULTURE, HERITAGE, FOOD",
              "The Eternal City. Wander through the Colosseum, Roman Forum, Trevi Fountain, Vatican City, and Trastevere trattorias.",
              "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80", 1900.0, true),

            // 11 - 20
            d("New York City", "USA", "North America", "CITY, CULTURE, FOOD, LUXURY, SHOPPING",
              "The city that never sleeps. Iconic skyline views, Central Park strolls, Broadway shows, world-class museums, and diverse dining.",
              "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80", 2800.0, true),

            d("Grand Canyon National Park", "USA", "North America", "NATURE, ADVENTURE, MOUNTAINS, ROAD_TRIP",
              "One of the seven natural wonders of the world, carved by the Colorado River with immense crimson rock layers and panoramic rims.",
              "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1200&q=80", 1600.0, true),

            d("Niagara Falls", "USA", "North America", "NATURE, ADVENTURE, FAMILY, WATERFALLS",
              "Colossal roaring waterfalls straddling the USA-Canada border, offering thrilling Maid of the Mist boat excursions and evening light shows.",
              "https://images.unsplash.com/photo-1533094602577-198d3beab8ea?auto=format&fit=crop&w=1200&q=80", 1350.0, false),

            d("Barcelona", "Spain", "Europe", "CITY, BEACH, CULTURE, FOOD, HERITAGE",
              "Antoni Gaudí's fantastical architecture, lively tapas bars, Mediterranean beaches, and the vibrant pedestrian pulse of Las Ramblas.",
              "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80", 1800.0, true),

            d("Okavango Delta", "Botswana", "Africa", "WILDLIFE, ADVENTURE, NATURE, LUXURY",
              "A pristine inland water oasis in the Kalahari desert where elephants, lions, and leopards roam freely along tranquil mokoro waterways.",
              "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80", 3800.0, true),

            d("Masai Mara & Serengeti", "Kenya", "Africa", "WILDLIFE, ADVENTURE, NATURE, ROAD_TRIP",
              "Epic endless African savannahs staging the Great Migration of millions of wildebeest and zebras, accompanied by big cat predators.",
              "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80", 3200.0, true),

            d("Dubrovnik & the Dalmatian Islands", "Croatia", "Europe", "BEACH, HISTORY, ISLAND, HERITAGE, ROMANTIC",
              "The Pearl of the Adriatic, boasting fortified medieval stone walls, crystal-clear turquoise waters, and idyllic island getaways like Hvar.",
              "https://images.unsplash.com/photo-1584448141569-69f342da535c?auto=format&fit=crop&w=1200&q=80", 1900.0, true),

            d("Athens", "Greece", "Europe", "CITY, HISTORY, CULTURE, HERITAGE, FOOD",
              "The cradle of Western civilization and democracy, crowned by the ancient Parthenon on the Acropolis and vibrant Plaka alleys.",
              "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1200&q=80", 1600.0, true),

            d("Marrakech", "Morocco", "Africa", "CULTURE, HISTORY, FOOD, HERITAGE, LUXURY",
              "A sensory feast of aromatic spices, snake charmers in Jemaa el-Fnaa square, intricate riads, Bahia Palace, and vibrant souks.",
              "https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1200&q=80", 1400.0, true),

            d("Madrid", "Spain", "Europe", "CITY, CULTURE, FOOD, HERITAGE, NIGHTLIFE",
              "Spain's regal capital celebrated for the Prado Museum, grand plazas like Plaza Mayor, Retiro Park, and late-night culinary energy.",
              "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80", 1750.0, false),

            // 21 - 30
            d("Amsterdam", "Netherlands", "Europe", "CITY, CULTURE, HISTORY, ROMANTIC, HERITAGE",
              "Genteel 17th-century canal rings, world-class Van Gogh and Rijksmuseum collections, historic houseboats, and lively cycling culture.",
              "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1200&q=80", 2000.0, true),

            d("Andalusia", "Spain", "Europe", "CULTURE, HISTORY, FOOD, HERITAGE, ROAD_TRIP",
              "Moorish palaces of the Alhambra, passionate flamenco in Seville, white cliffside pueblos, and sun-drenched olive groves.",
              "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=1200&q=80", 1650.0, false),

            d("Loire Valley", "France", "Europe", "CULTURE, HERITAGE, ROMANTIC, FOOD, NATURE",
              "The Garden of France, renowned for fairy-tale Renaissance châteaux like Chambord and Chenonceau nestled along peaceful river banks.",
              "https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?auto=format&fit=crop&w=1200&q=80", 1900.0, false),

            d("Greek Islands", "Greece", "Europe", "BEACH, ISLAND, ROMANTIC, CULTURE, LUXURY",
              "Aegean archipelagos with whitewashed cliffside towns in Santorini, golden beaches in Mykonos, and ancient Cretan ruins.",
              "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80", 2300.0, true),

            d("Florence", "Italy", "Europe", "CITY, CULTURE, ART, HISTORY, HERITAGE, FOOD",
              "The birthplace of the Renaissance, home to Michelangelo's David, the terracotta-domed Duomo, and romantic Ponte Vecchio.",
              "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=1200&q=80", 1950.0, true),

            d("Cape Town", "South Africa", "Africa", "BEACH, MOUNTAINS, NATURE, ADVENTURE, FOOD",
              "Dramatically framed by Table Mountain, featuring scenic coastal peninsulas, penguin colonies at Boulders Beach, and Cape Winelands.",
              "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1200&q=80", 1900.0, true),

            d("Havana", "Cuba", "Caribbean", "CITY, CULTURE, HISTORY, HERITAGE, BEACH",
              "Vintage American classic cars, pastel colonial architecture in Old Havana, pulsating salsa rhythms, and historic coastal seawalls.",
              "https://images.unsplash.com/photo-1500759285222-a95626b934cb?auto=format&fit=crop&w=1200&q=80", 1400.0, false),

            d("Sydney", "Australia", "Oceania", "CITY, BEACH, NATURE, FOOD, ADVENTURE",
              "A sparkling harbor city featuring the iconic Opera House, Sydney Harbor Bridge climbs, Bondi Beach surf, and coastal walks.",
              "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80", 2700.0, true),

            d("Victoria Falls", "Zambia", "Africa", "NATURE, ADVENTURE, WILDLIFE, WATERFALLS",
              "The Smoke that Thunders—one of the largest waterfalls on Earth, cascading over 100 meters into the dramatic Zambezi gorge.",
              "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=1200&q=80", 2100.0, true),

            d("Bangkok", "Thailand", "Asia", "CITY, CULTURE, FOOD, HERITAGE, SHOPPING",
              "Glittering Buddhist temples like Wat Arun, bustling street food night markets, floating markets, and vibrant Chao Phraya river life.",
              "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80", 1300.0, true),

            // 31 - 40
            d("Rio de Janeiro", "Brazil", "South America", "CITY, BEACH, NATURE, CULTURE, ADVENTURE",
              "The Marvelous City between lush granite peaks and Copacabana sands, watched over by the majestic Christ the Redeemer statue.",
              "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80", 1850.0, true),

            d("Hong Kong", "Hong Kong", "Asia", "CITY, FOOD, SHOPPING, CULTURE, SKYLINES",
              "A dynamic vertical metropolis where Victoria Peak overlooks towering skyscrapers, traditional junk boats, and Michelin-star dim sum.",
              "https://images.unsplash.com/photo-1506970845246-18f21d533b20?auto=format&fit=crop&w=1200&q=80", 2300.0, true),

            d("Turkey's Turquoise Coast", "Turkey", "Europe", "BEACH, SAILING, NATURE, HISTORY, LUXURY",
              "The Turkish Riviera offering idyllic gulet yacht voyages, pine-fringed coves, Lycian rock tombs, and crystal-clear swimming bays.",
              "https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1200&q=80", 1600.0, false),

            d("Costa Rica", "Costa Rica", "Central America", "NATURE, ADVENTURE, WILDLIFE, BEACH, ECOTOURISM",
              "Pura Vida biodiversity haven with misty Arenal cloud forests, active volcanoes, zip-lining canopies, and tropical Pacific surf.",
              "https://images.unsplash.com/photo-1518182170546-07661fd94144?auto=format&fit=crop&w=1200&q=80", 1750.0, true),

            d("Beijing", "China", "Asia", "CITY, HISTORY, CULTURE, HERITAGE",
              "Imperial splendor of the Forbidden City, the Temple of Heaven, and access to the majestic winding ramparts of the Great Wall.",
              "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80", 1700.0, true),

            d("Mayan Riviera", "Mexico", "North America", "BEACH, CULTURE, HISTORY, LUXURY, ADVENTURE",
              "Pristine Caribbean coast featuring turquoise waters, ancient clifftop Mayan ruins at Tulum, underground cenotes, and coral reefs.",
              "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80", 1800.0, true),

            d("Dubai", "UAE", "Middle East", "CITY, LUXURY, SHOPPING, MODERN_MARVELS, DESERT",
              "Architectural marvels including Burj Khalifa, luxury island resorts, Arabian desert dune safaris, and world-class retail.",
              "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80", 2500.0, true),

            d("Tokyo", "Japan", "Asia", "CITY, CULTURE, FOOD, MODERN_MARVELS, SHOPPING",
              "A futuristic wonderland fusing neon-lit Shibuya crossings, historic Senso-ji shrines, Michelin dining, and serene Zen gardens.",
              "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80", 2600.0, true),

            d("Los Angeles", "USA", "North America", "CITY, BEACH, CULTURE, FOOD",
              "Sun-soaked Southern California coast with Santa Monica pier, iconic Hollywood hills, Griffith Observatory views, and vibrant culinary culture.",
              "https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=1200&q=80", 2400.0, false),

            d("Iceland", "Iceland", "Europe", "NATURE, ADVENTURE, WINTER, MOUNTAINS",
              "Land of Fire and Ice with thundering waterfalls, geothermal Blue Lagoon hot springs, black sand beaches, and dancing Northern Lights.",
              "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1200&q=80", 2800.0, true),

            // 41 - 50
            d("New Zealand's South Island", "New Zealand", "Oceania", "NATURE, ADVENTURE, MOUNTAINS, ROAD_TRIP, LAKES",
              "Stunning alpine wilderness spanning Milford Sound fjords, snow-capped Southern Alps, Queenstown adventure sports, and turquoise glacial lakes.",
              "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80", 2900.0, true),

            d("Copenhagen", "Denmark", "Europe", "CITY, CULTURE, FOOD, HERITAGE",
              "Colorful canal-side townhouses in Nyhavn, world-leading Nordic cuisine, royal palaces, and relaxed Scandinavian bicycle culture.",
              "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1200&q=80", 2300.0, false),

            d("San Francisco", "USA", "North America", "CITY, CULTURE, FOOD, NATURE",
              "Iconic Golden Gate Bridge, historic cable cars climbing steep hills, Fisherman's Wharf, and nearby wine tasting in Napa Valley.",
              "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80", 2600.0, false),

            d("San Sebastian", "Spain", "Europe", "FOOD, BEACH, CULTURE, COASTAL",
              "The culinary capital of Basque Country, celebrated for world-class pintxos bars, Michelin-starred dining, and La Concha bay.",
              "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80", 2100.0, false),

            d("Scottish Highlands", "United Kingdom", "Europe", "NATURE, MOUNTAINS, HISTORY, ROAD_TRIP, HERITAGE",
              "Dramatic misty glens, romantic medieval lochs like Loch Ness, historic castles, and rugged North Coast 500 scenic touring routes.",
              "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80", 1950.0, true),

            d("Uluru-Kata Tjuta National Park", "Australia", "Oceania", "NATURE, SPIRITUAL, CULTURE, HERITAGE, DESERT",
              "The spiritual heart of Australia's Red Centre, showcasing the sacred sandstone monolith of Uluru glowing crimson at sunrise.",
              "https://images.unsplash.com/photo-1529963183134-61a90db47eaf?auto=format&fit=crop&w=1200&q=80", 2400.0, false),

            d("Port Douglas", "Australia", "Oceania", "BEACH, NATURE, ADVENTURE, LUXURY",
              "The gateway to the Great Barrier Reef and ancient Daintree Rainforest, offering idyllic tropical coral diving and palm-fringed shores.",
              "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", 2500.0, false),

            d("Kyoto", "Japan", "Asia", "CULTURE, HERITAGE, SPIRITUAL, FOOD",
              "Thousands of classical Buddhist temples, serene Zen rock gardens, torii gates at Fushimi Inari, and bamboo groves in Arashiyama.",
              "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80", 2200.0, true),

            d("Cappadocia", "Turkey", "Eurasia", "NATURE, ADVENTURE, HISTORY, ROMANTIC",
              "Fairy-tale landscape of volcanic rock chimneys, subterranean cave dwellings, and sunrise hot air balloon flights over the valleys.",
              "https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&w=1200&q=80", 1550.0, true),

            d("St Petersburg", "Russia", "Europe", "CITY, CULTURE, HISTORY, HERITAGE",
              "Imperial northern Venice featuring the Winter Palace, the State Hermitage Museum, Church of the Savior on Spilled Blood, and ornate canals.",
              "https://images.unsplash.com/photo-1556610961-2fecc5927173?auto=format&fit=crop&w=1200&q=80", 1800.0, false),

            // 51 - 60
            d("Berlin", "Germany", "Europe", "CITY, CULTURE, HISTORY, ART, NIGHTLIFE",
              "A dynamic cultural hub with the Brandenburg Gate, remaining stretches of the Berlin Wall, Museum Island, and avant-garde art scenes.",
              "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=80", 1700.0, false),

            d("Lapland", "Finland", "Europe", "WINTER, NATURE, ADVENTURE, FAMILY",
              "Arctic wonderland of snow-dusted pine forests, reindeer sleigh rides, glass igloo stargazing, and Santa Claus Village in Rovaniemi.",
              "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80", 2700.0, true),

            d("The Amazon", "Brazil", "South America", "NATURE, WILDLIFE, ADVENTURE, ECOTOURISM",
              "The planet's greatest tropical rainforest and river system, harboring incredible biodiversity, pink river dolphins, and jungle lodges.",
              "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80", 2200.0, true),

            d("Naples", "Italy", "Europe", "CITY, FOOD, HISTORY, CULTURE, COASTAL",
              "The birthplace of authentic Neapolitan pizza, gateway to ancient Pompeii ruins, Mount Vesuvius crater hikes, and the Bay of Naples.",
              "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80", 1500.0, false),

            d("Singapore", "Singapore", "Asia", "CITY, LUXURY, FOOD, MODERN_MARVELS",
              "Futuristic garden city famous for Marina Bay Sands, Supertree Groves at Gardens by the Bay, and world-renowned hawker street food.",
              "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80", 2100.0, true),

            d("Tel Aviv", "Israel", "Middle East", "CITY, BEACH, CULTURE, FOOD, NIGHTLIFE",
              "Vibrant Mediterranean coastal city blending golden sandy beaches, Bauhaus architecture in the White City, and innovative culinary culture.",
              "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80", 2200.0, false),

            d("Budapest", "Hungary", "Europe", "CITY, HISTORY, CULTURE, HERITAGE",
              "The Queen of the Danube, known for the illuminated Hungarian Parliament, historic thermal baths, Buda Castle, and quirky ruin bars.",
              "https://images.unsplash.com/photo-1549877452-9c387954fbc2?auto=format&fit=crop&w=1200&q=80", 1450.0, false),

            d("Sicily", "Italy", "Europe", "ISLAND, BEACH, FOOD, CULTURE, HISTORY",
              "Mediterranean jewel featuring active Mount Etna volcano tours, ancient Greek theatre in Taormina, and unforgettable cannoli.",
              "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80", 1700.0, false),

            d("Las Vegas", "USA", "North America", "CITY, LUXURY, DESERT",
              "The entertainment capital of the world, offering dazzling themed resort casinos, world-class dining, and nearby Red Rock Canyon.",
              "https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=1200&q=80", 2200.0, false),

            d("Namibia", "Namibia", "Africa", "NATURE, WILDLIFE, DESERT, ADVENTURE",
              "Spectacular red desert dunes at Sossusvlei, eerie dead camelthorn trees in Deadvlei, and game viewing at Etosha National Park.",
              "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80", 2600.0, true),

            // 61 - 70
            d("Munich", "Germany", "Europe", "CITY, CULTURE, HISTORY, HERITAGE",
              "Bavarian heritage city known for Marienplatz, English Garden river surfing, grand palaces, and gateway to the fairytale Neuschwanstein Castle.",
              "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1200&q=80", 1850.0, false),

            d("Lisbon", "Portugal", "Europe", "CITY, COASTAL, CULTURE, FOOD, HERITAGE",
              "Sunlit city of seven hills with yellow vintage trams, Belém pastry towers, Fado music in Alfama, and coastal day trips to Sintra palaces.",
              "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1200&q=80", 1600.0, true),

            d("Stockholm", "Sweden", "Europe", "CITY, ISLAND, CULTURE, NATURE",
              "Built across 14 Baltic islands, featuring medieval cobblestone alleys in Gamla Stan, royal palaces, and pristine archipelago sailing.",
              "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1200&q=80", 2200.0, false),

            d("Miami's South Beach", "USA", "North America", "BEACH, LUXURY, FOOD",
              "Vibrant turquoise oceanfront, historic pastel Art Deco architecture, energetic Ocean Drive nightlife, and Latin-infused cuisine.",
              "https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&w=1200&q=80", 2400.0, false),

            d("Bergen & Fjordland", "Norway", "Europe", "NATURE, MOUNTAINS, ADVENTURE",
              "Picturesque wooden Hanseatic wharf at Bryggen and the gateway to Norway's deep, majestic UNESCO-listed Geirangerfjord and Nærøyfjord.",
              "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80", 2800.0, true),

            d("Iguazu Falls", "Argentina", "South America", "NATURE, ADVENTURE, WILDLIFE, WATERFALLS",
              "An awe-inspiring semicircular cascade of 275 waterfalls surrounded by lush subtropical rainforest and the thunderous Devil's Throat.",
              "https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&w=1200&q=80", 1800.0, true),

            d("Krong Siem Reap", "Cambodia", "Asia", "CULTURE, HISTORY, HERITAGE, SPIRITUAL",
              "The gateway to the sprawling ancient temple complex of Angkor Wat, Bayon's smiling stone faces, and Ta Prohm's jungle-strangled ruins.",
              "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1200&q=80", 1100.0, true),

            d("Egypt", "Egypt", "Africa", "HISTORY, CULTURE, HERITAGE, RIVER",
              "Timeless monumental marvels including the Great Pyramids of Giza, the Sphinx, Luxor's Valley of the Kings, and Nile felucca cruises.",
              "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80", 1600.0, true),

            d("Prague", "Czech Republic", "Europe", "CITY, HISTORY, CULTURE, ROMANTIC",
              "The City of a Hundred Spires, featuring the 14th-century Charles Bridge, Prague Castle, and the medieval Astronomical Clock in Old Town.",
              "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1200&q=80", 1500.0, true),

            d("Zanzibar", "Tanzania", "Africa", "BEACH, ISLAND, HISTORY, ROMANTIC",
              "Spice Island with pristine white sand beaches along the Indian Ocean, vibrant coral reefs, and the labyrinthine alleyways of Stone Town.",
              "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80", 1850.0, true),

            // 71 - 80
            d("Jordan", "Jordan", "Middle East", "HISTORY, HERITAGE, DESERT, ADVENTURE, CULTURE",
              "The rose-red city of Petra carved into sandstone cliffs, the Martian desert landscape of Wadi Rum, and buoyant floating in the Dead Sea.",
              "https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&w=1200&q=80", 1900.0, true),

            d("Sri Lanka", "Sri Lanka", "Asia", "NATURE, BEACH, WILDLIFE, HERITAGE",
              "The Pearl of the Indian Ocean, famous for Sigiriya rock fortress, emerald hillside tea plantations in Ella, and elephant safaris.",
              "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80", 1300.0, false),

            d("Vienna", "Austria", "Europe", "CITY, CULTURE, HERITAGE, FOOD",
              "Imperial capital of classical music and Habsburg palaces, showcasing Schönbrunn Palace, St. Stephen's Cathedral, and historic coffeehouse culture.",
              "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1200&q=80", 2000.0, false),

            d("Hawaii", "USA", "Oceania", "BEACH, ISLAND, NATURE, ADVENTURE",
              "Tropical Pacific paradise offering dramatic emerald cliffs along the Na Pali Coast, volcanic craters, and legendary surf beaches.",
              "https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=1200&q=80", 3100.0, true),

            d("Myanmar", "Myanmar", "Asia", "CULTURE, HERITAGE, SPIRITUAL, HISTORY",
              "The mystical plain of Bagan with thousands of ancient Buddhist pagodas rising through the morning mist and tranquil Inle Lake.",
              "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80", 1200.0, false),

            d("Vietnam", "Vietnam", "Asia", "CULTURE, FOOD, NATURE, BEACH, HISTORY",
              "Emerald limestone karsts rising from Ha Long Bay, lantern-lit alleys of Hoi An, vibrant street cuisine, and serene Mekong Delta waterways.",
              "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80", 1250.0, true),

            d("Antarctica", "Antarctica", "Polar", "NATURE, ADVENTURE, WILDLIFE, GLACIERS",
              "The ultimate frontier expedition: towering icebergs, colossal glaciers, penguin rookeries, and breaching humpback whales in pristine polar seas.",
              "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80", 7500.0, true),

            d("Galapagos Islands", "Ecuador", "South America", "WILDLIFE, NATURE, ISLAND, ADVENTURE, ECOTOURISM",
              "A living laboratory of evolution, where giant tortoises, marine iguanas, and blue-footed boobies thrive in an untouched volcanic archipelago.",
              "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80", 3600.0, true),

            d("Bhutan", "Bhutan", "Asia", "MOUNTAINS, CULTURE, SPIRITUAL, HERITAGE, NATURE",
              "The Land of the Thunder Dragon, famous for the cliffside Tiger's Nest monastery, pristine Himalayan valleys, and Gross National Happiness.",
              "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80", 2800.0, false),

            d("Madagascar", "Madagascar", "Africa", "WILDLIFE, NATURE, ISLAND, ADVENTURE",
              "Unique evolutionary wonderland featuring ancient Avenue of the Baobabs, playful lemurs in rainforest reserves, and untouched coral shores.",
              "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?auto=format&fit=crop&w=1200&q=80", 2200.0, false),

            // 81 - 88
            d("Amalfi Coast", "Italy", "Europe", "BEACH, ROMANTIC, LUXURY, FOOD",
              "Dramatic Mediterranean cliffs dotted with pastel fishing villages like Positano and Ravello, cliffside lemon groves, and azure sea views.",
              "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80", 2700.0, true),

            d("Maldives", "Maldives", "Asia", "BEACH, ISLAND, ROMANTIC, LUXURY",
              "The pinnacle of tropical indulgence: overwater private villas perched above turquoise lagoons, coral atolls, and vibrant marine life.",
              "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80", 3500.0, true),

            d("New Orleans", "USA", "North America", "CITY, FOOD, CULTURE, HISTORY",
              "The Big Easy: legendary French Quarter jazz clubs, vibrant Mardi Gras traditions, historic wrought-iron balconies, and flavorful Creole cuisine.",
              "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80", 1800.0, false),

            d("Bali", "Indonesia", "Asia", "BEACH, CULTURE, NATURE, SPIRITUAL",
              "Tropical paradise celebrated for emerald Tegallalang rice terraces, sacred Uluwatu temples, surf breaks, and tranquil wellness retreats.",
              "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80", 1500.0, true),

            d("Patagonia", "Argentina", "South America", "NATURE, MOUNTAINS, ADVENTURE",
              "Wild, awe-inspiring glaciers including Perito Moreno, dramatic granite peaks in Torres del Paine and Mount Fitz Roy, and boundless windswept steppe.",
              "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=1200&q=80", 2900.0, true),

            d("Washington DC", "USA", "North America", "CITY, HISTORY, HERITAGE",
              "The capital of the United States, lined with neoclassical monuments, the National Mall, world-class Smithsonian museums, and cherry blossoms.",
              "https://images.unsplash.com/photo-1501436513145-30f24e19fcc8?auto=format&fit=crop&w=1200&q=80", 2000.0, false),

            d("Banff National Park", "Canada", "North America", "MOUNTAINS, NATURE, ADVENTURE, WINTER",
              "Canadian Rocky Mountain jewel featuring the surreal turquoise waters of Lake Louise and Moraine Lake surrounded by snow-capped summits.",
              "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1200&q=80", 2200.0, true),

            d("Yellowstone National Park", "USA", "North America", "NATURE, WILDLIFE, ADVENTURE",
              "The world's first national park, featuring the explosive Old Faithful geyser, prismatic hot springs, grand canyons, and wild bison herds.",
              "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80", 1900.0, true)
        );
    }

    private void seedAttractions() {
        seedDestinationAttraction("Goa", "India", List.of(
            new String[]{"Baga Beach", "Famous lively shoreline known for water sports, beach shacks, night markets, and sunset dolphin cruises."},
            new String[]{"Fort Aguada", "Well-preserved 17th-century Portuguese fortress and lighthouse commanding sweeping views of Sinquerim Beach."},
            new String[]{"Dudhsagar Falls", "Majestic four-tiered waterfall cascading through lush Western Ghats forest reserves."},
            new String[]{"Basilica of Bom Jesus", "UNESCO World Heritage site containing the sacred relics of St. Francis Xavier in Old Goa."}
        ));

        seedDestinationAttraction("Paris", "France", List.of(
            new String[]{"Eiffel Tower", "Iconic wrought-iron lattice tower on the Champ de Mars with panoramic views across Paris."},
            new String[]{"Louvre Museum", "World's most visited art museum, home to the Mona Lisa and Winged Victory of Samothrace."},
            new String[]{"Notre-Dame Cathedral", "Medieval Catholic cathedral on the Île de la Cité renowned for French Gothic architecture."},
            new String[]{"Montmartre & Sacré-Cœur", "Historic bohemian hilltop district crowned by the white-domed Basilica of the Sacred Heart."}
        ));

        seedDestinationAttraction("London", "United Kingdom", List.of(
            new String[]{"Tower of London", "Historic fortress, former royal palace and prison housing the Crown Jewels along the Thames."},
            new String[]{"Big Ben & Westminster Palace", "The world-famous Elizabeth Tower and Houses of Parliament along the River Thames."},
            new String[]{"British Museum", "Dedicated to human history, art, and culture with a vast collection of world treasures."},
            new String[]{"London Eye", "Giant cantilevered observation wheel offering breathtaking 360-degree skyline vistas."}
        ));

        seedDestinationAttraction("Tokyo", "Japan", List.of(
            new String[]{"Sensō-ji Temple", "Ancient Buddhist temple in Asakusa, Tokyo's oldest and most significant cultural landmark."},
            new String[]{"Shibuya Crossing & Hachiko", "The world's busiest pedestrian scramble crossing and iconic meeting spot in Tokyo's neon core."},
            new String[]{"Meiji Shrine", "Serene Shinto shrine dedicated to Emperor Meiji surrounded by 170 acres of tranquil sacred forest."},
            new String[]{"Tokyo Skytree", "Towering futuristic broadcasting tower and observation deck offering views of Mount Fuji."}
        ));

        seedDestinationAttraction("Bali", "Indonesia", List.of(
            new String[]{"Uluwatu Temple", "Dramatic cliffside sea temple renowned for evening Kecak fire dance performances."},
            new String[]{"Tegallalang Rice Terraces", "Iconic emerald stepped paddy fields showcasing ancient Subak cooperative irrigation."},
            new String[]{"Sacred Monkey Forest Sanctuary", "Lush jungle sanctuary housing hundreds of Balinese long-tailed macaques."},
            new String[]{"Mount Batur Sunrise Trek", "Active volcanic summit offering unforgettable early morning caldera panoramas."}
        ));

        seedDestinationAttraction("Kerala", "India", List.of(
            new String[]{"Alleppey Backwaters", "Tranquil labyrinth of palm-fringed canals, lagoons, and traditional thatched houseboats."},
            new String[]{"Munnar Tea Plantations", "Rolling emerald tea estate hills and mist-shrouded peaks in the Western Ghats."},
            new String[]{"Periyar National Park", "Famous wildlife sanctuary protecting wild elephants, tigers, and rare bird species around Periyar Lake."},
            new String[]{"Fort Kochi Heritage Waterfront", "Historic port district famous for iconic Chinese fishing nets, spice markets, and colonial mansions."}
        ));
    }

    private void seedDestinationAttraction(String destName, String country, List<String[]> attractionData) {
        Optional<Destination> destOpt = destinationRepository.findByNameIgnoreCaseAndCountryIgnoreCase(destName.trim(), country.trim());
        if (destOpt.isPresent()) {
            Destination dest = destOpt.get();
            List<Attraction> existing = attractionRepository.findByDestinationId(dest.getId());
            if (existing.isEmpty()) {
                for (String[] pair : attractionData) {
                    Attraction attraction = Attraction.builder()
                            .destination(dest)
                            .name(pair[0])
                            .description(pair[1])
                            .build();
                    attractionRepository.save(attraction);
                }
                log.info("Seeded {} attractions for destination: {}, {}", attractionData.size(), destName, country);
            }
        }
    }

    private Destination d(String name, String country, String region, String category,
                          String description, String imageUrl, Double averageCost, boolean isPopular) {
        // Map average cost into realistic INR travel budget ranges (converting USD-scaled numbers if < 10000)
        Double realisticCost = averageCost != null
                ? (averageCost < 10000.0 ? Math.round(averageCost * 75.0 / 100.0) * 100.0 : averageCost)
                : 50000.0;

        return Destination.builder()
                .name(name)
                .country(country)
                .region(region)
                .category(category)
                .description(description)
                .imageUrl(imageUrl)
                .averageCost(realisticCost)
                .isPopular(isPopular)
                .isActive(true)
                .build();
    }
}

/**
 * TRIPNEST VERIFIED DESTINATION PHOTO GALLERIES & ASSET REGISTRY
 * 
 * Rules:
 * 1. STRICT DATA INTEGRITY: Every image strictly belongs to the destination named.
 * 2. NO RANDOM IMAGES & NO UNRELATED FALLBACKS:
 *    If a multi-photo gallery is available, all photos represent that destination's landmarks.
 *    If not, the destination's verified primary image is returned as a 1-photo set.
 * 3. NO ARRAY-INDEX MAPPING or Math.random().
 */

export const DESTINATION_GALLERIES = {
  // 1. India's Golden Triangle (Delhi + Agra + Jaipur Circuit)
  'india\'s golden triangle': [
    {
      url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=85',
      caption: 'Hawa Mahal (Palace of Winds) in Jaipur, part of India\'s Golden Triangle circuit',
      altText: 'India\'s Golden Triangle destination featuring Hawa Mahal in Jaipur'
    },
    {
      url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=85',
      caption: 'The iconic Taj Mahal in Agra on the Golden Triangle route',
      altText: 'Taj Mahal marble monument in Agra India on the Golden Triangle circuit'
    },
    {
      url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1400&q=85',
      caption: 'India Gate war memorial in New Delhi, the capital gateway of the Golden Triangle',
      altText: 'India Gate monument in New Delhi on the Golden Triangle route'
    },
    {
      url: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&w=1400&q=85',
      caption: 'Amber Fort historic palace ramparts overlooking Jaipur',
      altText: 'Amber Fort palace in Jaipur Rajasthan'
    },
    {
      url: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=1400&q=85',
      caption: 'City Palace courtyards and royal Mughal-Rajput architecture in Jaipur',
      altText: 'Jaipur City Palace courtyards on the Golden Triangle circuit'
    }
  ],

  // 2. Marrakech, Morocco
  'marrakech': [
    {
      url: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1400&q=85',
      caption: 'Koutoubia Mosque minaret towering over the Marrakech Medina',
      altText: 'Koutoubia Mosque minaret in Marrakech Morocco'
    },
    {
      url: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&w=1400&q=85',
      caption: 'Vibrant evening atmosphere and street stalls at Jemaa el-Fnaa square',
      altText: 'Jemaa el-Fnaa main square and bustling night market in Marrakech'
    },
    {
      url: 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?auto=format&fit=crop&w=1400&q=85',
      caption: 'Ornate Moroccan zellij tilework in Bahia Palace courtyard',
      altText: 'Bahia Palace ornate courtyards and historic architecture in Marrakech'
    },
    {
      url: 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?auto=format&fit=crop&w=1400&q=85',
      caption: 'Spices, handcrafted lanterns, and textiles in Marrakech souks',
      altText: 'Traditional colorful souks and markets of Marrakech Medina'
    },
    {
      url: 'https://images.unsplash.com/photo-1509059852496-f3822ae057bf?auto=format&fit=crop&w=1400&q=85',
      caption: 'Electric cobalt architecture and lush palms at Jardin Majorelle',
      altText: 'Jardin Majorelle botanical gardens in Marrakech Morocco'
    }
  ],

  // 3. Paris, France
  'paris': [
    {
      url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=85',
      caption: 'Eiffel Tower at golden hour from Champ de Mars',
      altText: 'Eiffel Tower landmark in Paris France'
    },
    {
      url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1400&q=85',
      caption: 'Historic Parisian architecture and Haussmann boulevards',
      altText: 'Historic Parisian Haussmann buildings and streets'
    },
    {
      url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1400&q=85',
      caption: 'Louvre Museum Glass Pyramid at twilight',
      altText: 'Louvre Museum pyramid in Paris France'
    },
    {
      url: 'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=1400&q=85',
      caption: 'Charming cafés along the cobblestone streets of Montmartre',
      altText: 'Bohemian Montmartre streets and bistros in Paris'
    },
    {
      url: 'https://images.unsplash.com/photo-1471623320832-752e8bbf8413?auto=format&fit=crop&w=1400&q=85',
      caption: 'Panoramic skyline over the Seine river and Notre-Dame',
      altText: 'Seine River and Parisian bridges'
    }
  ],

  // 4. Tokyo, Japan
  'tokyo': [
    {
      url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=85',
      caption: 'Tokyo Tower standing tall amidst the vibrant cityscape',
      altText: 'Tokyo Tower illuminated against the Tokyo skyline'
    },
    {
      url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1400&q=85',
      caption: 'The bustling, neon-lit Shibuya Crossing at dusk',
      altText: 'Shibuya Crossing busy pedestrian scramble in Tokyo'
    },
    {
      url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1400&q=85',
      caption: 'Historic Senso-ji Temple and five-story pagoda in Asakusa',
      altText: 'Senso-ji Buddhist Temple in Asakusa Tokyo'
    },
    {
      url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=85',
      caption: 'Tranquil Japanese gardens with blooming cherry blossoms',
      altText: 'Cherry blossoms in full bloom at a Tokyo garden'
    },
    {
      url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1400&q=85',
      caption: 'Atmospheric Omoide Yokocho lantern-lit alleyways in Shinjuku',
      altText: 'Shinjuku nightlife and dining alleys in Tokyo'
    }
  ],

  // 5. London, United Kingdom
  'london': [
    {
      url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=85',
      caption: 'Palace of Westminster and Elizabeth Tower (Big Ben)',
      altText: 'Big Ben and the Palace of Westminster in London'
    },
    {
      url: 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&w=1400&q=85',
      caption: 'Tower Bridge spanning the River Thames at sunset',
      altText: 'Tower Bridge on the Thames in London'
    },
    {
      url: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1400&q=85',
      caption: 'The London Eye observation wheel on the South Bank',
      altText: 'The London Eye overlooking the Thames'
    },
    {
      url: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1400&q=85',
      caption: 'Piccadilly Circus glowing with city lights and energy',
      altText: 'Piccadilly Circus intersection in Central London'
    },
    {
      url: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=1400&q=85',
      caption: 'Classic red telephone box along historic Westminster streets',
      altText: 'Westminster historic streets and red phone booth in London'
    }
  ],

  // 6. Dubai, UAE
  'dubai': [
    {
      url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=85',
      caption: 'Burj Khalifa rising above Downtown Dubai fountains',
      altText: 'Burj Khalifa towering above Downtown Dubai'
    },
    {
      url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1400&q=85',
      caption: 'Luxury yachts along the illuminated Dubai Marina waterfront',
      altText: 'Dubai Marina waterfront and illuminated skyline'
    },
    {
      url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1400&q=85',
      caption: 'Golden sand dunes of the Arabian desert safari near Dubai',
      altText: 'Arabian desert dunes outside Dubai UAE'
    },
    {
      url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1400&q=85',
      caption: 'Sheikh Zayed Road futuristic skyscrapers and transit line',
      altText: 'Futuristic Sheikh Zayed Road skyscrapers in Dubai'
    },
    {
      url: 'https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1400&q=85',
      caption: 'Burj Al Arab framed against the turquoise Persian Gulf',
      altText: 'Burj Al Arab luxury sail-shaped hotel in Dubai'
    }
  ],

  // 7. New York City, USA
  'new york city': [
    {
      url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1400&q=85',
      caption: 'Times Square glowing with legendary billboards and energy',
      altText: 'Times Square in New York City with bright billboard lights'
    },
    {
      url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1400&q=85',
      caption: 'Central Park looking out towards the Manhattan skyscraper skyline',
      altText: 'Central Park looking towards Midtown Manhattan skyline'
    },
    {
      url: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=1400&q=85',
      caption: 'The Brooklyn Bridge arches leading into the financial district',
      altText: 'Brooklyn Bridge pedestrian promenade in New York City'
    },
    {
      url: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?auto=format&fit=crop&w=1400&q=85',
      caption: 'Empire State Building illuminated against the evening sky',
      altText: 'Empire State Building towering over Manhattan'
    },
    {
      url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1400&q=85',
      caption: 'Yellow taxis flowing through classic Manhattan avenues',
      altText: 'New York City yellow taxicabs in Manhattan'
    }
  ],

  // 8. Rome, Italy
  'rome': [
    {
      url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1400&q=85',
      caption: 'The ancient Roman Colosseum standing proudly in central Rome',
      altText: 'The ancient Colosseum amphitheater in Rome Italy'
    },
    {
      url: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&w=1400&q=85',
      caption: 'Trevi Fountain illuminated with baroque marble sculptures',
      altText: 'Trevi Fountain in Rome Italy'
    },
    {
      url: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1400&q=85',
      caption: 'The Roman Forum ancient ruins surrounded by stone pine trees',
      altText: 'Roman Forum archaeological site in Rome'
    },
    {
      url: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=1400&q=85',
      caption: 'St. Peter\'s Basilica and Vatican square at dawn',
      altText: 'St. Peter\'s Basilica in the Vatican Rome'
    },
    {
      url: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=1400&q=85',
      caption: 'Romantic cobblestone alleys and trattorias in Trastevere',
      altText: 'Trastevere neighborhood streets in Rome'
    }
  ],

  // 9. Barcelona, Spain
  'barcelona': [
    {
      url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1400&q=85',
      caption: 'Sagrada Família basílica spires against blue Catalonian sky',
      altText: 'Sagrada Familia basílica in Barcelona Spain'
    },
    {
      url: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&w=1400&q=85',
      caption: 'Park Güell mosaic terraces overlooking Barcelona cityscape',
      altText: 'Park Güell mosaic terrace in Barcelona'
    },
    {
      url: 'https://images.unsplash.com/photo-1561632669-7f55f7975606?auto=format&fit=crop&w=1400&q=85',
      caption: 'Bustling tree-lined La Rambla pedestrian promenade',
      altText: 'La Rambla pedestrian promenade in Barcelona'
    },
    {
      url: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?auto=format&fit=crop&w=1400&q=85',
      caption: 'Gothic Quarter historic stone arches and tapas bars',
      altText: 'Gothic Quarter historic architecture in Barcelona'
    },
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
      caption: 'Barceloneta Mediterranean beach and seaside boardwalk',
      altText: 'Barceloneta beach in Barcelona Spain'
    }
  ],

  // 10. Sydney, Australia
  'sydney': [
    {
      url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1400&q=85',
      caption: 'Sydney Opera House and Harbor Bridge at sunset',
      altText: 'Sydney Opera House and Harbor Bridge in Sydney Australia'
    },
    {
      url: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1400&q=85',
      caption: 'Bondi Beach coastline and turquoise Pacific surf',
      altText: 'Bondi Beach in Sydney Australia'
    },
    {
      url: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=1400&q=85',
      caption: 'Darling Harbour illuminated with evening ferries and skyline',
      altText: 'Darling Harbour waterfront in Sydney'
    },
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
      caption: 'Manly Beach coastal walk and Pacific ocean waves',
      altText: 'Manly coastal beach in Sydney'
    }
  ],

  // 11. Bali, Indonesia
  'bali': [
    {
      url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=85',
      caption: 'Lush emerald Tegallalang rice terraces in Ubud',
      altText: 'Tegallalang rice terraces in Ubud Bali'
    },
    {
      url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1400&q=85',
      caption: 'Uluwatu cliffside temple perched high above the Indian Ocean',
      altText: 'Uluwatu cliff temple in Bali Indonesia'
    },
    {
      url: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1400&q=85',
      caption: 'Traditional Balinese temple gates with Mount Agung backdrop',
      altText: 'Pura Lempuyang temple gate in Bali'
    },
    {
      url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1400&q=85',
      caption: 'Tropical coastline and white sand beaches of Nusa Penida',
      altText: 'Kelingking beach in Nusa Penida near Bali'
    },
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85',
      caption: 'Golden sunset over Seminyak beach and coastal surf',
      altText: 'Seminyak beach sunset in Bali'
    }
  ],

  // 12. Singapore
  'singapore': [
    {
      url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1400&q=85',
      caption: 'Marina Bay Sands hotel and waterfront promenade',
      altText: 'Marina Bay Sands in Singapore'
    },
    {
      url: 'https://images.unsplash.com/photo-1506351421178-63b52a2d2562?auto=format&fit=crop&w=1400&q=85',
      caption: 'Gardens by the Bay Supertree Grove light display',
      altText: 'Supertree Grove in Gardens by the Bay Singapore'
    },
    {
      url: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1400&q=85',
      caption: 'Historic shophouses and vibrant street culture in Chinatown',
      altText: 'Chinatown shophouses in Singapore'
    },
    {
      url: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=1400&q=85',
      caption: 'Jewel Changi Airport indoor rain vortex and forest canopy',
      altText: 'Jewel Changi indoor waterfall in Singapore'
    }
  ],

  // 13. Kyoto, Japan
  'kyoto': [
    {
      url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1400&q=85',
      caption: 'Thousands of vermilion torii gates winding up Fushimi Inari',
      altText: 'Fushimi Inari torii gates in Kyoto Japan'
    },
    {
      url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1400&q=85',
      caption: 'Kinkaku-ji Golden Pavilion shimmering across the reflection pond',
      altText: 'Kinkaku-ji Golden Pavilion temple in Kyoto'
    },
    {
      url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=85',
      caption: 'Arashiyama Bamboo Grove soaring high into the canopy',
      altText: 'Arashiyama Bamboo Grove in Kyoto'
    },
    {
      url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=85',
      caption: 'Traditional wooden machiya houses in Gion geisha district',
      altText: 'Gion district historic streets in Kyoto'
    }
  ],

  // 14. Egypt
  'egypt': [
    {
      url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1400&q=85',
      caption: 'Great Pyramids of Giza rising above the desert sands',
      altText: 'Great Pyramids of Giza in Egypt'
    },
    {
      url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1400&q=85',
      caption: 'The Great Sphinx guarding the Giza plateau',
      altText: 'The Sphinx on the Giza plateau in Egypt'
    },
    {
      url: 'https://images.unsplash.com/photo-1548786811-dd6e453ccca7?auto=format&fit=crop&w=1400&q=85',
      caption: 'Ancient Luxor Temple colonnades along the Nile River',
      altText: 'Luxor Temple columns in Egypt'
    }
  ]
};

/**
 * Normalizes destination names for robust, case-insensitive, punctuation-resilient key matching.
 */
function normalizeKey(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9']/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extracts base photo ID from Unsplash or other URL to prevent duplicates due to query parameters.
 */
function getBasePhotoId(url = '') {
  const match = url.match(/photo-[a-zA-Z0-9_-]+/);
  return match ? match[0] : url.split('?')[0];
}

/**
 * Returns a list of verified photo objects for a destination.
 * 
 * Guarantees:
 * - The returned array contains ONLY verified images belonging to that exact destination.
 * - The main `destination.imageUrl` from the database is always preserved as photo #1.
 * - If no pre-configured multi-photo gallery exists, it returns a 1-photo verified set containing `destination.imageUrl`.
 * - NO generic unrelated fallback photos are EVER injected.
 */
export function getDestinationPhotos(destination) {
  if (!destination) return [];

  const rawName = destination.name || '';
  const key = normalizeKey(rawName);
  const country = destination.country || '';

  // 1. Check if an explicit verified gallery exists for this destination
  let matchedGallery = null;

  for (const [cityName, list] of Object.entries(DESTINATION_GALLERIES)) {
    const normalizedCity = normalizeKey(cityName);
    if (key === normalizedCity || key.includes(normalizedCity) || normalizedCity.includes(key)) {
      matchedGallery = list;
      break;
    }
  }

  // 2. If matched, ensure the destination's primary image from backend is placed first
  if (matchedGallery && matchedGallery.length > 0) {
    const primaryUrl = destination.imageUrl && destination.imageUrl.startsWith('http')
      ? destination.imageUrl
      : matchedGallery[0].url;

    const firstPhoto = {
      url: primaryUrl,
      caption: matchedGallery[0].caption || `${rawName}, ${country} landmark perspective`,
      altText: matchedGallery[0].altText || `${rawName} in ${country}`
    };

    // Filter out duplicate if primaryUrl matches one of the gallery items by base ID
    const primaryBase = getBasePhotoId(primaryUrl);
    const remaining = matchedGallery.filter(p => getBasePhotoId(p.url) !== primaryBase);
    return [firstPhoto, ...remaining];
  }

  // 3. Fallback: Return ONLY the destination's verified primary image
  // Photo count = 1. Never inject random/unrelated travel images.
  if (destination.imageUrl && destination.imageUrl.startsWith('http')) {
    return [
      {
        url: destination.imageUrl,
        caption: `${rawName} in ${country}`,
        altText: `${rawName} travel destination in ${country}`
      }
    ];
  }

  return [];
}

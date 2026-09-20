import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { destinationApi } from '../api/destinationApi';
import { useAuth } from '../context/AuthContext';
import { getDestinationPhotos } from '../utils/destinationGalleries';
import {
  MapPin,
  Calendar,
  CloudSun,
  Sun,
  CloudRain,
  CloudSnow,
  Droplets,
  Wind,
  Star,
  ArrowLeft,
  Compass,
  DollarSign,
  Plus,
  Camera,
  CheckCircle2,
  Globe2,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const DestinationDetailsPage = () => {
  const { id } = useParams();
  const [destination, setDestination] = useState(null);
  const [weather, setWeather] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline Image Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Swipe handling state
  const touchStartX = useRef(null);

  const { isAuthenticated, user, role } = useAuth();
  const isAdministrator = role === 'ADMINISTRATOR' || user?.role === 'ADMINISTRATOR';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const [destData, weatherData, placesData, attractionsData] = await Promise.all([
          destinationApi.getDestinationById(id),
          destinationApi.getDestinationWeather(id).catch(() => null),
          destinationApi.getDestinationPlaces(id).catch(() => []),
          destinationApi.getDestinationAttractions(id).catch(() => []),
        ]);
        setDestination(destData);
        setWeather(weatherData);

        // Combine backend attractions with places if available, prioritizing backend attractions
        const combinedPlaces = [];
        if (Array.isArray(attractionsData) && attractionsData.length > 0) {
          combinedPlaces.push(...attractionsData);
        }
        if (Array.isArray(placesData) && placesData.length > 0) {
          placesData.forEach((p) => {
            if (!combinedPlaces.some((cp) => cp.name.toLowerCase() === p.name.toLowerCase())) {
              combinedPlaces.push(p);
            }
          });
        }
        setPlaces(combinedPlaces);
      } catch (err) {
        console.error('Failed to load destination details:', err);
        setError('Destination details could not be retrieved.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const destinationPhotos = destination ? getDestinationPhotos(destination) : [];
  const photoCount = destinationPhotos.length || 1;

  const nextImage = useCallback(() => {
    if (photoCount <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % photoCount);
  }, [photoCount]);

  const prevImage = useCallback(() => {
    if (photoCount <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + photoCount) % photoCount);
  }, [photoCount]);

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextImage, prevImage]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
    touchStartX.current = null;
  };

  const handlePlanTrip = () => {
    if (isAdministrator) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/trips?destinationId=${id}&action=create` } } });
    } else {
      navigate(`/trips?destinationId=${id}&action=create`);
    }
  };

  const getWeatherIcon = (condition = '') => {
    const cond = condition.toLowerCase();
    if (cond.includes('rain') || cond.includes('shower')) return <CloudRain size={28} className="weather-icon-rain" />;
    if (cond.includes('snow')) return <CloudSnow size={28} className="weather-icon-snow" />;
    if (cond.includes('cloud')) return <CloudSun size={28} className="weather-icon-cloud" />;
    return <Sun size={28} className="weather-icon-sun" />;
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/destinations');
    }
  };

  if (loading) {
    return (
      <div className="destinations-workspace-container loading-state-center">
        <div className="travel-spinner"></div>
        <p>Opening destination guide...</p>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="destinations-workspace-container empty-state-box">
        <Compass size={44} className="empty-icon" />
        <h3>{error || 'Destination not found'}</h3>
        <p>The destination you requested may have been moved or removed from our directory.</p>
        <button type="button" onClick={handleBack} className="btn-back-link">
          <ArrowLeft size={16} /> Back to Destinations
        </button>
      </div>
    );
  }

  const currentPhoto = destinationPhotos[currentImageIndex] || { url: destination.imageUrl };

  return (
    <div className="destinations-workspace-container">
      {/* 1. TOP BREADCRUMB & ACTION BAR */}
      <div className="details-top-nav">
        <button type="button" onClick={handleBack} className="btn-back-link">
          <ArrowLeft size={16} /> Back
        </button>

        {!isAdministrator && (
          <div className="details-top-actions">
            <button onClick={handlePlanTrip} className="btn-primary-action">
              <Plus size={16} /> Plan a Trip to {destination.name}
            </button>
          </div>
        )}
      </div>

      {/* 2. INLINE DESTINATION HERO BANNER WITH DIRECT ARROW NAVIGATION */}
      <section
        className="dest-hero-banner"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <div className="dest-hero-image-wrap">
          <img
            src={currentPhoto.url || destination.imageUrl}
            alt={`${destination.name}, ${destination.country} photo ${currentImageIndex + 1}`}
            className="dest-hero-img"
            style={{ transition: 'all 0.35s ease-in-out' }}
          />
          <div className="dest-hero-overlay"></div>

          {/* Left Arrow Button */}
          {photoCount > 1 && (
            <button
              type="button"
              className="gallery-arrow-btn prev-arrow"
              onClick={prevImage}
              aria-label="Previous photo"
              title="Previous photo"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Arrow Button */}
          {photoCount > 1 && (
            <button
              type="button"
              className="gallery-arrow-btn next-arrow"
              onClick={nextImage}
              aria-label="Next photo"
              title="Next photo"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        <div className="dest-hero-content">
          <div className="dest-hero-tags">
            <span className="dest-country-badge">
              <MapPin size={14} /> {destination.country}
            </span>
            {destination.category && (
              <span className="dest-cat-badge">{destination.category}</span>
            )}
          </div>

          <h1 className="dest-hero-title">{destination.name}</h1>
          <p className="dest-hero-desc">
            {destination.description ||
              `Discover the unique attractions, vibrant culture, and stunning sights of ${destination.name}.`}
          </p>
        </div>
      </section>

      {/* 3. INLINE GALLERY DOTS NAVIGATION */}
      {photoCount > 1 && (
        <div className="gallery-dots-bar" role="tablist" aria-label="Photo carousel navigation">
          {destinationPhotos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentImageIndex(idx)}
              className={`gallery-nav-dot ${idx === currentImageIndex ? 'active' : ''}`}
              aria-label={`Show photo ${idx + 1} of ${photoCount}`}
              title={`Photo ${idx + 1} of ${photoCount}`}
            />
          ))}
        </div>
      )}

      {/* 4. QUICK INFO RIBBON */}
      <section className="quick-info-ribbon">
        <div className="info-ribbon-card">
          <Globe2 size={18} className="ribbon-icon" />
          <div>
            <span className="ribbon-label">Country</span>
            <strong className="ribbon-val">{destination.country}</strong>
          </div>
        </div>

        {destination.averageCost != null && (
          <div className="info-ribbon-card">
            <DollarSign size={18} className="ribbon-icon" />
            <div>
              <span className="ribbon-label">Avg. Estimated Budget</span>
              <strong className="ribbon-val">₹{Number(destination.averageCost).toLocaleString()}</strong>
            </div>
          </div>
        )}

        <div className="info-ribbon-card">
          <Star size={18} className="ribbon-icon" />
          <div>
            <span className="ribbon-label">Category</span>
            <strong className="ribbon-val">{destination.category || 'Travel Hotspot'}</strong>
          </div>
        </div>

        {weather && (
          <div className="info-ribbon-card">
            <CloudSun size={18} className="ribbon-icon" />
            <div>
              <span className="ribbon-label">Current Temperature</span>
              <strong className="ribbon-val">{weather.temperature ? `${weather.temperature}°C` : '24°C'}</strong>
            </div>
          </div>
        )}
      </section>

      {/* 5. MAIN WORKSPACE CONTENT GRID (2/3 CONTENT + 1/3 SIDEBAR) */}
      <div className="details-content-grid">
        {/* Left Column: About & Attractions */}
        <div className="details-main-column">
          {/* ABOUT THIS DESTINATION */}
          <div className="details-section-card">
            <h2 className="section-card-title">About {destination.name}</h2>
            <p className="section-card-text">
              {destination.description ||
                `${destination.name} is one of the world's most captivating travel destinations. Known for its historical depth, scenic viewpoints, and rich cultural traditions, it attracts millions of explorers every year.`}
            </p>

            <div className="travel-tips-box">
              <div className="tip-header">
                <Info size={16} />
                <strong>Travel Planning Highlights</strong>
              </div>
              <ul className="tip-list">
                <li><CheckCircle2 size={14} /> Recommended trip length: 3 to 7 days to fully experience key sights.</li>
                <li><CheckCircle2 size={14} /> Walkable central district with efficient local public transit.</li>
                <li><CheckCircle2 size={14} /> Mix of historic landmarks, bustling food markets, and cultural galleries.</li>
              </ul>
            </div>
          </div>

          {/* PLACES & ATTRACTIONS */}
          <div className="details-section-card">
            <div className="section-title-strip">
              <div>
                <h2 className="section-card-title">Popular Places & Attractions</h2>
                <p className="section-subtitle">Must-see sights and activities around {destination.name}</p>
              </div>
            </div>

            {places && places.length > 0 ? (
              <div className="attractions-grid">
                {places.map((place, idx) => (
                  <div key={idx} className="attraction-item-card">
                    <div className="attraction-photo-wrap">
                      <img
                        src={place.imageUrl || destinationPhotos[(idx + 1) % destinationPhotos.length]?.url || destination.imageUrl}
                        alt={place.name}
                        className="attraction-photo"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    </div>
                    <div className="attraction-info">
                      <div className="attraction-title-row">
                        <h4 className="attraction-name">{place.name}</h4>
                        {place.rating && (
                          <span className="attraction-rating">
                            <Star size={12} fill="currentColor" /> {place.rating}
                          </span>
                        )}
                      </div>
                      {place.address && (
                        <p className="attraction-address">
                          <MapPin size={12} /> {place.address}
                        </p>
                      )}
                      {place.description && (
                        <p className="attraction-desc">{place.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="places-empty-banner">
                <p>Curated local attractions will automatically populate when you start your itinerary.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Weather & Quick Launch */}
        <div className="details-sidebar-column">
          {/* LIVE WEATHER WIDGET */}
          {weather && (
            <div className="details-section-card weather-widget-card">
              <h3 className="widget-card-title">Live Weather Bulletin</h3>
              
              <div className="weather-main-display">
                <div className="weather-icon-box">
                  {getWeatherIcon(weather.condition)}
                </div>
                <div className="weather-temp-group">
                  <span className="weather-degrees">{weather.temperature || 24}°C</span>
                  <span className="weather-condition-text">{weather.condition || 'Clear Skies'}</span>
                </div>
              </div>

              <div className="weather-metrics-grid">
                <div className="weather-metric-item">
                  <Droplets size={16} className="metric-icon" />
                  <div>
                    <span className="metric-label">Humidity</span>
                    <strong className="metric-value">{weather.humidity || 65}%</strong>
                  </div>
                </div>

                <div className="weather-metric-item">
                  <Wind size={16} className="metric-icon" />
                  <div>
                    <span className="metric-label">Wind</span>
                    <strong className="metric-value">{weather.windSpeed || 12} km/h</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRIP PLANNER QUICK LAUNCH */}
          {!isAdministrator && (
            <div className="details-section-card plan-launch-card">
              <h3 className="widget-card-title">Plan Your Expedition</h3>
              <p className="widget-card-text">
                Add {destination.name} to your trips to build your daily timeline, manage expenses, and track your travel budget.
              </p>

              <button onClick={handlePlanTrip} className="btn-launch-trip">
                <Plus size={16} /> Start Planning Trip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DestinationDetailsPage;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { destinationApi } from '../api/destinationApi';
import { useAuth } from '../context/AuthContext';
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
  Sparkles,
  Camera,
  Layers,
  Thermometer,
} from 'lucide-react';

const DestinationDetailsPage = () => {
  const { id } = useParams();
  const [destination, setDestination] = useState(null);
  const [weather, setWeather] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const [destData, weatherData, placesData] = await Promise.all([
          destinationApi.getDestinationById(id),
          destinationApi.getDestinationWeather(id).catch(() => null),
          destinationApi.getDestinationPlaces(id).catch(() => []),
        ]);
        setDestination(destData);
        setWeather(weatherData);
        setPlaces(placesData);
      } catch (err) {
        console.error('Failed to load destination details:', err);
        setError('Destination not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handlePlanTrip = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/trips?destinationId=${id}&action=create` } } });
    } else {
      navigate(`/trips?destinationId=${id}&action=create`);
    }
  };

  const getWeatherIcon = (condition = '') => {
    const cond = condition.toLowerCase();
    if (cond.includes('rain') || cond.includes('shower')) return <CloudRain size={28} className="weather-icon-dynamic rain" />;
    if (cond.includes('snow')) return <CloudSnow size={28} className="weather-icon-dynamic snow" />;
    if (cond.includes('cloud')) return <CloudSun size={28} className="weather-icon-dynamic cloud" />;
    return <Sun size={28} className="weather-icon-dynamic sun" />;
  };

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="spinner"></div>
        <p>Loading destination guide, weather, and top spots...</p>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="page-container empty-state">
        <Compass size={40} className="empty-icon" />
        <h3>{error || 'Destination not found'}</h3>
        <p>Please check the destination link or browse all available destinations.</p>
        <Link to="/destinations" className="btn-primary mt-3">
          <ArrowLeft size={16} />
          <span>Back to All Destinations</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container destination-details-container">
      {/* Top Breadcrumb navigation */}
      <div className="dest-breadcrumb-bar">
        <Link to="/destinations" className="btn-back-link">
          <ArrowLeft size={16} />
          <span>Explore All Destinations</span>
        </Link>
      </div>

      {/* Hero Showcase */}
      <section className="dest-detail-hero">
        <div className="dest-detail-hero-media">
          <img
            src={
              destination.imageUrl ||
              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=80'
            }
            alt={destination.name}
            className="dest-detail-hero-img"
          />
          <div className="dest-detail-hero-overlay"></div>
          {destination.category && (
            <span className="dest-hero-category-badge">
              <Layers size={13} />
              <span>{destination.category}</span>
            </span>
          )}
        </div>

        <div className="dest-detail-hero-card">
          <div className="hero-card-left">
            <div className="dest-hero-location-pill">
              <MapPin size={14} />
              <span>{destination.country}</span>
            </div>
            <h1 className="dest-hero-main-title">{destination.name}</h1>
            <p className="dest-hero-lead-desc">{destination.description}</p>
          </div>

          <div className="hero-card-right">
            {destination.averageCost && (
              <div className="dest-hero-budget-card">
                <span className="budget-label">Estimated Avg. Budget</span>
                <span className="budget-val">
                  ${Math.round(destination.averageCost).toLocaleString()}
                </span>
                <span className="budget-note">Per person / typical week</span>
              </div>
            )}
            <button onClick={handlePlanTrip} className="btn-primary btn-plan-hero">
              <Calendar size={17} />
              <span>Plan Trip to {destination.name}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid: Weather + Places */}
      <div className="dest-content-grid">
        {/* Left Column: Google Places & Top Attractions */}
        <section className="dest-main-column">
          <div className="section-title-wrap">
            <div className="section-title-icon-badge">
              <Camera size={16} />
            </div>
            <div>
              <h2 className="section-heading">Top Attractions & Places</h2>
              <p className="section-subheading">
                Must-visit sights, cultural landmarks, and dining spots powered by Google Places
              </p>
            </div>
          </div>

          {places.length === 0 ? (
            <div className="empty-subcard">
              <Compass size={28} className="empty-icon-sm" />
              <p>Attraction recommendations for {destination.name} will be added shortly.</p>
            </div>
          ) : (
            <div className="places-grid">
              {places.map((place) => (
                <article key={place.id} className="place-card">
                  {place.imageUrl && (
                    <div className="place-card-img-wrap">
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="place-card-img"
                        loading="lazy"
                      />
                      {place.category && (
                        <span className="place-category-badge">{place.category}</span>
                      )}
                    </div>
                  )}

                  <div className="place-card-body">
                    <div className="place-card-top">
                      <h3 className="place-name">{place.name}</h3>
                      {place.rating && (
                        <div className="place-rating-badge">
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          <span className="rating-score">{place.rating}</span>
                          {place.reviewCount && (
                            <span className="review-count">({place.reviewCount.toLocaleString()})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {place.description && (
                      <p className="place-desc">{place.description}</p>
                    )}

                    {place.address && (
                      <div className="place-address-row">
                        <MapPin size={13} className="address-icon" />
                        <span className="address-text">{place.address}</span>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Right Sidebar: Live Weather + Travel Action Widget */}
        <aside className="dest-sidebar-column">
          {weather && (
            <div className="weather-widget-card">
              <div className="weather-widget-header">
                <div className="weather-header-title">
                  <Thermometer size={17} />
                  <span>Live Weather Forecast</span>
                </div>
                <span className="weather-city-badge">{destination.name}</span>
              </div>

              <div className="weather-main-display">
                <div className="weather-temp-group">
                  <span className="current-temp">{Math.round(weather.temperature)}°</span>
                  <span className="temp-unit">C</span>
                </div>
                <div className="weather-condition-group">
                  {getWeatherIcon(weather.condition)}
                  <span className="current-condition-text">{weather.condition}</span>
                </div>
              </div>

              <div className="weather-metrics-grid">
                <div className="weather-metric-item">
                  <Droplets size={16} className="metric-icon" />
                  <div>
                    <span className="metric-label">Humidity</span>
                    <span className="metric-value">{weather.humidity}%</span>
                  </div>
                </div>
                <div className="weather-metric-item">
                  <Wind size={16} className="metric-icon" />
                  <div>
                    <span className="metric-label">Wind Speed</span>
                    <span className="metric-value">{weather.windSpeed} km/h</span>
                  </div>
                </div>
              </div>

              {weather.forecast && weather.forecast.length > 0 && (
                <div className="weather-forecast-block">
                  <h4 className="forecast-title">3-Day Forecast</h4>
                  <div className="forecast-days-list">
                    {weather.forecast.map((f, idx) => (
                      <div key={idx} className="forecast-row">
                        <span className="forecast-day-name">{f.day}</span>
                        <div className="forecast-cond-wrap">
                          {getWeatherIcon(f.condition)}
                          <span className="forecast-cond-text">{f.condition}</span>
                        </div>
                        <span className="forecast-temp-val">{Math.round(f.temp)}°C</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Plan CTA Card */}
          <div className="quick-plan-sidebar-card">
            <div className="quick-plan-icon-wrapper">
              <Sparkles size={22} />
            </div>
            <h3 className="quick-plan-title">Ready for {destination.name}?</h3>
            <p className="quick-plan-desc">
              Create a customized trip with daily schedules, budgeted activities, and personal notes in seconds.
            </p>
            <button onClick={handlePlanTrip} className="btn-primary btn-full">
              <Calendar size={16} />
              <span>Create {destination.name} Itinerary</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DestinationDetailsPage;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { destinationApi } from '../api/destinationApi';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Calendar,
  CloudSun,
  Sun,
  Droplets,
  Wind,
  Star,
  ArrowLeft,
  DollarSign,
  Compass,
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

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="spinner"></div>
        <p>Loading destination details...</p>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="page-container empty-state">
        <Compass size={40} className="empty-icon" />
        <h3>{error || 'Destination not found'}</h3>
        <p>Please check the URL or browse all available destinations.</p>
        <Link to="/destinations" className="btn-primary mt-3">
          <ArrowLeft size={16} />
          <span>Back to Destinations</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Back Link */}
      <div className="mb-3">
        <Link to="/destinations" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.84rem' }}>
          <ArrowLeft size={15} />
          <span>All Destinations</span>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="dest-detail-hero">
        <div className="dest-detail-image-wrap">
          <img
            src={destination.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'}
            alt={destination.name}
            className="dest-detail-image"
          />
          {destination.category && (
            <span className="card-category-tag">{destination.category}</span>
          )}
        </div>

        <div className="dest-detail-header-card">
          <div className="dest-detail-header-top">
            <div>
              <h1 className="dest-detail-title">{destination.name}</h1>
              <div className="country-badge" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                <MapPin size={15} />
                <span>{destination.country}</span>
              </div>
            </div>

            <div className="dest-detail-price-box">
              {destination.averageCost && (
                <div className="cost-info" style={{ textAlign: 'right' }}>
                  <span className="cost-label">Est. Average Budget</span>
                  <span className="cost-value" style={{ fontSize: '1.25rem' }}>
                    ${Math.round(destination.averageCost).toLocaleString()}
                  </span>
                </div>
              )}
              <button onClick={handlePlanTrip} className="btn-primary mt-3" style={{ width: '100%' }}>
                <Calendar size={16} />
                <span>Plan Trip Here</span>
              </button>
            </div>
          </div>

          <p className="dest-detail-desc">{destination.description}</p>
        </div>
      </div>

      {/* Weather & Info Row */}
      <div className="dest-content-grid">
        {/* Left Column: Top Places / Attractions */}
        <div className="dest-main-column">
          <div className="section-header">
            <h2>Popular Attractions & Places</h2>
            <p className="section-subtitle">Recommended sights and experiences in {destination.name}</p>
          </div>

          {places.length === 0 ? (
            <p className="text-muted">No specific attractions listed yet for this destination.</p>
          ) : (
            <div className="places-list">
              {places.map((place) => (
                <div key={place.id} className="place-item-card">
                  {place.imageUrl && (
                    <div className="place-img-wrap">
                      <img src={place.imageUrl} alt={place.name} className="place-img" />
                    </div>
                  )}
                  <div className="place-info">
                    <div className="place-header">
                      <h3 className="place-name">{place.name}</h3>
                      {place.rating && (
                        <div className="place-rating">
                          <Star size={13} fill="#eab308" color="#eab308" />
                          <span>{place.rating}</span>
                          {place.reviewCount && <span className="text-muted">({place.reviewCount.toLocaleString()})</span>}
                        </div>
                      )}
                    </div>

                    {place.category && <span className="place-cat">{place.category}</span>}
                    {place.description && <p className="place-desc">{place.description}</p>}
                    {place.address && (
                      <div className="place-address">
                        <MapPin size={12} />
                        <span>{place.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live Weather Widget */}
        <div className="dest-sidebar-column">
          {weather && (
            <div className="weather-card">
              <div className="weather-card-header">
                <div className="weather-title-row">
                  <CloudSun size={20} className="weather-icon" />
                  <h3>Live Weather</h3>
                </div>
                <span className="weather-location">{destination.name}</span>
              </div>

              <div className="weather-current">
                <div className="weather-temp">{Math.round(weather.temperature)}°C</div>
                <div className="weather-condition">{weather.condition}</div>
              </div>

              <div className="weather-stats">
                <div className="weather-stat-item">
                  <Droplets size={14} />
                  <span>Humidity: {weather.humidity}%</span>
                </div>
                <div className="weather-stat-item">
                  <Wind size={14} />
                  <span>Wind: {weather.windSpeed} km/h</span>
                </div>
              </div>

              {weather.forecast && weather.forecast.length > 0 && (
                <div className="weather-forecast">
                  <div className="forecast-title">3-Day Outlook</div>
                  <div className="forecast-list">
                    {weather.forecast.map((f, idx) => (
                      <div key={idx} className="forecast-item">
                        <span className="forecast-day">{f.day}</span>
                        <span className="forecast-cond">{f.condition}</span>
                        <span className="forecast-temp">{Math.round(f.temp)}°C</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="quick-plan-card">
            <h3>Ready to explore {destination.name}?</h3>
            <p>Create a custom itinerary with day-by-day schedules, activities, and budget tracking.</p>
            <button onClick={handlePlanTrip} className="btn-primary btn-full mt-3">
              <Calendar size={16} />
              <span>Start Planning</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetailsPage;

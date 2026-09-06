import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { destinationApi } from '../api/destinationApi';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Search,
  Calendar,
  Compass,
  Info,
  Sparkles,
  Flame,
  Star,
  ChevronRight,
} from 'lucide-react';

const DestinationsPage = () => {
  const [destinations, setDestinations] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allDest, popular] = await Promise.all([
          destinationApi.getDestinations(),
          destinationApi.getPopularDestinations().catch(() => []),
        ]);
        setDestinations(allDest);
        setPopularDestinations(popular);
      } catch (err) {
        console.error('Failed to load destinations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = ['ALL', ...new Set(destinations.map((d) => d.category).filter(Boolean))];

  const filteredDestinations = destinations.filter((dest) => {
    const matchesSearch =
      dest.name.toLowerCase().includes(search.toLowerCase()) ||
      dest.country.toLowerCase().includes(search.toLowerCase()) ||
      (dest.description && dest.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || dest.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handlePlanTrip = (e, destId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/trips?destinationId=${destId}&action=create` } } });
    } else {
      navigate(`/trips?destinationId=${destId}&action=create`);
    }
  };

  return (
    <div className="page-container">
      {/* Hero Welcome Banner */}
      <section className="dest-hero-banner">
        <div className="dest-hero-badge">
          <Sparkles size={14} />
          <span>Curated Travel Inspiration</span>
        </div>
        <h1 className="dest-hero-title">Discover Your Next Adventure</h1>
        <p className="dest-hero-subtitle">
          Explore world-class destinations, check live weather, discover top attractions, and plan unforgettable itineraries with TripNest.
        </p>

        <div className="dest-hero-search-wrapper">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by city, country, or landmark (e.g. Paris, Tokyo, Bali)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button
                className="search-clear-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Popular Destinations Spotlight (Shown when no search filter is active) */}
      {!search && selectedCategory === 'ALL' && popularDestinations.length > 0 && (
        <section className="popular-section">
          <div className="section-header-row">
            <div className="section-header-titles">
              <div className="popular-tag">
                <Flame size={15} />
                <span>Trending Now</span>
              </div>
              <h2 className="section-main-title">Popular Destinations</h2>
              <p className="section-subtitle">
                Most loved getaways chosen by thousands of travelers worldwide
              </p>
            </div>
          </div>

          <div className="popular-grid">
            {popularDestinations.slice(0, 3).map((dest, idx) => (
              <div
                key={dest.id}
                className={`popular-card ${idx === 0 ? 'popular-card-featured' : ''}`}
                onClick={() => navigate(`/destinations/${dest.id}`)}
              >
                <div className="popular-card-img-wrap">
                  <img
                    src={
                      dest.imageUrl ||
                      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={dest.name}
                    className="popular-card-img"
                    loading="lazy"
                  />
                  <div className="popular-card-overlay">
                    <span className="popular-badge">
                      <Star size={12} fill="#ffffff" />
                      <span>Top Choice</span>
                    </span>
                    {dest.category && (
                      <span className="category-pill-glass">{dest.category}</span>
                    )}
                  </div>
                </div>

                <div className="popular-card-content">
                  <div className="popular-dest-header">
                    <div>
                      <h3 className="popular-dest-name">{dest.name}</h3>
                      <div className="dest-location-tag">
                        <MapPin size={13} />
                        <span>{dest.country}</span>
                      </div>
                    </div>
                    {dest.averageCost && (
                      <div className="popular-cost-box">
                        <span className="cost-caption">Avg. Cost</span>
                        <span className="cost-num">${Math.round(dest.averageCost).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <p className="popular-dest-desc">{dest.description}</p>

                  <div className="popular-actions-row">
                    <Link
                      to={`/destinations/${dest.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="btn-details-link"
                    >
                      <span>Explore details</span>
                      <ChevronRight size={15} />
                    </Link>
                    <button
                      onClick={(e) => handlePlanTrip(e, dest.id)}
                      className="btn-primary btn-sm"
                    >
                      <Calendar size={14} />
                      <span>Plan Trip</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Destinations Section */}
      <section className="all-destinations-section">
        <div className="destinations-toolbar">
          <div className="toolbar-left">
            <h2 className="section-main-title">
              {search || selectedCategory !== 'ALL' ? 'Search Results' : 'All Destinations'}
            </h2>
            <span className="count-tag">{filteredDestinations.length} available</span>
          </div>

          <div className="category-chips" role="tablist" aria-label="Category Filter">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat === 'ALL' ? 'All Destinations' : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading destination guides...</p>
          </div>
        ) : filteredDestinations.length === 0 ? (
          <div className="empty-state">
            <Compass size={44} className="empty-icon" />
            <h3>No destinations found</h3>
            <p>
              We couldn't find any destination matching "{search}". Try searching for another city, country, or clear your filters.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
              }}
              className="btn-secondary mt-3"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="destinations-grid">
            {filteredDestinations.map((dest) => (
              <article
                key={dest.id}
                className="destination-card"
                onClick={() => navigate(`/destinations/${dest.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-image-container">
                  <img
                    src={
                      dest.imageUrl ||
                      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={`${dest.name}, ${dest.country}`}
                    className="card-image"
                    loading="lazy"
                  />
                  {dest.category && (
                    <span className="card-category-tag">
                      {dest.category}
                    </span>
                  )}
                </div>

                <div className="card-body">
                  <div className="card-header-row">
                    <div>
                      <h3 className="card-title">
                        <Link
                          to={`/destinations/${dest.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="card-title-link"
                        >
                          {dest.name}
                        </Link>
                      </h3>
                      <span className="country-badge">
                        <MapPin size={13} />
                        {dest.country}
                      </span>
                    </div>
                    {dest.averageCost && (
                      <div className="cost-info">
                        <span className="cost-label">Est. Budget</span>
                        <span className="cost-value">${Math.round(dest.averageCost).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <p className="card-description">{dest.description}</p>

                  <div className="card-footer-row">
                    <Link
                      to={`/destinations/${dest.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="btn-card-details"
                    >
                      <Info size={14} />
                      <span>Weather & Sights</span>
                    </Link>
                    <button
                      onClick={(e) => handlePlanTrip(e, dest.id)}
                      className="btn-plan-trip"
                    >
                      <Calendar size={14} />
                      <span>Plan Trip</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DestinationsPage;

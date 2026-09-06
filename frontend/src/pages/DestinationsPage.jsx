import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { destinationApi } from '../api/destinationApi';
import { useAuth } from '../context/AuthContext';
import { MapPin, Search, Calendar, Compass, Info } from 'lucide-react';

const DestinationsPage = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const data = await destinationApi.getDestinations();
        setDestinations(data);
      } catch (err) {
        console.error('Failed to load destinations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
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
      <header className="destinations-header">
        <div className="destinations-header-content">
          <h1 className="page-title">Destinations</h1>
          <p className="page-subtitle">
            Explore handpicked destinations around the world and start crafting your itinerary.
          </p>
        </div>

        <div className="destinations-filter-toolbar">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by city, country, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat === 'ALL' ? 'All Places' : cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading destinations...</p>
        </div>
      ) : filteredDestinations.length === 0 ? (
        <div className="empty-state">
          <Compass size={40} className="empty-icon" />
          <h3>No matching destinations</h3>
          <p>Try refining your search term or selecting a different category filter.</p>
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
                    <h2 className="card-title">
                      <Link to={`/destinations/${dest.id}`} onClick={(e) => e.stopPropagation()} className="card-title-link">
                        {dest.name}
                      </Link>
                    </h2>
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

                <div className="card-footer-row" style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    to={`/destinations/${dest.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem' }}
                  >
                    <Info size={14} />
                    <span>Details & Weather</span>
                  </Link>
                  <button
                    onClick={(e) => handlePlanTrip(e, dest.id)}
                    className="btn-plan-trip"
                    style={{ flex: 1 }}
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
    </div>
  );
};

export default DestinationsPage;

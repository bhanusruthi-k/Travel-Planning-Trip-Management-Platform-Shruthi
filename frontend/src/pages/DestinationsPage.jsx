import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { destinationApi } from '../api/destinationApi';
import { useAuth } from '../context/AuthContext';
import { getDestinationPhotos } from '../utils/destinationGalleries';
import GalleryModal from '../components/GalleryModal';
import {
  MapPin,
  Search,
  Compass,
  Camera,
  Globe2,
  X,
  Plus,
  DollarSign,
  Images,
} from 'lucide-react';

const DestinationsPage = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Photo Gallery Lightbox state
  const [galleryModalState, setGalleryModalState] = useState({
    isOpen: false,
    destination: null,
    initialIndex: 0,
    photos: [],
  });

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const allDest = await destinationApi.getDestinations();
        setDestinations(allDest || []);
      } catch (err) {
        console.error('Failed to load destinations:', err);
        setError('Unable to load destinations. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = useMemo(() => {
    return ['ALL', ...new Set(destinations.map((d) => d.category).filter(Boolean))];
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        dest.name?.toLowerCase().includes(q) ||
        dest.country?.toLowerCase().includes(q) ||
        (dest.description && dest.description.toLowerCase().includes(q)) ||
        (dest.category && dest.category.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'ALL' || dest.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [destinations, search, selectedCategory]);

  const handlePlanTrip = (e, destId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/trips?destinationId=${destId}&action=create` } } });
    } else {
      navigate(`/trips?destinationId=${destId}&action=create`);
    }
  };

  const handleOpenGallery = (e, dest, index = 0) => {
    if (e) e.stopPropagation();
    const photos = getDestinationPhotos(dest);
    setGalleryModalState({
      isOpen: true,
      destination: dest,
      initialIndex: index,
      photos,
    });
  };

  const handleCloseGallery = () => {
    setGalleryModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="destinations-workspace-container">
      {/* 1. COMPACT DISCOVERY & SEARCH HEADER */}
      <section className="discovery-top-bar">
        <div className="discovery-header-row">
          <div className="discovery-title-area">
            <h1 className="page-main-heading">EXPLORE DESTINATIONS</h1>
            <p className="page-sub-heading">
              Find a place for your next trip.
            </p>
          </div>

          <div className="discovery-stats-badge">
            <Globe2 size={15} />
            <span>{destinations.length} Curated Locations</span>
          </div>
        </div>

        {/* Integrated Search & Filter Controls */}
        <div className="search-filter-command-bar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="search-input-form"
          >
            <div className="search-input-wrapper">
              <Search className="search-icon-fixed" size={18} />
              <input
                type="text"
                placeholder="Search destinations (e.g. Paris, Tokyo, Bali, Beach)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-field-input"
                aria-label="Search destinations"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <button type="submit" className="btn-search-submit">
              <Search size={15} />
              <span>Search</span>
            </button>
          </form>

          <div className="category-pill-group" role="tablist" aria-label="Destination Categories">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
                role="tab"
                aria-selected={selectedCategory === cat}
              >
                {cat === 'ALL' ? 'All Places' : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. LOADING STATE */}
      {loading ? (
        <div className="loading-grid-skeleton">
          <div className="destinations-uniform-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ height: '360px' }}></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="empty-results-box">
          <Compass size={40} className="empty-icon" />
          <h3>{error}</h3>
          <p>Please check your backend connection and try again.</p>
        </div>
      ) : filteredDestinations.length === 0 ? (
        <div className="empty-results-box">
          <Compass size={44} className="empty-icon" />
          <h3>No destinations matched "{search}"</h3>
          <p>Try searching for a different city, country, or selecting another category.</p>
          <button
            type="button"
            className="btn-primary-compact"
            onClick={() => {
              setSearch('');
              setSelectedCategory('ALL');
            }}
          >
            View All Destinations
          </button>
        </div>
      ) : (
        /* 3. SINGLE CONTINUOUS UNIFORM DESTINATIONS GRID */
        <section className="all-destinations-uniform-section">
          <div className="section-title-strip">
            <div>
              <h2 className="section-title">
                {search || selectedCategory !== 'ALL'
                  ? `Destinations (${filteredDestinations.length})`
                  : `All Destinations (${filteredDestinations.length})`}
              </h2>
              <p className="section-subtitle">
                Explore worldwide destinations. Click any card for details or photo icon to view gallery.
              </p>
            </div>
            {(search || selectedCategory !== 'ALL') && (
              <button
                type="button"
                className="btn-reset-filters"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="destinations-uniform-grid">
            {filteredDestinations.map((dest) => {
              const photos = getDestinationPhotos(dest);
              return (
                <div
                  key={dest.id}
                  className="destination-product-card"
                  onClick={() => navigate(`/destinations/${dest.id}`)}
                >
                  <div
                    className="dest-card-image-wrap"
                    onClick={(e) => handleOpenGallery(e, dest, 0)}
                    title="Click to view full-screen photo gallery"
                  >
                    <img
                      src={photos[0]?.url || dest.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
                      alt={dest.name}
                      className="dest-card-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <button
                      type="button"
                      className="dest-gallery-trigger-badge"
                      onClick={(e) => handleOpenGallery(e, dest, 0)}
                      title="Open photo gallery"
                      aria-label={`Open photo gallery for ${dest.name}`}
                    >
                      <Images size={13} /> {photos.length} Photos
                    </button>

                    {dest.category && (
                      <span className="dest-badge-category">{dest.category}</span>
                    )}
                  </div>

                  <div className="dest-card-content">
                    <div className="dest-card-header">
                      <h3 className="dest-card-title">{dest.name}</h3>
                      <span className="dest-card-country">
                        <MapPin size={13} /> {dest.country}
                      </span>
                    </div>

                    <p className="dest-card-desc">
                      {dest.description
                        ? dest.description.slice(0, 95) + (dest.description.length > 95 ? '...' : '')
                        : 'Explore iconic attractions, culture, and memorable experiences.'}
                    </p>

                    <div className="dest-card-footer">
                      <div className="dest-card-meta">
                        {dest.averageCost != null && (
                          <span className="meta-cost">
                            <DollarSign size={13} /> Avg: ₹{Number(dest.averageCost).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="dest-card-actions">
                        <button
                          type="button"
                          className="btn-card-gallery-icon"
                          onClick={(e) => handleOpenGallery(e, dest, 0)}
                          title="View Photo Gallery"
                          aria-label={`View photos of ${dest.name}`}
                        >
                          <Camera size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-plan-quick"
                          onClick={(e) => handlePlanTrip(e, dest.id)}
                          title="Plan a trip to this destination"
                        >
                          <Plus size={14} /> Plan Trip
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. FULL-SCREEN PHOTO GALLERY LIGHTBOX MODAL */}
      <GalleryModal
        isOpen={galleryModalState.isOpen}
        onClose={handleCloseGallery}
        destination={galleryModalState.destination}
        initialIndex={galleryModalState.initialIndex}
        photos={galleryModalState.photos}
      />
    </div>
  );
};

export default DestinationsPage;

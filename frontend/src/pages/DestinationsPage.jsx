import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Sparkles,
} from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'CITY', label: 'City' },
  { id: 'BEACH', label: 'Beach' },
  { id: 'NATURE', label: 'Nature' },
  { id: 'ADVENTURE', label: 'Adventure' },
  { id: 'CULTURE', label: 'Culture' },
  { id: 'WILDLIFE', label: 'Wildlife' },
  { id: 'ROMANTIC', label: 'Romantic' },
  { id: 'FOOD', label: 'Food' },
  { id: 'LUXURY', label: 'Luxury' },
  { id: 'MOUNTAINS', label: 'Mountains' },
  { id: 'ISLAND', label: 'Islands' },
  { id: 'HERITAGE', label: 'Heritage' },
  { id: 'WINTER', label: 'Winter' },
  { id: 'SPIRITUAL', label: 'Spiritual' },
];

const DestinationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'ALL');

  const [connectingMsg, setConnectingMsg] = useState('');

  // Photo Gallery Lightbox state
  const [galleryModalState, setGalleryModalState] = useState({
    isOpen: false,
    destination: null,
    initialIndex: 0,
    photos: [],
  });

  const { isAuthenticated, user, role } = useAuth();
  const isAdministrator = role === 'ADMINISTRATOR' || user?.role === 'ADMINISTRATOR';
  const navigate = useNavigate();

  // Sync state if URL searchParams change
  useEffect(() => {
    const urlCat = searchParams.get('category') || 'ALL';
    const urlSearch = searchParams.get('search') || '';
    setSelectedCategory(urlCat);
    setSearch(urlSearch);
  }, [searchParams]);

  const updateUrlParams = (cat, query) => {
    const newParams = {};
    if (cat && cat !== 'ALL') {
      newParams.category = cat;
    }
    if (query && query.trim()) {
      newParams.search = query.trim();
    }
    setSearchParams(newParams, { replace: true });
  };

  const fetchDestinations = useCallback(async (cat, query, retryAttempt = 0) => {
    const MAX_RETRIES = 3;
    setLoading(true);
    if (retryAttempt === 0) {
      setError('');
      setConnectingMsg('');
    }

    try {
      const params = {};
      if (cat && cat !== 'ALL') {
        params.category = cat;
      }
      if (query && query.trim()) {
        params.search = query.trim();
      }
      const data = await destinationApi.getDestinations(params);
      setDestinations(data || []);
      setError('');
      setConnectingMsg('');
    } catch (err) {
      console.error(`[DestinationsPage] Fetch attempt ${retryAttempt + 1} failed:`, err);
      
      const isNetworkOrStartupError = !err.response || err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK' || [502, 503, 504].includes(err.response?.status);

      if (isNetworkOrStartupError && retryAttempt < MAX_RETRIES) {
        setConnectingMsg(`Connecting to TripNest server... (attempt ${retryAttempt + 1} of ${MAX_RETRIES})`);
        setTimeout(() => {
          fetchDestinations(cat, query, retryAttempt + 1);
        }, 2000);
        return;
      }

      setConnectingMsg('');
      if (isNetworkOrStartupError) {
        setError('TripNest server is not running. Please start TripNest.');
      } else if (err.response?.status === 404) {
        setError('Destination service was not found.');
      } else if (err.response?.status >= 500) {
        setError("TripNest couldn't load destinations right now.");
      } else {
        setError('Unable to load destinations. Please check backend connection.');
      }
    } finally {
      if (retryAttempt === 0 || retryAttempt >= MAX_RETRIES) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch when category or search changes
  useEffect(() => {
    fetchDestinations(selectedCategory, search);
  }, [selectedCategory, search, fetchDestinations]);

  // Handle search submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    updateUrlParams(selectedCategory, search);
    fetchDestinations(selectedCategory, search);
  };

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    updateUrlParams(catId, search);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('ALL');
    setSearchParams({}, { replace: true });
  };

  const handlePlanTrip = (e, destId) => {
    e.stopPropagation();
    if (isAdministrator) return;
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
            <h1 className="page-main-heading">Explore Destinations</h1>
            <p className="page-sub-heading">
              Discover breathtaking locations, iconic landmarks, and curated getaways worldwide.
            </p>
          </div>

          <div className="discovery-stats-badge">
            <Globe2 size={15} />
            <span>{destinations.length} Curated Locations</span>
          </div>
        </div>

        {/* Integrated Search & Filter Controls */}
        <div className="search-filter-command-bar">
          <form onSubmit={handleSearchSubmit} className="search-input-form">
            <div className="search-input-wrapper">
              <Search className="search-icon-fixed" size={18} />
              <input
                type="text"
                placeholder="Search destinations by name, country, region, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-field-input"
                aria-label="Search destinations"
              />
              {search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearch('');
                    fetchDestinations(selectedCategory, '');
                  }}
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

          {/* Category Filter Tabs */}
          <div className="category-pill-group" role="tablist" aria-label="Destination Categories">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
                role="tab"
                aria-selected={selectedCategory === cat.id}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. LOADING & CONNECTING STATE */}
      {connectingMsg ? (
        <div className="empty-results-box" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ margin: '0 auto 16px', width: '36px', height: '36px', border: '3px solid var(--border-color, #e2e8f0)', borderTopColor: 'var(--color-primary, #BD4444)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '8px' }}>{connectingMsg}</h3>
          <p style={{ color: 'var(--text-muted)' }}>Waiting for TripNest backend services to initialize...</p>
        </div>
      ) : loading ? (
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
          <p>Please ensure the TripNest backend is running on port 8080.</p>
          <button
            type="button"
            className="btn-primary-compact"
            style={{ marginTop: '16px' }}
            onClick={() => fetchDestinations(selectedCategory, search, 0)}
          >
            Retry Connection
          </button>
        </div>
      ) : destinations.length === 0 ? (
        <div className="empty-results-box">
          <Compass size={44} className="empty-icon" />
          <h3>No destinations found for "{search || selectedCategory}"</h3>
          <p>Try searching for a different city, country, or selecting another travel category.</p>
          <button
            type="button"
            className="btn-primary-compact"
            onClick={handleClearFilters}
          >
            View All Destinations
          </button>
        </div>
      ) : (
        /* 3. CONTINUOUS UNIFORM DESTINATIONS GRID */
        <section className="all-destinations-uniform-section">
          <div className="section-title-strip">
            <div>
              <h2 className="section-title">
                {search || selectedCategory !== 'ALL'
                  ? `Destinations (${destinations.length})`
                  : `All Destinations (${destinations.length})`}
              </h2>
              <p className="section-subtitle">
                Explore worldwide destinations. Click any card for details or photo icon to view gallery.
              </p>
            </div>
            {(search || selectedCategory !== 'ALL') && (
              <button
                type="button"
                className="btn-reset-filters"
                onClick={handleClearFilters}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="destinations-uniform-grid">
            {destinations.map((dest) => {
              const photos = getDestinationPhotos(dest);
              const mainImg = dest.imageUrl || photos[0]?.url || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80';
              const photoCount = photos.length || 1;
              const photoBadgeText = photoCount === 1 ? '1 Photo' : `${photoCount} Photos`;

              return (
                <div
                  key={dest.id}
                  className="destination-product-card"
                  onClick={() => navigate(`/destinations/${dest.id}`)}
                >
                  <div
                    className="dest-card-image-wrap"
                    onClick={(e) => handleOpenGallery(e, dest, 0)}
                    title={`Click to view ${dest.name} photo gallery`}
                  >
                    <img
                      src={mainImg}
                      alt={`${dest.name}, ${dest.country} travel destination`}
                      className="dest-card-img"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      className="dest-gallery-trigger-badge"
                      onClick={(e) => handleOpenGallery(e, dest, 0)}
                      title={`Open photo gallery for ${dest.name}`}
                      aria-label={`Open photo gallery for ${dest.name}`}
                    >
                      <Images size={13} /> {photoBadgeText}
                    </button>

                    {dest.isPopular && (
                      <span className="dest-badge-popular">
                        <Sparkles size={11} /> Popular
                      </span>
                    )}

                    {dest.category && (
                      <span className="dest-badge-category">{dest.category}</span>
                    )}
                  </div>

                  <div className="dest-card-content">
                    <div className="dest-card-header">
                      <h3 className="dest-card-title">{dest.name}</h3>
                      <span className="dest-card-country">
                        <MapPin size={13} /> {dest.country} {dest.region ? `• ${dest.region}` : ''}
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
                        {!isAdministrator && (
                          <button
                            type="button"
                            className="btn-plan-quick"
                            onClick={(e) => handlePlanTrip(e, dest.id)}
                            title="Plan a trip to this destination"
                          >
                            <Plus size={14} /> Plan Trip
                          </button>
                        )}
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

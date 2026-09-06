import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { tripApi } from '../api/tripApi';
import { destinationApi } from '../api/destinationApi';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Compass,
  DollarSign,
  Briefcase,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destinationId: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'PLANNED',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCheckRef = useRef(false);

  const openCreateModal = (preselectedDestId = '', destList = destinations) => {
    setEditingTripId(null);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const currentDestList = destList && destList.length > 0 ? destList : destinations;
    const chosen = currentDestList.find((d) => String(d.id) === String(preselectedDestId));
    const defaultBudget = chosen?.averageCost ? String(chosen.averageCost) : '2000';

    setFormData({
      title: chosen ? `Trip to ${chosen.name}` : '',
      description: '',
      destinationId: preselectedDestId || (currentDestList[0]?.id ? String(currentDestList[0].id) : ''),
      startDate: today,
      endDate: nextWeek,
      budget: defaultBudget,
      status: 'PLANNED',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const fetchTripsAndDestinations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tripsData, destinationsData] = await Promise.all([
        tripApi.getTrips(),
        destinationApi.getDestinations(),
      ]);
      const validTrips = tripsData || [];
      const validDestinations = destinationsData || [];
      setTrips(validTrips);
      setDestinations(validDestinations);

      if (!initialCheckRef.current) {
        initialCheckRef.current = true;
        const queryDestId = searchParams.get('destinationId');
        const queryAction = searchParams.get('action');
        if (queryAction === 'create') {
          openCreateModal(queryDestId || '', validDestinations);
          setSearchParams({}, { replace: true });
        }
      }
    } catch (err) {
      console.error('Failed to load trips data:', err);
      setError('Unable to load trips. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  }, []); // Run on mount or when manually called

  useEffect(() => {
    fetchTripsAndDestinations();
  }, [fetchTripsAndDestinations]);

  // Lock body scrolling when modal is open to prevent background page scroll jitter
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  const handleEditTrip = (e, trip) => {
    e.stopPropagation();
    setEditingTripId(trip.id);
    setFormData({
      title: trip.title || '',
      description: trip.description || '',
      destinationId: trip.destination?.id ? String(trip.destination.id) : (trip.destinationId ? String(trip.destinationId) : ''),
      startDate: trip.startDate || '',
      endDate: trip.endDate || '',
      budget: trip.budget?.totalAmount ? String(trip.budget.totalAmount) : (trip.budget ? String(trip.budget) : ''),
      status: trip.status || 'PLANNED',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteTrip = async (e, tripId, tripTitle) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${tripTitle}"? This will also remove associated itinerary and expenses.`)) {
      try {
        await tripApi.deleteTrip(tripId);
        showToast('Trip deleted successfully', 'info');
        setTrips((prev) => prev.filter((t) => t.id !== tripId));
      } catch (err) {
        console.error('Failed to delete trip:', err);
        showToast('Failed to delete trip', 'error');
      }
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.title.trim()) {
      setModalError('Please enter a trip title.');
      return;
    }
    if (!formData.destinationId) {
      setModalError('Please select a destination.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setModalError('Please select valid start and end dates.');
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setModalError('Start date cannot be after end date.');
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        destinationId: Number(formData.destinationId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        budget: formData.budget ? Number(formData.budget) : undefined,
      };

      if (editingTripId) {
        await tripApi.updateTrip(editingTripId, payload);
        showToast('Trip updated successfully', 'success');
      } else {
        await tripApi.createTrip(payload);
        showToast('Trip created successfully!', 'success');
      }

      setIsModalOpen(false);
      fetchTripsAndDestinations();
    } catch (err) {
      console.error('Failed to save trip:', err);
      const msg = err.response?.data?.message || 'Failed to save trip. Please check your entries.';
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesStatus = statusFilter === 'ALL' || trip.status === statusFilter;
    const destName = trip.destination?.name || '';
    const matchesSearch =
      trip.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ONGOING':
        return <span className="status-badge ongoing">● Ongoing</span>;
      case 'COMPLETED':
        return <span className="status-badge completed">✓ Completed</span>;
      case 'CANCELLED':
        return <span className="status-badge cancelled">✕ Cancelled</span>;
      default:
        return <span className="status-badge planned">⏱ Planned</span>;
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return null;
    const diff = new Date(end) - new Date(start);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? `${days} Days` : '1 Day';
  };

  // Find upcoming or ongoing trip
  const featuredTrip = trips.find((t) => t.status === 'ONGOING') || trips.find((t) => t.status === 'PLANNED') || trips[0];

  return (
    <div className="trips-workspace-container">
      {/* 1. TOP HEADER & COMMAND BAR */}
      <div className="trips-top-header">
        <div className="trips-title-area">
          <h1 className="page-main-heading">My Trips Workspace</h1>
          <p className="page-sub-heading">
            Manage your personalized itineraries, activities, and travel budgets in one place.
          </p>
        </div>

        <button
          onClick={() => openCreateModal()}
          className="btn-primary-action"
        >
          <Plus size={16} /> Create New Trip
        </button>
      </div>

      {/* 2. STATS OVERVIEW STRIP */}
      {trips.length > 0 && (
        <div className="trips-metrics-strip">
          <div className="trip-metric-card">
            <span className="metric-label">Total Expeditions</span>
            <strong className="metric-val">{trips.length}</strong>
          </div>
          <div className="trip-metric-card">
            <span className="metric-label">Active / Ongoing</span>
            <strong className="metric-val">{trips.filter((t) => t.status === 'ONGOING').length}</strong>
          </div>
          <div className="trip-metric-card">
            <span className="metric-label">Planned</span>
            <strong className="metric-val">{trips.filter((t) => t.status === 'PLANNED').length}</strong>
          </div>
          <div className="trip-metric-card">
            <span className="metric-label">Completed</span>
            <strong className="metric-val">{trips.filter((t) => t.status === 'COMPLETED').length}</strong>
          </div>
        </div>
      )}

      {/* 3. SEARCH & STATUS FILTER STRIP */}
      {trips.length > 0 && (
        <div className="trips-filter-bar">
          <div className="trips-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search trips by title or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="trips-search-input"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="trips-status-pills">
            {['ALL', 'ONGOING', 'PLANNED', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                className={`status-filter-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'ALL' ? 'All Trips' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN TRIPS LIST & WORKSPACE */}
      {loading ? (
        <div className="trips-product-grid skeleton-trips-grid">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="trip-product-card skeleton-trip-card" aria-hidden="true">
              <div className="trip-card-image-wrap skeleton-pulse-box"></div>
              <div className="trip-card-content">
                <div className="skeleton-pulse-line title"></div>
                <div className="skeleton-pulse-line dest"></div>
                <div className="skeleton-pulse-line dates"></div>
                <div className="skeleton-pulse-line desc"></div>
                <div className="skeleton-pulse-line footer"></div>
              </div>
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        /* Empty State */
        <div className="empty-trips-workspace">
          <Briefcase size={48} className="empty-icon" />
          <h2>No Trips Planned Yet</h2>
          <p>
            Start your travel journey by creating your first trip or exploring our destination catalog.
          </p>
          <div className="empty-action-row">
            <button
              onClick={() => openCreateModal()}
              className="btn-primary-action"
            >
              <Plus size={16} /> Create Your First Trip
            </button>
            <Link to="/destinations" className="btn-secondary-action">
              <Compass size={16} /> Explore Destinations
            </Link>
          </div>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="empty-results-box">
          <AlertCircle size={36} className="empty-icon" />
          <h3>No trips matched your search criteria</h3>
          <button
            className="btn-primary-compact"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="trips-product-grid">
          {filteredTrips.map((trip) => {
            const dest = trip.destination || destinations.find((d) => d.id === trip.destinationId);
            const coverImg =
              dest?.imageUrl ||
              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={trip.id}
                className="trip-product-card"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <div className="trip-card-image-wrap">
                  <img
                    src={coverImg}
                    alt={trip.title}
                    className="trip-card-img"
                    loading="lazy"
                  />
                  <div className="trip-card-badge-overlay">
                    {getStatusBadge(trip.status)}
                  </div>
                </div>

                <div className="trip-card-content">
                  <div className="trip-card-header">
                    <h3 className="trip-card-title">{trip.title}</h3>
                    {dest && (
                      <span className="trip-card-dest">
                        <MapPin size={13} /> {dest.name}, {dest.country}
                      </span>
                    )}
                  </div>

                  <div className="trip-card-dates">
                    <Calendar size={14} className="date-icon" />
                    <span>
                      {trip.startDate} → {trip.endDate}
                    </span>
                    <span className="trip-duration-tag">
                      {calculateDays(trip.startDate, trip.endDate)}
                    </span>
                  </div>

                  {trip.description && (
                    <p className="trip-card-desc">
                      {trip.description.slice(0, 85) + (trip.description.length > 85 ? '...' : '')}
                    </p>
                  )}

                  <div className="trip-card-footer">
                    <div className="trip-card-budget">
                      {trip.budget?.totalAmount != null ? (
                        <span className="budget-tag">
                          <DollarSign size={13} /> Budget: ₹{Number(trip.budget.totalAmount).toLocaleString()}
                        </span>
                      ) : (
                        <span className="budget-tag-unset">No budget set</span>
                      )}
                    </div>

                    <div className="trip-card-actions">
                      <button
                        className="btn-card-icon"
                        onClick={(e) => handleEditTrip(e, trip)}
                        title="Edit Trip"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn-card-icon danger"
                        onClick={(e) => handleDeleteTrip(e, trip.id, trip.title)}
                        title="Delete Trip"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        className="btn-open-workspace"
                        onClick={() => navigate(`/trips/${trip.id}`)}
                      >
                        Open Workspace <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CREATE / EDIT TRIP MODAL */}
      {isModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !modalLoading && setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTripId ? 'Edit Trip Details' : 'Create New Trip'}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                disabled={modalLoading}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-scrollable">
              {modalError && (
                <div className="alert-box alert-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form id="trip-modal-form" onSubmit={handleModalSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="title">Trip Title *</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g. Summer Vacation in Tokyo"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="destinationId">Destination *</label>
                  <select
                    id="destinationId"
                    value={formData.destinationId}
                    onChange={(e) => {
                      const destId = e.target.value;
                      const chosen = destinations.find((d) => String(d.id) === String(destId));
                      setFormData({
                        ...formData,
                        destinationId: destId,
                        title: formData.title || (chosen ? `Trip to ${chosen.name}` : ''),
                      });
                    }}
                    required
                    className="form-select"
                  >
                    <option value="" disabled>
                      Select a destination
                    </option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date *</label>
                    <input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endDate">End Date *</label>
                    <input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Trip Status</label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="form-select"
                    >
                      <option value="PLANNED">Planned</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="budget">Total Allocated Budget (₹)</label>
                    <input
                      id="budget"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 50000"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Notes / Description (Optional)</label>
                  <textarea
                    id="description"
                    rows="3"
                    placeholder="Packing notes, flight numbers, or trip goals..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </form>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsModalOpen(false)}
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="trip-modal-form"
                className="btn-modal-submit"
                disabled={modalLoading}
              >
                {modalLoading ? 'Saving...' : editingTripId ? 'Update Trip' : 'Create Trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsPage;

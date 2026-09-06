import React, { useState, useEffect, useCallback } from 'react';
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
  ListTodo,
  Clock,
  Luggage,
  Sparkles,
} from 'lucide-react';

const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  const openCreateModal = useCallback((preselectedDestId = '', destList = destinations) => {
    setEditingTripId(null);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    
    // Find preselected destination default budget if available
    const chosen = destList.find((d) => String(d.id) === String(preselectedDestId));
    const defaultBudget = chosen?.averageCost ? String(chosen.averageCost) : '1500';

    setFormData({
      title: chosen ? `Trip to ${chosen.name}` : '',
      description: '',
      destinationId: preselectedDestId || (destList[0]?.id ? String(destList[0].id) : ''),
      startDate: today,
      endDate: nextWeek,
      budget: defaultBudget,
      status: 'PLANNED',
    });
    setModalError('');
    setIsModalOpen(true);
  }, [destinations]);

  const fetchTripsAndDestinations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tripsData, destinationsData] = await Promise.all([
        tripApi.getTrips(),
        destinationApi.getDestinations(),
      ]);
      setTrips(tripsData);
      setDestinations(destinationsData);

      const queryDestId = searchParams.get('destinationId');
      const queryAction = searchParams.get('action');
      if (queryAction === 'create' && queryDestId) {
        openCreateModal(queryDestId, destinationsData);
        setSearchParams({});
      }
    } catch (err) {
      console.error('Failed to load trips data:', err);
      setError('Unable to load trips. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  }, [searchParams, setSearchParams, openCreateModal]);

  useEffect(() => {
    fetchTripsAndDestinations();
  }, [fetchTripsAndDestinations]);

  const openEditModal = (e, trip) => {
    e.stopPropagation();
    setEditingTripId(trip.id);
    setFormData({
      title: trip.title,
      description: trip.description || '',
      destinationId: trip.destination ? String(trip.destination.id) : '',
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget ? String(trip.budget) : '',
      status: trip.status || 'PLANNED',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTripId(null);
    setModalError('');
  };

  const handleFormSubmit = async (e) => {
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
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setModalError('Start date cannot be after end date.');
      return;
    }

    setModalLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description,
        destinationId: parseInt(formData.destinationId, 10),
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: formData.status,
      };

      if (editingTripId) {
        await tripApi.updateTrip(editingTripId, payload);
        showToast('Trip updated successfully!', 'success');
      } else {
        await tripApi.createTrip(payload);
        showToast('New trip planned successfully!', 'success');
      }

      closeModal();
      await fetchTripsAndDestinations();
    } catch (err) {
      console.error('Failed to save trip:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error saving trip. Please try again.';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTrip = async (e, id, title) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await tripApi.deleteTrip(id);
        setTrips(trips.filter((t) => t.id !== id));
        showToast(`Trip "${title}" deleted`, 'info');
      } catch (err) {
        console.error('Failed to delete trip:', err);
        showToast(err.response?.data?.message || 'Failed to delete trip', 'error');
      }
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const diff = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    if (diff <= 1) return '1 Day';
    return `${diff} Days / ${diff - 1} Nights`;
  };

  const filteredTrips = trips.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ONGOING':
        return <span className="status-badge status-ongoing">Ongoing</span>;
      case 'COMPLETED':
        return <span className="status-badge status-completed">Completed</span>;
      case 'CANCELLED':
        return <span className="status-badge status-cancelled">Cancelled</span>;
      default:
        return <span className="status-badge status-planned">Planned</span>;
    }
  };

  const totalBudget = trips.reduce((sum, t) => sum + (t.budget || 0), 0);
  const plannedCount = trips.filter((t) => t.status === 'PLANNED').length;
  const ongoingCount = trips.filter((t) => t.status === 'ONGOING').length;
  const completedCount = trips.filter((t) => t.status === 'COMPLETED').length;
  const cancelledCount = trips.filter((t) => t.status === 'CANCELLED').length;

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="trips-header-section">
        <div className="trips-header-title-block">
          <div className="header-greeting-pill">
            <Luggage size={14} />
            <span>Travel Itinerary Dashboard</span>
          </div>
          <h1 className="page-title">My Trips & Adventures</h1>
          <p className="page-subtitle">
            Create itineraries, organize daily schedules, track trip budgets, and manage your bookings.
          </p>
        </div>
        <div className="trips-header-actions">
          <button onClick={() => openCreateModal()} className="btn-primary btn-create-trip">
            <Plus size={18} />
            <span>Plan New Trip</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="trips-stats-grid">
        <div className="trip-stat-card">
          <div className="stat-icon-wrapper stat-blue">
            <Compass size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{trips.length}</span>
            <span className="stat-label">Total Trips</span>
          </div>
        </div>

        <div className="trip-stat-card">
          <div className="stat-icon-wrapper stat-green">
            <Sparkles size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{ongoingCount}</span>
            <span className="stat-label">Active / Ongoing</span>
          </div>
        </div>

        <div className="trip-stat-card">
          <div className="stat-icon-wrapper stat-amber">
            <Calendar size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{plannedCount}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div>

        <div className="trip-stat-card">
          <div className="stat-icon-wrapper stat-purple">
            <DollarSign size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-number">${Math.round(totalBudget).toLocaleString()}</span>
            <span className="stat-label">Total Planned Budget</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="tabs-container" role="tablist" aria-label="Trip Status Filter">
        {[
          { key: 'ALL', label: 'All Trips', count: trips.length },
          { key: 'PLANNED', label: 'Planned', count: plannedCount },
          { key: 'ONGOING', label: 'Ongoing', count: ongoingCount },
          { key: 'COMPLETED', label: 'Completed', count: completedCount },
          { key: 'CANCELLED', label: 'Cancelled', count: cancelledCount },
        ].map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={statusFilter === tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`tab-btn ${statusFilter === tab.key ? 'active' : ''}`}
          >
            <span>{tab.label}</span>
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Trips Grid / List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your trips and itinerary schedules...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="empty-state">
          <Compass size={44} className="empty-icon" />
          <h3>No trips found</h3>
          <p>
            {statusFilter === 'ALL'
              ? 'You have not planned any trips yet. Pick a destination and start crafting your itinerary.'
              : `You have no trips currently marked as "${statusFilter.toLowerCase()}".`}
          </p>
          <button onClick={() => openCreateModal()} className="btn-primary mt-3">
            <Plus size={16} />
            <span>Create Your First Trip</span>
          </button>
        </div>
      ) : (
        <div className="trips-grid">
          {filteredTrips.map((trip) => (
            <article
              key={trip.id}
              className="trip-card"
              onClick={() => navigate(`/trips/${trip.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="trip-card-image-wrap">
                <img
                  src={
                    trip.destination?.imageUrl ||
                    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={trip.destination?.name || 'Trip Destination'}
                  className="trip-card-image"
                  loading="lazy"
                />
                <div className="trip-card-badges-overlay">
                  <div className="trip-card-status-badge">
                    {getStatusBadge(trip.status)}
                  </div>
                  {trip.startDate && trip.endDate && (
                    <span className="trip-duration-pill">
                      <Clock size={11} />
                      <span>{calculateDuration(trip.startDate, trip.endDate)}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="trip-card-body">
                <div className="trip-destination-row">
                  <MapPin size={13} />
                  <span>
                    {trip.destination ? `${trip.destination.name}, ${trip.destination.country}` : 'Custom Destination'}
                  </span>
                </div>

                <h2 className="trip-title">
                  <Link
                    to={`/trips/${trip.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="card-title-link"
                  >
                    {trip.title}
                  </Link>
                </h2>

                {trip.description && (
                  <p className="trip-desc">{trip.description}</p>
                )}

                <div className="trip-metadata">
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>
                      {trip.startDate} → {trip.endDate}
                    </span>
                  </div>

                  {trip.budget && (
                    <div className="meta-item">
                      <DollarSign size={14} />
                      <span>Budget: ${Math.round(trip.budget).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="trip-card-actions">
                  <Link
                    to={`/trips/${trip.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn-action btn-itinerary-action"
                    title="View & Manage Daily Schedule"
                  >
                    <ListTodo size={14} />
                    <span>Itinerary Schedule</span>
                  </Link>

                  <div className="trip-action-subgroup">
                    <button
                      onClick={(e) => openEditModal(e, trip)}
                      className="btn-action btn-edit-icon"
                      title="Edit Trip Details"
                      aria-label="Edit Trip"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteTrip(e, trip.id, trip.title)}
                      className="btn-action btn-delete-icon"
                      title="Delete Trip"
                      aria-label="Delete Trip"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create / Edit Trip Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-header">
              <h2 id="modal-title">{editingTripId ? 'Edit Trip Details' : 'Plan a New Trip'}</h2>
              <button onClick={closeModal} className="btn-close-modal" aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="alert-box alert-error mb-3">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="tripTitle">Trip Title *</label>
                <input
                  id="tripTitle"
                  type="text"
                  placeholder="e.g. 7-Day Romantic Holiday in Paris"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tripDestination">Destination *</label>
                <select
                  id="tripDestination"
                  value={formData.destinationId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const dest = destinations.find(d => String(d.id) === selectedId);
                    setFormData({
                      ...formData,
                      destinationId: selectedId,
                      title: formData.title || (dest ? `Trip to ${dest.name}` : ''),
                      budget: formData.budget || (dest?.averageCost ? String(dest.averageCost) : formData.budget),
                    });
                  }}
                  required
                  className="form-input form-select"
                >
                  <option value="">-- Select a Destination --</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}, {d.country} {d.category ? `(${d.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
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

                <div className="form-group half-width">
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
                <div className="form-group half-width">
                  <label htmlFor="tripBudget">Total Budget (USD)</label>
                  <input
                    id="tripBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 2500"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group half-width">
                  <label htmlFor="tripStatus">Trip Status</label>
                  <select
                    id="tripStatus"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-input form-select"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="tripDesc">Notes / Overview</label>
                <textarea
                  id="tripDesc"
                  rows={3}
                  placeholder="Flight information, hotel bookings, places you'd like to explore..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={modalLoading} className="btn-primary">
                  {modalLoading ? 'Saving...' : editingTripId ? 'Save Changes' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsPage;

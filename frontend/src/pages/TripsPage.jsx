import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { tripApi } from '../api/tripApi';
import { memberApi } from '../api/memberApi';
import { destinationApi } from '../api/destinationApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import DateRangePicker, { formatDisplayDate, calculateTripDays } from '../components/DateRangePicker';
import ConfirmModal from '../components/ConfirmModal';
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
  ArrowRight,
  Search,
  Heart,
  Users,
  Mail,
  Shield,
  UserCheck,
} from 'lucide-react';

const TripsPage = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteTripIds, setFavoriteTripIds] = useState(() => {
    try {
      const stored = localStorage.getItem('tripnest_favorite_trips');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

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
    invitedEmails: [],
  });
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [inviteEmailError, setInviteEmailError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Members state during edit
  const [existingMembers, setExistingMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirmTrip, setDeleteConfirmTrip] = useState(null);

  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCheckRef = useRef(false);

  const handleAddInvitee = () => {
    setInviteEmailError('');
    const email = inviteEmailInput.trim().toLowerCase();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setInviteEmailError('Please enter a valid email address.');
      return;
    }

    if (user?.email && email === user.email.toLowerCase()) {
      setInviteEmailError('You are the trip creator and will automatically be the owner.');
      return;
    }

    if (formData.invitedEmails && formData.invitedEmails.includes(email)) {
      setInviteEmailError('This email has already been added.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      invitedEmails: [...(prev.invitedEmails || []), email],
    }));
    setInviteEmailInput('');
  };

  const handleRemoveInvitee = (emailToRemove) => {
    setFormData((prev) => ({
      ...prev,
      invitedEmails: (prev.invitedEmails || []).filter((em) => em !== emailToRemove),
    }));
  };

  // Add Member immediately when in Edit mode
  const handleAddMemberInEdit = async () => {
    setInviteEmailError('');
    const email = inviteEmailInput.trim().toLowerCase();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setInviteEmailError('Please enter a valid email address.');
      return;
    }

    if (user?.email && email === user.email.toLowerCase()) {
      setInviteEmailError('You are the trip owner.');
      return;
    }

    if (
      existingMembers.some(
        (m) =>
          (m.user?.email && m.user.email.toLowerCase() === email) ||
          (m.email && m.email.toLowerCase() === email)
      )
    ) {
      setInviteEmailError('User is already a member of this trip.');
      return;
    }

    try {
      await memberApi.addMember(editingTripId, { email, role: 'MEMBER' });
      showToast('Member added successfully', 'success');
      setInviteEmailInput('');
      const updated = await memberApi.getMembers(editingTripId);
      setExistingMembers(updated || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to add member.';
      setInviteEmailError(msg);
    }
  };

  const handleRemoveMemberInEdit = async (memberUserId, memberName) => {
    try {
      await memberApi.removeMember(editingTripId, memberUserId);
      showToast('Member removed successfully', 'info');
      setExistingMembers((prev) =>
        prev.filter((m) => (m.user?.id || m.userId || m.id) !== memberUserId)
      );
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove member', 'error');
    }
  };

  const handleRoleChangeInEdit = async (memberUserId, newRole) => {
    try {
      await memberApi.updateMemberRole(editingTripId, memberUserId, { role: newRole });
      showToast('Member role updated successfully', 'success');
      const updated = await memberApi.getMembers(editingTripId);
      setExistingMembers(updated || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update member role', 'error');
    }
  };

  const openCreateModal = (preselectedDestId = '', destList = destinations) => {
    setEditingTripId(null);
    setInviteEmailInput('');
    setInviteEmailError('');
    setExistingMembers([]);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const currentDestList = destList && destList.length > 0 ? destList : destinations;
    const chosen = currentDestList.find((d) => String(d.id) === String(preselectedDestId));
    const defaultBudget = chosen?.averageCost ? String(chosen.averageCost) : '';

    setFormData({
      title: chosen ? `Trip to ${chosen.name}` : '',
      description: '',
      destinationId: preselectedDestId ? String(preselectedDestId) : '',
      startDate: today,
      endDate: nextWeek,
      budget: defaultBudget,
      status: 'PLANNED',
      invitedEmails: [],
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
    } catch (err) {
      console.error('Failed to load trips data:', err);
      setError('Unable to load trips. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTripsAndDestinations();
  }, [fetchTripsAndDestinations]);

  // Reactively open create trip modal whenever ?action=create is in search params
  useEffect(() => {
    const queryAction = searchParams.get('action');
    if (queryAction === 'create') {
      const queryDestId = searchParams.get('destinationId') || '';
      openCreateModal(queryDestId, destinations);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, destinations, setSearchParams]);

  // Lock body scrolling when modal is open
  useEffect(() => {
    if (isModalOpen || deleteConfirmTrip) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen, deleteConfirmTrip]);

  const handleEditTrip = async (e, trip) => {
    e.stopPropagation();
    setEditingTripId(trip.id);
    setInviteEmailInput('');
    setInviteEmailError('');
    setExistingMembers([]);
    setFormData({
      title: trip.title || '',
      description: trip.description || '',
      destinationId: trip.destination?.id
        ? String(trip.destination.id)
        : trip.destinationId
        ? String(trip.destinationId)
        : '',
      startDate: trip.startDate || '',
      endDate: trip.endDate || '',
      budget: trip.budget?.totalAmount
        ? String(trip.budget.totalAmount)
        : trip.budget
        ? String(trip.budget)
        : '',
      status: trip.status || 'PLANNED',
      invitedEmails: [],
    });
    setModalError('');
    setIsModalOpen(true);

    try {
      setLoadingMembers(true);
      const members = await memberApi.getMembers(trip.id);
      setExistingMembers(members || []);
    } catch (err) {
      console.error('Failed to load members for trip:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleDeleteTripClick = (e, tripId, tripTitle) => {
    e.stopPropagation();
    setDeleteConfirmTrip({ id: tripId, title: tripTitle });
  };

  const handleConfirmDeleteTrip = async () => {
    if (!deleteConfirmTrip) return;
    try {
      await tripApi.deleteTrip(deleteConfirmTrip.id);
      showToast('Trip deleted successfully', 'success');
      setTrips((prev) => prev.filter((t) => t.id !== deleteConfirmTrip.id));
      setDeleteConfirmTrip(null);
    } catch (err) {
      console.error('Failed to delete trip:', err);
      showToast('Failed to delete trip', 'error');
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
    if (formData.startDate > formData.endDate) {
      setModalError('Start date cannot be after end date.');
      return;
    }

    setModalLoading(true);
    try {
      const ownerEmail = user?.email ? user.email.toLowerCase().trim() : '';

      const candidateEmails = [...(formData.invitedEmails || [])];
      if (!editingTripId && inviteEmailInput && inviteEmailInput.trim()) {
        const pendingEmail = inviteEmailInput.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(pendingEmail) && !candidateEmails.includes(pendingEmail)) {
          candidateEmails.push(pendingEmail);
        }
      }

      const uniqueInvitedEmails = Array.from(
        new Set(
          candidateEmails
            .map((em) => em.trim().toLowerCase())
            .filter((em) => em.length > 0 && em !== ownerEmail)
        )
      );

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
        const createdTrip = await tripApi.createTrip(payload);
        const newTripId = createdTrip?.id;

        if (newTripId && uniqueInvitedEmails.length > 0) {
          const failedEmails = [];
          let successCount = 0;

          for (const email of uniqueInvitedEmails) {
            const memberPayload = { email, role: 'MEMBER' };
            try {
              await memberApi.addMember(newTripId, memberPayload);
              successCount++;
            } catch (invErr) {
              console.error(`[TripNest CreateTrip] Invitation failed for ${email}:`, invErr);
              failedEmails.push(email);
            }
          }

          if (failedEmails.length === 0) {
            showToast(
              uniqueInvitedEmails.length === 1
                ? 'Trip created and invitation sent!'
                : `Trip created and ${uniqueInvitedEmails.length} invitations sent!`,
              'success'
            );
          } else if (successCount > 0) {
            showToast(
              `Trip created! Invited ${successCount} member(s), but failed for: ${failedEmails.join(', ')}`,
              'warning'
            );
          } else {
            showToast(
              `Trip created, but invitations could not be sent to: ${failedEmails.join(', ')}`,
              'warning'
            );
          }
        } else {
          showToast('Trip created successfully', 'success');
        }
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

  const handleToggleFavorite = (e, tripId) => {
    e.stopPropagation();
    const isFav = favoriteTripIds.has(tripId);
    const next = new Set(favoriteTripIds);
    if (isFav) {
      next.delete(tripId);
      showToast('Removed from favorites', 'info');
    } else {
      next.add(tripId);
      showToast('Added to favorites', 'success');
    }
    setFavoriteTripIds(next);
    try {
      localStorage.setItem('tripnest_favorite_trips', JSON.stringify([...next]));
    } catch (err) {}
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'FAVORITES'
        ? favoriteTripIds.has(trip.id)
        : trip.status === statusFilter;

    const q = searchQuery.toLowerCase().trim();
    const dest = trip.destination || destinations.find((d) => d.id === trip.destinationId);
    const matchesQuery =
      !q ||
      trip.title?.toLowerCase().includes(q) ||
      trip.description?.toLowerCase().includes(q) ||
      dest?.name?.toLowerCase().includes(q) ||
      dest?.country?.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ONGOING':
        return <span className="trip-status-chip ongoing">Ongoing</span>;
      case 'COMPLETED':
        return <span className="trip-status-chip completed">Completed</span>;
      case 'CANCELLED':
        return <span className="trip-status-chip cancelled">Cancelled</span>;
      default:
        return <span className="trip-status-chip planned">Planned</span>;
    }
  };

  const getCardImage = (trip) => {
    if (trip.destination?.imageUrl) return trip.destination.imageUrl;
    const dest = destinations.find((d) => d.id === trip.destinationId);
    if (dest?.imageUrl) return dest.imageUrl;
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
  };

  return (
    <div className="trips-workspace-container">
      {/* 1. TOP HEADER & PRIMARY ACTION */}
      <div className="trips-page-header">
        <div>
          <h1 className="trips-page-title">My Travel Journeys</h1>
          <p className="trips-page-subtitle">
            Plan, organize, and manage your upcoming, ongoing, and completed trip itineraries.
          </p>
        </div>
        <button
          type="button"
          className="btn-create-trip-main"
          onClick={() => openCreateModal()}
        >
          <Plus size={16} /> New Trip
        </button>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="trips-toolbar-panel">
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
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="trips-filter-tabs" role="tablist">
          {['ALL', 'PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'FAVORITES'].map((st) => (
            <button
              key={st}
              type="button"
              role="tab"
              aria-selected={statusFilter === st}
              className={`filter-tab-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'FAVORITES' ? (
                <>
                  <Heart size={13} className="tab-icon" /> Favorites ({favoriteTripIds.size})
                </>
              ) : (
                st.charAt(0) + st.slice(1).toLowerCase()
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. TRIPS GRID OR EMPTY STATES */}
      {loading ? (
        <div className="trips-skeleton-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="trip-skeleton-card">
              <div className="skeleton-img"></div>
              <div className="skeleton-body">
                <div className="skeleton-line long"></div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line short"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="trips-error-banner" role="alert">
          <AlertCircle size={24} />
          <div>
            <h3>Error Loading Trips</h3>
            <p>{error}</p>
            <button onClick={fetchTripsAndDestinations} className="btn-retry-load">
              Retry
            </button>
          </div>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="trips-empty-state-box">
          <div className="empty-state-illustration">
            <Compass size={48} />
          </div>
          <h3 className="empty-title">
            {searchQuery || statusFilter !== 'ALL' ? 'No matching trips found' : 'No trips yet'}
          </h3>
          <p className="empty-desc">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your search query or status filter above to find your trips.'
              : 'Start your travel planning journey by creating your first trip.'}
          </p>
          <div className="empty-actions-row">
            <button
              type="button"
              className="btn-create-trip-main"
              onClick={() => openCreateModal()}
            >
              <Plus size={16} /> Create Trip
            </button>
            <button
              type="button"
              className="btn-clear-filters"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="trips-product-grid">
          {filteredTrips.map((trip) => {
            const dest = trip.destination || destinations.find((d) => d.id === trip.destinationId);
            const coverImg = getCardImage(trip);
            const duration = calculateTripDays(trip.startDate, trip.endDate);
            const isFav = favoriteTripIds.has(trip.id);

            return (
              <div
                key={trip.id}
                className="trip-product-card"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                {/* 16:9 Aspect Ratio Image Wrap */}
                <div className="trip-card-image-wrap">
                  <img
                    src={coverImg}
                    alt={trip.title}
                    className="trip-card-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="trip-card-badge-overlay">
                    {getStatusBadge(trip.status)}
                  </div>

                  {/* Accessible Favorite Heart Button */}
                  <button
                    type="button"
                    className={`trip-card-favorite-btn ${isFav ? 'active' : ''}`}
                    onClick={(e) => handleToggleFavorite(e, trip.id)}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart
                      size={15}
                      className={`trip-heart-icon ${isFav ? 'favorited' : ''}`}
                      fill={isFav ? '#ef4444' : 'none'}
                      color={isFav ? '#ef4444' : '#ffffff'}
                    />
                  </button>
                </div>

                {/* Card Body */}
                <div className="trip-card-content">
                  <div className="trip-card-header">
                    <h3 className="trip-card-title">{trip.title}</h3>
                    {dest && (
                      <span className="trip-card-dest">
                        <MapPin size={13} /> {dest.name}, {dest.country}
                      </span>
                    )}
                  </div>

                  {/* Dates & Duration Badge */}
                  <div className="trip-card-dates-row">
                    <div className="trip-dates-text">
                      <Calendar size={13} className="date-icon" />
                      <span>
                        {formatDisplayDate(trip.startDate)} — {formatDisplayDate(trip.endDate)}
                      </span>
                    </div>
                    {duration > 0 && (
                      <span className="trip-duration-badge">
                        {duration} {duration === 1 ? 'day' : 'days'}
                      </span>
                    )}
                  </div>

                  <div className="trip-card-divider"></div>

                  {/* Budget & Actions */}
                  <div className="trip-card-footer">
                    <div className="trip-card-budget">
                      <span className="budget-label">Budget</span>
                      {trip.budget?.totalAmount != null ? (
                        <span className="budget-val">
                          ₹{Number(trip.budget.totalAmount).toLocaleString()} planned
                        </span>
                      ) : trip.budget != null && trip.budget !== '' ? (
                        <span className="budget-val">
                          ₹{Number(trip.budget).toLocaleString()} planned
                        </span>
                      ) : (
                        <span className="budget-val unset">No budget set</span>
                      )}
                    </div>

                    <div className="trip-card-actions">
                      <button
                        type="button"
                        className="btn-card-icon"
                        onClick={(e) => handleEditTrip(e, trip)}
                        title="Edit Trip"
                        aria-label="Edit Trip"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-card-icon danger"
                        onClick={(e) => handleDeleteTripClick(e, trip.id, trip.title)}
                        title="Delete Trip"
                        aria-label="Delete Trip"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-open-trip"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/trips/${trip.id}`);
                        }}
                      >
                        Open Trip <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. CREATE / EDIT TRIP MODAL */}
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
                      -- Select a destination --
                    </option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.country}) {d.region ? `— ${d.region}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modern Custom Date Range Picker */}
                <div className="form-group">
                  <label>Trip Dates *</label>
                  <DateRangePicker
                    startDate={formData.startDate}
                    endDate={formData.endDate}
                    onChange={({ startDate, endDate }) => {
                      setFormData((prev) => ({
                        ...prev,
                        startDate,
                        endDate,
                      }));
                    }}
                  />
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

                {/* People / Members Section (Supported in both Create and Edit modes) */}
                <div className="form-group form-invite-members-group">
                  <label className="form-label-with-badge">
                    <Users size={15} /> People / Trip Members
                  </label>
                  <p className="form-help-text">
                    {editingTripId
                      ? 'Manage existing members and invite fellow travelers.'
                      : 'Invite friends or fellow travelers to this trip by email.'}
                  </p>

                  {/* Add Member Input Row */}
                  <div className="invite-input-row">
                    <div className="input-with-icon">
                      <Mail size={16} className="field-icon" />
                      <input
                        type="email"
                        placeholder="Enter email address (e.g. friend@example.com)"
                        value={inviteEmailInput}
                        onChange={(e) => {
                          setInviteEmailInput(e.target.value);
                          if (inviteEmailError) setInviteEmailError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (editingTripId) {
                              handleAddMemberInEdit();
                            } else {
                              handleAddInvitee();
                            }
                          }
                        }}
                        className="form-input with-icon"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={editingTripId ? handleAddMemberInEdit : handleAddInvitee}
                      className="btn-add-invitee"
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>

                  {inviteEmailError && (
                    <span className="invite-error-msg">{inviteEmailError}</span>
                  )}

                  {/* Edit Mode: Show Existing Members */}
                  {editingTripId && existingMembers.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <span className="chip-list-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Current Trip Members ({existingMembers.length}):
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {existingMembers.map((m) => {
                          const mUser = m.user || {};
                          const mEmail = mUser.email || m.email;
                          const mName = mUser.fullName || mEmail?.split('@')[0] || 'Member';
                          const isOwner = m.role === 'OWNER';
                          const userId = mUser.id || m.userId || m.id;

                          return (
                            <div
                              key={m.id || userId}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                backgroundColor: 'var(--bg-secondary, #f8fafc)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    backgroundColor: isOwner ? 'rgba(2, 132, 199, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                    color: isOwner ? '#0284c7' : '#475569',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                  }}
                                >
                                  {mName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {mName} {isOwner && <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 700 }}>(Owner)</span>}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mEmail}</div>
                                </div>
                              </div>

                              {!isOwner && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <select
                                    value={m.role}
                                    onChange={(e) => handleRoleChangeInEdit(userId, e.target.value)}
                                    style={{
                                      fontSize: '0.78rem',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-color)',
                                      backgroundColor: 'var(--bg-surface)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <option value="MEMBER">Member</option>
                                    <option value="GROUP_ADMIN">Group Admin</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMemberInEdit(userId, mName)}
                                    title="Remove member"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Create Mode: Show Staged Invitees */}
                  {!editingTripId && formData.invitedEmails && formData.invitedEmails.length > 0 && (
                    <div className="invitees-chip-list">
                      <span className="chip-list-label">
                        People invited ({formData.invitedEmails.length}):
                      </span>
                      <div className="chips-wrap">
                        {formData.invitedEmails.map((email) => (
                          <span key={email} className="invitee-chip">
                            <span className="chip-email">{email}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveInvitee(email)}
                              className="chip-remove-btn"
                              title={`Remove ${email}`}
                              aria-label={`Remove ${email}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* 5. CONFIRM DELETE TRIP MODAL */}
      <ConfirmModal
        isOpen={!!deleteConfirmTrip}
        title="Delete Trip?"
        message={
          deleteConfirmTrip
            ? `Are you sure you want to delete "${deleteConfirmTrip.title}"?\n\nThis will permanently remove the trip and its associated itinerary and expenses.`
            : ''
        }
        confirmText="Delete Trip"
        cancelText="Cancel"
        danger={true}
        onConfirm={handleConfirmDeleteTrip}
        onCancel={() => setDeleteConfirmTrip(null)}
      />
    </div>
  );
};

export default TripsPage;

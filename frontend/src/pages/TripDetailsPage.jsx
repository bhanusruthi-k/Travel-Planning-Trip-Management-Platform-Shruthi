import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tripApi } from '../api/tripApi';
import { itineraryApi } from '../api/itineraryApi';
import {
  Calendar,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  ArrowLeft,
  AlertCircle,
  X,
  Compass,
} from 'lucide-react';

const TripDetailsPage = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Day Modal
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [dayFormData, setDayFormData] = useState({ dayNumber: 1, title: '', date: '' });
  const [dayModalLoading, setDayModalLoading] = useState(false);

  // Activity Modal
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [activityFormData, setActivityFormData] = useState({
    time: '',
    title: '',
    description: '',
    location: '',
    cost: '',
  });
  const [activityModalLoading, setActivityModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const navigate = useNavigate();

  const loadTripAndItinerary = async () => {
    setLoading(true);
    setError('');
    try {
      const [tripData, daysData] = await Promise.all([
        tripApi.getTripById(id),
        itineraryApi.getItineraryForTrip(id),
      ]);
      setTrip(tripData);
      setDays(daysData);
    } catch (err) {
      console.error('Failed to load trip details:', err);
      setError(err.response?.data?.message || 'Trip not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTripAndItinerary();
  }, [id]);

  // Day handlers
  const openAddDayModal = () => {
    const nextDayNum = days.length + 1;
    let nextDate = '';
    if (trip?.startDate) {
      const d = new Date(trip.startDate);
      d.setDate(d.getDate() + (nextDayNum - 1));
      nextDate = d.toISOString().split('T')[0];
    }
    setDayFormData({
      dayNumber: nextDayNum,
      title: `Day ${nextDayNum}`,
      date: nextDate,
    });
    setModalError('');
    setIsDayModalOpen(true);
  };

  const handleAddDaySubmit = async (e) => {
    e.preventDefault();
    setDayModalLoading(true);
    setModalError('');
    try {
      await itineraryApi.addDay(id, {
        dayNumber: parseInt(dayFormData.dayNumber, 10),
        title: dayFormData.title,
        date: dayFormData.date || null,
      });
      setIsDayModalOpen(false);
      await loadTripAndItinerary();
    } catch (err) {
      console.error('Failed to add itinerary day:', err);
      setModalError(err.response?.data?.message || 'Failed to add day.');
    } finally {
      setDayModalLoading(false);
    }
  };

  const handleDeleteDay = async (dayId, dayTitle) => {
    if (window.confirm(`Delete "${dayTitle}" and all its activities?`)) {
      try {
        await itineraryApi.deleteDay(id, dayId);
        setDays(days.filter((d) => d.id !== dayId));
      } catch (err) {
        console.error('Failed to delete day:', err);
        alert(err.response?.data?.message || 'Failed to delete day.');
      }
    }
  };

  // Activity handlers
  const openAddActivityModal = (dayId) => {
    setSelectedDayId(dayId);
    setEditingActivityId(null);
    setActivityFormData({
      time: '10:00 AM',
      title: '',
      description: '',
      location: '',
      cost: '',
    });
    setModalError('');
    setIsActivityModalOpen(true);
  };

  const openEditActivityModal = (dayId, act) => {
    setSelectedDayId(dayId);
    setEditingActivityId(act.id);
    setActivityFormData({
      time: act.time || '',
      title: act.title,
      description: act.description || '',
      location: act.location || '',
      cost: act.cost ? String(act.cost) : '',
    });
    setModalError('');
    setIsActivityModalOpen(true);
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (!activityFormData.title.trim()) {
      setModalError('Activity title is required.');
      return;
    }

    setActivityModalLoading(true);
    setModalError('');

    try {
      const payload = {
        time: activityFormData.time,
        title: activityFormData.title.trim(),
        description: activityFormData.description,
        location: activityFormData.location,
        cost: activityFormData.cost ? parseFloat(activityFormData.cost) : null,
      };

      if (editingActivityId) {
        await itineraryApi.updateActivity(editingActivityId, payload);
      } else {
        await itineraryApi.addActivity(selectedDayId, payload);
      }

      setIsActivityModalOpen(false);
      await loadTripAndItinerary();
    } catch (err) {
      console.error('Failed to save activity:', err);
      setModalError(err.response?.data?.message || 'Failed to save activity.');
    } finally {
      setActivityModalLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId, activityTitle) => {
    if (window.confirm(`Delete activity "${activityTitle}"?`)) {
      try {
        await itineraryApi.deleteActivity(activityId);
        await loadTripAndItinerary();
      } catch (err) {
        console.error('Failed to delete activity:', err);
        alert(err.response?.data?.message || 'Failed to delete activity.');
      }
    }
  };

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

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="spinner"></div>
        <p>Loading your itinerary...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="page-container empty-state">
        <Compass size={40} className="empty-icon" />
        <h3>{error || 'Trip not found'}</h3>
        <p>You may not have permission to view this trip or it does not exist.</p>
        <Link to="/trips" className="btn-primary mt-3">
          <ArrowLeft size={16} />
          <span>Back to My Trips</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Back button */}
      <div className="mb-3">
        <Link to="/trips" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.84rem' }}>
          <ArrowLeft size={15} />
          <span>Back to Trips</span>
        </Link>
      </div>

      {/* Trip Overview Card */}
      <div className="trip-overview-card">
        <div className="trip-overview-content">
          <div className="trip-overview-header">
            <div>
              <div className="trip-dest-badge">
                <MapPin size={14} />
                <span>{trip.destination ? `${trip.destination.name}, ${trip.destination.country}` : 'Custom Destination'}</span>
              </div>
              <h1 className="trip-overview-title">{trip.title}</h1>
            </div>
            <div>{getStatusBadge(trip.status)}</div>
          </div>

          {trip.description && <p className="trip-overview-desc">{trip.description}</p>}

          <div className="trip-overview-meta-row">
            <div className="overview-meta-item">
              <Calendar size={16} />
              <span>{trip.startDate} — {trip.endDate}</span>
            </div>
            {trip.budget && (
              <div className="overview-meta-item">
                <DollarSign size={16} />
                <span>Budget: ${Math.round(trip.budget).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Itinerary Section */}
      <div className="itinerary-section">
        <div className="itinerary-section-header">
          <div>
            <h2>Trip Itinerary & Daily Schedule</h2>
            <p className="section-subtitle">Plan activities, sightseeing stops, and dining day by day.</p>
          </div>
          <button onClick={openAddDayModal} className="btn-primary">
            <Plus size={16} />
            <span>Add Day</span>
          </button>
        </div>

        {days.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '20px' }}>
            <Calendar size={36} className="empty-icon" />
            <h3>No days added yet</h3>
            <p>Start organizing your trip by adding Day 1 to your schedule.</p>
            <button onClick={openAddDayModal} className="btn-primary mt-3">
              <Plus size={15} />
              <span>Add Day 1</span>
            </button>
          </div>
        ) : (
          <div className="itinerary-timeline">
            {days.map((day) => (
              <div key={day.id} className="itinerary-day-card">
                <div className="day-card-header">
                  <div className="day-header-left">
                    <span className="day-badge">Day {day.dayNumber}</span>
                    <h3 className="day-title">{day.title}</h3>
                    {day.date && <span className="day-date">({day.date})</span>}
                  </div>
                  <div className="day-header-actions">
                    <button
                      onClick={() => openAddActivityModal(day.id)}
                      className="btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                    >
                      <Plus size={13} />
                      <span>Add Activity</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDay(day.id, day.title)}
                      className="btn-delete"
                      style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                      title="Delete this day"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Activities List */}
                <div className="activities-list">
                  {!day.activities || day.activities.length === 0 ? (
                    <div className="no-activities">
                      <span>No activities scheduled for this day yet.</span>
                      <button
                        onClick={() => openAddActivityModal(day.id)}
                        className="btn-inline-add"
                      >
                        + Add first activity
                      </button>
                    </div>
                  ) : (
                    day.activities.map((act) => (
                      <div key={act.id} className="activity-row">
                        <div className="activity-time-col">
                          <Clock size={13} />
                          <span>{act.time || 'Anytime'}</span>
                        </div>
                        <div className="activity-body-col">
                          <div className="activity-title-row">
                            <h4 className="activity-title">{act.title}</h4>
                            {act.cost && (
                              <span className="activity-cost">${Math.round(act.cost)}</span>
                            )}
                          </div>
                          {act.location && (
                            <div className="activity-location">
                              <MapPin size={12} />
                              <span>{act.location}</span>
                            </div>
                          )}
                          {act.description && (
                            <p className="activity-desc">{act.description}</p>
                          )}
                        </div>
                        <div className="activity-actions-col">
                          <button
                            onClick={() => openEditActivityModal(day.id, act)}
                            className="btn-act-icon"
                            title="Edit Activity"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(act.id, act.title)}
                            className="btn-act-icon btn-act-delete"
                            title="Delete Activity"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Day Modal */}
      {isDayModalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsDayModalOpen(false); }}>
          <div className="modal-container" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>Add Itinerary Day</h2>
              <button onClick={() => setIsDayModalOpen(false)} className="btn-close-modal">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="alert-box alert-error mb-3">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddDaySubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="dayNum">Day Number *</label>
                  <input
                    id="dayNum"
                    type="number"
                    min="1"
                    value={dayFormData.dayNumber}
                    onChange={(e) => setDayFormData({ ...dayFormData, dayNumber: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group half-width">
                  <label htmlFor="dayDate">Date</label>
                  <input
                    id="dayDate"
                    type="date"
                    value={dayFormData.date}
                    onChange={(e) => setDayFormData({ ...dayFormData, date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dayTitle">Day Title</label>
                <input
                  id="dayTitle"
                  type="text"
                  placeholder="e.g. Arrival & Eiffel Tower Exploration"
                  value={dayFormData.title}
                  onChange={(e) => setDayFormData({ ...dayFormData, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsDayModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={dayModalLoading} className="btn-primary">
                  {dayModalLoading ? 'Adding...' : 'Add Day'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Activity Modal */}
      {isActivityModalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsActivityModalOpen(false); }}>
          <div className="modal-container" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2>{editingActivityId ? 'Edit Activity' : 'Add Activity'}</h2>
              <button onClick={() => setIsActivityModalOpen(false)} className="btn-close-modal">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="alert-box alert-error mb-3">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleActivitySubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="actTitle">Activity Title *</label>
                <input
                  id="actTitle"
                  type="text"
                  placeholder="e.g. Louvre Museum Guided Tour"
                  value={activityFormData.title}
                  onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="actTime">Time / Period</label>
                  <input
                    id="actTime"
                    type="text"
                    placeholder="e.g. 10:00 AM or Morning"
                    value={activityFormData.time}
                    onChange={(e) => setActivityFormData({ ...activityFormData, time: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group half-width">
                  <label htmlFor="actCost">Est. Cost (USD)</label>
                  <input
                    id="actCost"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25"
                    value={activityFormData.cost}
                    onChange={(e) => setActivityFormData({ ...activityFormData, cost: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="actLocation">Location / Address</label>
                <input
                  id="actLocation"
                  type="text"
                  placeholder="e.g. Rue de Rivoli, 75001 Paris"
                  value={activityFormData.location}
                  onChange={(e) => setActivityFormData({ ...activityFormData, location: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="actDesc">Description / Notes</label>
                <textarea
                  id="actDesc"
                  rows={3}
                  placeholder="Tickets booked, meeting point at Pyramid entrance..."
                  value={activityFormData.description}
                  onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
                  className="form-input form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsActivityModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={activityModalLoading} className="btn-primary">
                  {activityModalLoading ? 'Saving...' : editingActivityId ? 'Save Changes' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetailsPage;

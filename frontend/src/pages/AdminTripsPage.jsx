import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Briefcase,
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  DollarSign,
} from 'lucide-react';
import { tripApi } from '../api/tripApi';

const AdminTripsPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await tripApi.getTrips();
      setTrips(data || []);
    } catch (err) {
      console.error('Failed to load platform trips:', err);
      setError('Unable to load platform trips. Please verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'ONGOING':
        return 'status-active';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'PLANNED':
      default:
        return 'status-planned';
    }
  };

  return (
    <div className="dashboard-page-container">
      {/* 1. ADMIN HEADER WITH BACK BUTTON */}
      <div className="admin-header-strip">
        <div className="admin-header-title-group">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="btn-back-link"
            style={{ marginBottom: '12px' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="admin-badge-pill">
            <Shield size={14} />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="admin-main-heading">Total Platform Trips</h1>
          <p className="admin-sub-heading">
            Overview of all trips and travel expeditions created across the platform.
          </p>
        </div>

        <div className="discovery-stats-badge" style={{ alignSelf: 'flex-start' }}>
          <Briefcase size={16} />
          <span>{trips.length} Expeditions</span>
        </div>
      </div>

      {/* 2. CONTENT AREA */}
      {loading ? (
        <div className="dashboard-skeleton-layout" style={{ marginTop: '24px' }}>
          <div className="skeleton-panel-box large" style={{ minHeight: '300px' }}></div>
        </div>
      ) : error ? (
        <div className="dashboard-error-banner" style={{ marginTop: '24px' }}>
          <AlertTriangle size={28} />
          <div>
            <h3>Failed to load trips</h3>
            <p>{error}</p>
          </div>
          <button onClick={fetchTrips} className="btn-retry">
            Try Again
          </button>
        </div>
      ) : trips.length === 0 ? (
        <div className="empty-results-box" style={{ marginTop: '24px' }}>
          <Briefcase size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <h3>No Platform Trips Found</h3>
          <p>No trips have been created on the platform yet.</p>
        </div>
      ) : (
        <div className="dashboard-card-widget" style={{ marginTop: '24px' }}>
          <div className="admin-dest-table-wrap">
            <table className="admin-dest-table">
              <thead>
                <tr>
                  <th>Trip Title</th>
                  <th>Traveler / Owner</th>
                  <th>Destination</th>
                  <th>Dates</th>
                  <th>Budget</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong className="dest-table-name">{t.title}</strong>
                      {t.description && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description}
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                        <User size={13} style={{ opacity: 0.7 }} />
                        {t.user?.fullName || t.user?.email || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={13} style={{ color: 'var(--color-primary, #BD4444)' }} />
                        {t.destination?.name ? `${t.destination.name}, ${t.destination.country}` : '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}>
                        <Calendar size={13} style={{ opacity: 0.7 }} />
                        {t.startDate && t.endDate ? `${t.startDate} – ${t.endDate}` : t.startDate || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        ₹{Number(t.budget || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={`dest-status-pill ${getStatusClass(t.status)}`}>
                        {t.status || 'PLANNED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTripsPage;

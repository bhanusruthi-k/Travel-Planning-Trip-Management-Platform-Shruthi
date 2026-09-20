import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  ArrowLeft,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
import { userApi } from '../api/userApi';

const AdminTravelersPage = () => {
  const navigate = useNavigate();
  const [travelers, setTravelers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTravelers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userApi.getTravelers();
      const rawList = Array.isArray(data) ? data : (data?.travelers || data?.data || []);
      const travelerList = rawList.filter(
        (u) => u.role === 'TRAVELER' && u.role !== 'ADMINISTRATOR' && u.email !== 'admin@tripnest.com'
      );
      setTravelers(travelerList);
    } catch (err) {
      console.error('Failed to load registered travelers:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to load registered travelers. Please verify backend connectivity.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTravelers();
  }, []);

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
          <h1 className="admin-main-heading">Registered Travelers</h1>
          <p className="admin-sub-heading">
            All active traveler accounts registered on the TripNest platform.
          </p>
        </div>

        <div className="discovery-stats-badge" style={{ alignSelf: 'flex-start' }}>
          <Users size={16} />
          <span>
            {travelers.length} Registered {travelers.length === 1 ? 'Traveler' : 'Travelers'}
          </span>
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
            <h3>Failed to load travelers</h3>
            <p>{error}</p>
          </div>
          <button onClick={fetchTravelers} className="btn-retry">
            Try Again
          </button>
        </div>
      ) : travelers.length === 0 ? (
        <div className="empty-results-box" style={{ marginTop: '24px' }}>
          <Users size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <h3>No Registered Travelers Found</h3>
          <p>No traveler accounts are currently registered in the system.</p>
        </div>
      ) : (
        <div className="dashboard-card-widget" style={{ marginTop: '24px' }}>
          <div className="admin-dest-table-wrap">
            <table className="admin-dest-table">
              <thead>
                <tr>
                  <th>Traveler</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Joined Date</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {travelers.map((t) => (
                  <tr key={t.id || t.email}>
                    <td>
                      <strong className="dest-table-name">{t.fullName || 'Traveler'}</strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} style={{ opacity: 0.7 }} />
                        {t.email}
                      </span>
                    </td>
                    <td>
                      <span>{t.phoneNumber || '—'}</span>
                    </td>
                    <td>
                      <span>
                        {[t.city, t.country].filter(Boolean).join(', ') || '—'}
                      </span>
                    </td>
                    <td>
                      <span>
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="profile-role-tag traveler"
                        style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                      >
                        TRAVELER
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

export default AdminTravelersPage;

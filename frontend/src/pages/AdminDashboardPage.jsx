import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Briefcase,
  DollarSign,
  Bell,
  MapPin,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Compass,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getAdminDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      if (err.response?.status === 403) {
        setError('ACCESS_DENIED');
      } else {
        setError('Unable to load platform analytics. Please verify backend connectivity.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const formatCurrency = (amount) => {
    const val = Number(amount) || 0;
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (error === 'ACCESS_DENIED' || (user && user.role !== 'ADMINISTRATOR')) {
    return (
      <div className="dashboard-page-container">
        <div className="access-denied-box">
          <Shield size={48} className="shield-deny-icon" />
          <h2>403 — Administrator Access Required</h2>
          <p>
            You do not have permission to view global platform analytics. This area is reserved
            exclusively for system administrators.
          </p>
          <Link to="/dashboard" className="btn-primary-action">
            Return to Traveler Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tripAnalytics = data?.tripAnalytics || {};
  const totalTrips = tripAnalytics.totalTrips || 0;

  return (
    <div className="dashboard-page-container">
      {/* 1. ADMIN HEADER */}
      <div className="admin-header-strip">
        <div className="admin-header-title-group">
          <div className="admin-badge-pill">
            <Shield size={14} />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="admin-main-heading">Platform Global Analytics</h1>
          <p className="admin-sub-heading">
            Live metrics, trip operations, destination popularity, and system-wide volume.
          </p>
        </div>

        <div className="admin-header-actions">
          <button onClick={fetchAdminData} className="btn-refresh-admin" title="Refresh metrics">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        /* LOADING SKELETON */
        <div className="dashboard-skeleton-layout">
          <div className="skeleton-stats-strip">
            <div className="skeleton-stat-box"></div>
            <div className="skeleton-stat-box"></div>
            <div className="skeleton-stat-box"></div>
            <div className="skeleton-stat-box"></div>
          </div>
          <div className="skeleton-grid-two-col">
            <div className="skeleton-panel-box large"></div>
            <div className="skeleton-panel-box large"></div>
          </div>
        </div>
      ) : error ? (
        <div className="dashboard-error-banner">
          <AlertTriangle size={28} />
          <div>
            <h3>Failed to load administrator metrics</h3>
            <p>{error}</p>
          </div>
          <button onClick={fetchAdminData} className="btn-retry">
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* 2. PLATFORM KPI METRIC CARDS */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="kpi-icon-wrap blue">
                <Users size={22} />
              </div>
              <div className="kpi-text-block">
                <span className="kpi-title">Registered Travelers</span>
                <strong className="kpi-number">{data?.userAnalytics?.totalUsers || 0}</strong>
                <span className="kpi-subtext">Active accounts in system</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-icon-wrap teal">
                <Briefcase size={22} />
              </div>
              <div className="kpi-text-block">
                <span className="kpi-title">Total Platform Trips</span>
                <strong className="kpi-number">{totalTrips}</strong>
                <span className="kpi-subtext">Expeditions created</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-icon-wrap emerald">
                <DollarSign size={22} />
              </div>
              <div className="kpi-text-block">
                <span className="kpi-title">Platform Expenses Logged</span>
                <strong className="kpi-number">
                  {formatCurrency(data?.platformStats?.totalExpenses)}
                </strong>
                <span className="kpi-subtext">Total travel transaction volume</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="kpi-icon-wrap purple">
                <Bell size={22} />
              </div>
              <div className="kpi-text-block">
                <span className="kpi-title">Notifications Dispatched</span>
                <strong className="kpi-number">
                  {data?.platformStats?.totalNotifications || 0}
                </strong>
                <span className="kpi-subtext">System alerts & member updates</span>
              </div>
            </div>
          </div>

          {/* 3. TRIP STATUSES & POPULAR DESTINATIONS */}
          <div className="admin-content-grid">
            {/* TRIP STATUS BREAKDOWN */}
            <div className="dashboard-card-widget">
              <div className="widget-header-row">
                <div className="widget-title-group">
                  <TrendingUp size={18} className="widget-icon" />
                  <h2>Trip Status Lifecycle Distribution</h2>
                </div>
              </div>

              <div className="trip-status-breakdown-grid">
                <div className="trip-status-tile planned">
                  <div className="status-tile-header">
                    <Clock size={16} />
                    <span>Planned</span>
                  </div>
                  <strong className="status-tile-count">
                    {tripAnalytics.plannedTrips || 0}
                  </strong>
                  <div className="status-tile-bar">
                    <div
                      className="status-tile-fill planned"
                      style={{
                        width: `${
                          totalTrips > 0
                            ? ((tripAnalytics.plannedTrips || 0) / totalTrips) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="trip-status-tile ongoing">
                  <div className="status-tile-header">
                    <Compass size={16} />
                    <span>Active / Ongoing</span>
                  </div>
                  <strong className="status-tile-count">
                    {tripAnalytics.activeTrips || 0}
                  </strong>
                  <div className="status-tile-bar">
                    <div
                      className="status-tile-fill ongoing"
                      style={{
                        width: `${
                          totalTrips > 0
                            ? ((tripAnalytics.activeTrips || 0) / totalTrips) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="trip-status-tile completed">
                  <div className="status-tile-header">
                    <CheckCircle2 size={16} />
                    <span>Completed</span>
                  </div>
                  <strong className="status-tile-count">
                    {tripAnalytics.completedTrips || 0}
                  </strong>
                  <div className="status-tile-bar">
                    <div
                      className="status-tile-fill completed"
                      style={{
                        width: `${
                          totalTrips > 0
                            ? ((tripAnalytics.completedTrips || 0) / totalTrips) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="trip-status-tile cancelled">
                  <div className="status-tile-header">
                    <XCircle size={16} />
                    <span>Cancelled</span>
                  </div>
                  <strong className="status-tile-count">
                    {tripAnalytics.cancelledTrips || 0}
                  </strong>
                  <div className="status-tile-bar">
                    <div
                      className="status-tile-fill cancelled"
                      style={{
                        width: `${
                          totalTrips > 0
                            ? ((tripAnalytics.cancelledTrips || 0) / totalTrips) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* DESTINATION POPULARITY LEADERBOARD */}
            <div className="dashboard-card-widget">
              <div className="widget-header-row">
                <div className="widget-title-group">
                  <Award size={18} className="widget-icon" />
                  <h2>Destination Popularity Ranking</h2>
                </div>
                <Link to="/destinations" className="widget-view-all">
                  Catalog <Compass size={13} />
                </Link>
              </div>

              {(!data?.destinationAnalytics || data.destinationAnalytics.length === 0) ? (
                <div className="widget-empty-box">
                  <MapPin size={36} className="empty-icon-muted" />
                  <h4>No Destination Analytics Yet</h4>
                  <p>Popularity metrics will calculate as travelers create expedition plans.</p>
                </div>
              ) : (
                <div className="destination-leaderboard-table-wrap">
                  <table className="admin-leaderboard-table">
                    <thead>
                      <tr>
                        <th style={{ width: '48px' }}>Rank</th>
                        <th>Destination</th>
                        <th>Country</th>
                        <th style={{ textAlign: 'right' }}>Trips Planned</th>
                        <th style={{ width: '120px' }}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.destinationAnalytics.map((dest, i) => {
                        const tripCount = dest.tripCount || 0;
                        const pct = totalTrips > 0 ? (tripCount / totalTrips) * 100 : 0;
                        return (
                          <tr key={dest.destinationId || i}>
                            <td>
                              <span className={`rank-badge ${i < 3 ? 'top' : ''}`}>
                                #{i + 1}
                              </span>
                            </td>
                            <td>
                              <strong className="table-dest-name">{dest.destinationName}</strong>
                            </td>
                            <td>
                              <span className="table-country-name">{dest.country}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <strong className="table-trip-count">{tripCount}</strong>
                            </td>
                            <td>
                              <div className="table-progress-bar">
                                <div
                                  className="table-progress-fill"
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;

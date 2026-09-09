import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Briefcase,
  DollarSign,
  Bell,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import { destinationApi } from '../api/destinationApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'destinations'

  // Analytics state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Destination Management state
  const [destinations, setDestinations] = useState([]);
  const [destLoading, setDestLoading] = useState(false);
  const [destSearch, setDestSearch] = useState('');
  const [destCategoryFilter, setDestCategoryFilter] = useState('ALL');

  // Destination Modal state (Add / Edit)
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [editingDestId, setEditingDestId] = useState(null);
  const [deleteConfirmDest, setDeleteConfirmDest] = useState(null);
  const [destFormData, setDestFormData] = useState({
    name: '',
    country: '',
    region: '',
    category: 'CITY',
    description: '',
    imageUrl: '',
    averageCost: '',
    isPopular: false,
    isActive: true,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

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

  const fetchDestinations = useCallback(async () => {
    setDestLoading(true);
    try {
      const all = await destinationApi.getDestinations();
      setDestinations(all || []);
    } catch (err) {
      console.error('Failed to load destinations for admin:', err);
      showToast('Failed to load destinations', 'error');
    } finally {
      setDestLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAdminData();
    fetchDestinations();
  }, [fetchDestinations]);

  const formatCurrency = (amount) => {
    const val = Number(amount) || 0;
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const handleOpenAddModal = () => {
    setEditingDestId(null);
    setDestFormData({
      name: '',
      country: '',
      region: '',
      category: 'CITY',
      description: '',
      imageUrl: '',
      averageCost: '2000',
      isPopular: false,
      isActive: true,
    });
    setModalError('');
    setIsDestModalOpen(true);
  };

  const handleOpenEditModal = (dest) => {
    setEditingDestId(dest.id);
    setDestFormData({
      name: dest.name || '',
      country: dest.country || '',
      region: dest.region || '',
      category: dest.category || 'CITY',
      description: dest.description || '',
      imageUrl: dest.imageUrl || '',
      averageCost: dest.averageCost ? String(dest.averageCost) : '',
      isPopular: dest.isPopular || false,
      isActive: dest.isActive !== false,
    });
    setModalError('');
    setIsDestModalOpen(true);
  };

  const handleDeleteDestination = (id, name) => {
    setDeleteConfirmDest({ id, name });
  };

  const executeDeleteDestination = async () => {
    if (!deleteConfirmDest) return;
    try {
      await destinationApi.deleteDestination(deleteConfirmDest.id);
      showToast('Destination removed successfully', 'info');
      setDestinations((prev) => prev.filter((d) => d.id !== deleteConfirmDest.id));
      setDeleteConfirmDest(null);
    } catch (err) {
      console.error('Failed to delete destination:', err);
      showToast('Failed to delete destination', 'error');
    }
  };

  const handleDestFormSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!destFormData.name.trim() || !destFormData.country.trim()) {
      setModalError('Destination name and country are required.');
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        name: destFormData.name.trim(),
        country: destFormData.country.trim(),
        region: destFormData.region.trim(),
        category: destFormData.category.trim(),
        description: destFormData.description.trim(),
        imageUrl: destFormData.imageUrl.trim() || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
        averageCost: destFormData.averageCost ? Number(destFormData.averageCost) : 2000,
        isPopular: Boolean(destFormData.isPopular),
        isActive: Boolean(destFormData.isActive),
      };

      if (editingDestId) {
        await destinationApi.updateDestination(editingDestId, payload);
        showToast('Destination updated successfully', 'success');
      } else {
        await destinationApi.createDestination(payload);
        showToast('Destination created successfully!', 'success');
      }

      setIsDestModalOpen(false);
      fetchDestinations();
    } catch (err) {
      console.error('Failed to save destination:', err);
      const msg = err.response?.data?.message || 'Failed to save destination. Please check the fields.';
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredDestinations = destinations.filter((d) => {
    const matchesCat =
      destCategoryFilter === 'ALL' ||
      (d.category && d.category.toUpperCase().includes(destCategoryFilter.toUpperCase()));
    const q = destSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      d.name?.toLowerCase().includes(q) ||
      d.country?.toLowerCase().includes(q) ||
      d.region?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

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
          <h1 className="admin-main-heading">Admin Management</h1>
          <p className="admin-sub-heading">
            Live metrics, trip operations, destination catalog management, and system-wide volume.
          </p>
        </div>
      </div>

      {/* ADMIN TABS */}
      <div className="admin-navigation-tabs">
        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} /> Global Analytics
        </button>
        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'destinations' ? 'active' : ''}`}
          onClick={() => setActiveTab('destinations')}
        >
          <Compass size={16} /> Destination Management ({destinations.length})
        </button>
      </div>

      {activeTab === 'analytics' ? (
        loading ? (
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
                  <button
                    type="button"
                    className="widget-view-all"
                    onClick={() => setActiveTab('destinations')}
                  >
                    Manage Catalog <Compass size={13} />
                  </button>
                </div>

                {!data?.destinationAnalytics || data.destinationAnalytics.length === 0 ? (
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
        )
      ) : (
        /* DESTINATION MANAGEMENT TAB */
        <div className="admin-destinations-panel">
          <div className="admin-dest-controls-row">
            <div className="admin-dest-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, country, region..."
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                className="admin-dest-search-input"
              />
              {destSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setDestSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="admin-dest-filters">
              <select
                value={destCategoryFilter}
                onChange={(e) => setDestCategoryFilter(e.target.value)}
                className="admin-select"
              >
                <option value="ALL">All Categories</option>
                <option value="CITY">City</option>
                <option value="BEACH">Beach</option>
                <option value="NATURE">Nature</option>
                <option value="ADVENTURE">Adventure</option>
                <option value="CULTURE">Culture</option>
                <option value="WILDLIFE">Wildlife</option>
                <option value="ROMANTIC">Romantic</option>
                <option value="FOOD">Food</option>
                <option value="LUXURY">Luxury</option>
                <option value="MOUNTAINS">Mountains</option>
                <option value="ISLAND">Island</option>
                <option value="HERITAGE">Heritage</option>
              </select>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="btn-primary-action"
              >
                <Plus size={16} /> Add Destination
              </button>
            </div>
          </div>

          {destLoading ? (
            <div className="loading-grid-skeleton" style={{ padding: '24px 0' }}>
              <p>Loading destination catalog...</p>
            </div>
          ) : (
            <div className="admin-dest-table-wrap">
              <table className="admin-dest-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Preview</th>
                    <th>Destination</th>
                    <th>Country / Region</th>
                    <th>Categories</th>
                    <th>Avg Cost</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDestinations.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <img
                          src={d.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
                          alt={d.name}
                          className="admin-dest-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </td>
                      <td>
                        <strong className="dest-table-name">{d.name}</strong>
                        {d.isPopular && (
                          <span className="dest-popular-tag">
                            <Sparkles size={10} /> Popular
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="dest-table-country">{d.country}</span>
                        {d.region && <span className="dest-table-region"> ({d.region})</span>}
                      </td>
                      <td>
                        <span className="dest-table-cat">{d.category || 'General'}</span>
                      </td>
                      <td>
                        <span className="dest-table-cost">₹{Number(d.averageCost || 0).toLocaleString()}</span>
                      </td>
                      <td>
                        <span className={`dest-status-pill ${d.isActive ? 'active' : 'inactive'}`}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="btn-admin-icon"
                            onClick={() => handleOpenEditModal(d)}
                            title="Edit destination"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-admin-icon danger"
                            onClick={() => handleDeleteDestination(d.id, d.name)}
                            title="Delete / Deactivate destination"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DESTINATION ADD / EDIT MODAL */}
      {isDestModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => !modalLoading && setIsDestModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingDestId ? 'Edit Destination' : 'Add New Destination'}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsDestModalOpen(false)}
                disabled={modalLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-scrollable">
              {modalError && (
                <div className="alert-box alert-error" role="alert">
                  <AlertTriangle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form id="dest-modal-form" onSubmit={handleDestFormSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dest-name">Destination Name *</label>
                    <input
                      id="dest-name"
                      type="text"
                      placeholder="e.g. Kyoto"
                      value={destFormData.name}
                      onChange={(e) => setDestFormData({ ...destFormData, name: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="dest-country">Country *</label>
                    <input
                      id="dest-country"
                      type="text"
                      placeholder="e.g. Japan"
                      value={destFormData.country}
                      onChange={(e) => setDestFormData({ ...destFormData, country: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dest-region">Region</label>
                    <input
                      id="dest-region"
                      type="text"
                      placeholder="e.g. Kansai / Asia"
                      value={destFormData.region}
                      onChange={(e) => setDestFormData({ ...destFormData, region: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="dest-category">Travel Category / Tags *</label>
                    <input
                      id="dest-category"
                      type="text"
                      placeholder="e.g. Culture, Heritage, Spiritual"
                      value={destFormData.category}
                      onChange={(e) => setDestFormData({ ...destFormData, category: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dest-cost">Average Cost (₹)</label>
                    <input
                      id="dest-cost"
                      type="number"
                      placeholder="e.g. 2500"
                      value={destFormData.averageCost}
                      onChange={(e) => setDestFormData({ ...destFormData, averageCost: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={destFormData.isPopular}
                        onChange={(e) => setDestFormData({ ...destFormData, isPopular: e.target.checked })}
                      />
                      <span>Featured / Popular</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={destFormData.isActive}
                        onChange={(e) => setDestFormData({ ...destFormData, isActive: e.target.checked })}
                      />
                      <span>Active in Catalog</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="dest-image">Image URL</label>
                  <input
                    id="dest-image"
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={destFormData.imageUrl}
                    onChange={(e) => setDestFormData({ ...destFormData, imageUrl: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dest-desc">Description</label>
                  <textarea
                    id="dest-desc"
                    rows="3"
                    placeholder="Detailed overview and travel highlights..."
                    value={destFormData.description}
                    onChange={(e) => setDestFormData({ ...destFormData, description: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </form>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsDestModalOpen(false)}
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="dest-modal-form"
                className="btn-modal-submit"
                disabled={modalLoading}
              >
                {modalLoading ? 'Saving...' : editingDestId ? 'Update Destination' : 'Create Destination'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DESTINATION MODAL */}
      <ConfirmModal
        isOpen={!!deleteConfirmDest}
        title="Deactivate Destination?"
        message={
          deleteConfirmDest
            ? `Are you sure you want to deactivate/delete "${deleteConfirmDest.name}"?`
            : ''
        }
        confirmText="Delete Destination"
        danger={true}
        onConfirm={executeDeleteDestination}
        onCancel={() => setDeleteConfirmDest(null)}
      />
    </div>
  );
};

export default AdminDashboardPage;

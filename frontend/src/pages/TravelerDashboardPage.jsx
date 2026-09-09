import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin,
  Plus,
  ArrowRight,
  Briefcase,
  AlertCircle,
  PieChart as PieChartIcon,
  ChevronRight,
  X,
  CreditCard,
  Tag,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import { expenseApi } from '../api/expenseApi';
import { tripApi } from '../api/tripApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DatePicker from '../components/DatePicker';
import Chart from 'chart.js/auto';

const CATEGORY_OPTIONS = [
  'Transportation',
  'Hotel',
  'Food',
  'Shopping',
  'Entertainment',
];

const TravelerDashboardPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Expense Modal State
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [userTrips, setUserTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseError, setExpenseError] = useState('');

  const [expenseForm, setExpenseForm] = useState({
    tripId: '',
    category: 'Food',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.getTravelerDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load traveler dashboard:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Load user trips for Add Expense dropdown (DO NOT auto-select any trip)
  const loadUserTrips = async () => {
    setLoadingTrips(true);
    try {
      const trips = await tripApi.getTrips();
      setUserTrips(trips || []);
    } catch (err) {
      console.error('Failed to load trips for expense modal:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleOpenAddExpense = (defaultTripId = null) => {
    setExpenseError('');
    setIsAddExpenseOpen(true);
    loadUserTrips();
    setExpenseForm({
      tripId: defaultTripId ? defaultTripId.toString() : '',
      category: 'Food',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
    });
  };

  const handleCloseAddExpense = () => {
    setIsAddExpenseOpen(false);
    setExpenseError('');
  };

  const handleExpenseInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    setExpenseError('');

    const tripId = expenseForm.tripId;
    if (!tripId) {
      setExpenseError('Please select a trip.');
      return;
    }

    const amountNum = parseFloat(expenseForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setExpenseError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!expenseForm.category) {
      setExpenseError('Please select an expense category.');
      return;
    }

    if (!expenseForm.expenseDate) {
      setExpenseError('Please select an expense date.');
      return;
    }

    setExpenseSubmitting(true);
    try {
      const payload = {
        title: expenseForm.description?.trim() || `${expenseForm.category} Expense`,
        description: expenseForm.description?.trim() || '',
        category: expenseForm.category,
        amount: amountNum,
        expenseDate: expenseForm.expenseDate,
      };

      await expenseApi.createExpense(tripId, payload);

      showToast('Expense added successfully!', 'success');
      setIsAddExpenseOpen(false);

      // Reset form
      setExpenseForm({
        tripId: '',
        category: 'Food',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        description: '',
      });

      // Refresh Dashboard data immediately
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to add expense:', err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Unable to add expense. Please try again.';
      setExpenseError(errMsg);
    } finally {
      setExpenseSubmitting(false);
    }
  };

  // Initialize and update Chart.js instance when data arrives
  useEffect(() => {
    if (!data?.expenseSummary || data.expenseSummary.length === 0 || !chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = data.expenseSummary.map((item) => item.category);
    const values = data.expenseSummary.map((item) => Number(item.amount) || 0);

    const backgroundColors = [
      '#0284c7', // Primary Sky Blue
      '#0d9488', // Teal
      '#d97706', // Amber
      '#059669', // Emerald
      '#7c3aed', // Purple
      '#e11d48', // Rose
      '#ea580c', // Orange
      '#64748b', // Slate
    ];

    const ctx = chartRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: backgroundColors.slice(0, labels.length),
            borderColor: 'transparent',
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 12,
              font: {
                size: 11,
                family: "'Plus Jakarta Sans', sans-serif",
                weight: '600',
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const val = context.raw || 0;
                return ` ${label}: ₹${Number(val).toLocaleString('en-IN')}`;
              },
            },
          },
        },
        cutout: '70%',
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]);

  const formatCurrency = (amount) => {
    const val = Number(amount) || 0;
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="dashboard-page-container">
      {/* 1. HERO HEADER (Clean, Professional, No Command Center Badge) */}
      <div className="dashboard-hero-header">
        <div className="dashboard-welcome-area">
          <h1 className="dashboard-title">
            Welcome back, {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Traveler'}!
          </h1>
          <p className="dashboard-subtitle">
            Here is your live itinerary schedule, budget spending metrics, and destination insights.
          </p>
        </div>

        <div className="dashboard-action-group">
          <button
            type="button"
            className="btn-add-expense-top"
            onClick={() => handleOpenAddExpense()}
            title="Add a new expense"
          >
            <Plus size={16} /> Add Expense
          </button>
          <Link to="/trips?action=create" className="btn-primary-action">
            <Plus size={16} />{' '}
            {!data?.travelStats?.totalTrips || data.travelStats.totalTrips === 0
              ? 'Create Your First Trip'
              : 'New Trip'}
          </Link>
        </div>
      </div>

      {loading ? (
        /* LOADING SKELETON */
        <div className="dashboard-skeleton-layout">
          <div className="skeleton-stats-strip">
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
          <AlertCircle size={28} />
          <div>
            <h3>Failed to load dashboard</h3>
            <p>{error}</p>
          </div>
          <button onClick={fetchDashboard} className="btn-retry">
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* 2. TRAVEL STATS STRIP */}
          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card">
              <div className="stat-card-icon blue">
                <Briefcase size={20} />
              </div>
              <div className="stat-card-info">
                <span className="stat-label">Total Expeditions</span>
                <strong className="stat-value">{data?.travelStats?.totalTrips || 0}</strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-card-icon teal">
                <Compass size={20} />
              </div>
              <div className="stat-card-info">
                <span className="stat-label">Unique Destinations</span>
                <strong className="stat-value">
                  {data?.travelStats?.totalDestinationsVisited || 0}
                </strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-card-icon emerald">
                <DollarSign size={20} />
              </div>
              <div className="stat-card-info">
                <span className="stat-label">Total Expenses Logged</span>
                <strong className="stat-value">
                  {formatCurrency(data?.travelStats?.totalSpent)}
                </strong>
              </div>
            </div>
          </div>

          {/* 3. MAIN DASHBOARD GRID */}
          <div className="dashboard-main-grid">
            {/* Left Column: Upcoming Trips & Budget Overview */}
            <div className="dashboard-col-left">
              {/* UPCOMING TRIPS SECTION */}
              <div className="dashboard-card-widget">
                <div className="widget-header-row">
                  <div className="widget-title-group">
                    <Calendar size={18} className="widget-icon" />
                    <h2>Upcoming Journeys</h2>
                  </div>
                  <Link to="/trips" className="widget-view-all">
                    View all <ArrowRight size={13} />
                  </Link>
                </div>

                {!data?.upcomingTrips || data.upcomingTrips.length === 0 ? (
                  <div className="widget-empty-box">
                    <Compass size={36} className="empty-icon-muted" />
                    <h4>No Upcoming Trips Scheduled</h4>
                    <p>Start planning your next getaway and track your itinerary schedule here.</p>
                    <Link to="/trips?action=create" className="btn-primary-action">
                      <Plus size={16} /> Create Your First Trip
                    </Link>
                  </div>
                ) : (
                  <div className="upcoming-trips-list">
                    {data.upcomingTrips.map((trip) => {
                      const cover =
                        trip.destinationImageUrl ||
                        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
                      return (
                        <div
                          key={trip.id}
                          className="upcoming-trip-item-card"
                          onClick={() => navigate(`/trips/${trip.id}`)}
                        >
                          <div className="upcoming-trip-thumb">
                            <img src={cover} alt={trip.title} />
                          </div>
                          <div className="upcoming-trip-details">
                            <div className="upcoming-trip-head">
                              <h3 className="upcoming-trip-title">{trip.title}</h3>
                              <span className="trip-status-pill planned">{trip.status}</span>
                            </div>
                            <div className="upcoming-trip-meta">
                              <span className="meta-dest">
                                <MapPin size={12} /> {trip.destinationName}
                                {trip.destinationCountry ? `, ${trip.destinationCountry}` : ''}
                              </span>
                              <span className="meta-dates">
                                <Calendar size={12} /> {trip.startDate} → {trip.endDate}
                              </span>
                            </div>
                          </div>
                          <button className="btn-trip-arrow" title="Open workspace">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BUDGET & SPENDING OVERVIEW */}
              <div className="dashboard-card-widget">
                <div className="widget-header-row">
                  <div className="widget-title-group">
                    <TrendingUp size={18} className="widget-icon" />
                    <h2>Budget & Expense Balance</h2>
                  </div>
                </div>

                <div className="budget-overview-summary">
                  <div className="budget-kpi-item">
                    <span className="kpi-label">Total Allocated Budget</span>
                    <strong className="kpi-value">
                      {formatCurrency(data?.budgetOverview?.totalBudget)}
                    </strong>
                  </div>
                  <div className="budget-kpi-item">
                    <span className="kpi-label">Total Spent to Date</span>
                    <strong className="kpi-value spent">
                      {formatCurrency(data?.budgetOverview?.totalSpent)}
                    </strong>
                  </div>
                  <div className="budget-kpi-item">
                    <span className="kpi-label">Net Remaining Balance</span>
                    <strong
                      className={`kpi-value ${
                        Number(data?.budgetOverview?.remainingBudget) < 0
                          ? 'negative'
                          : 'positive'
                      }`}
                    >
                      {formatCurrency(data?.budgetOverview?.remainingBudget)}
                    </strong>
                  </div>
                </div>

                {/* Progress Bar */}
                {Number(data?.budgetOverview?.totalBudget) > 0 && (
                  <div className="budget-bar-section">
                    <div className="budget-bar-track">
                      <div
                        className={`budget-bar-fill ${
                          Number(data?.budgetOverview?.totalSpent) >
                          Number(data?.budgetOverview?.totalBudget)
                            ? 'overbudget'
                            : ''
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (Number(data?.budgetOverview?.totalSpent) /
                              Number(data?.budgetOverview?.totalBudget)) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="budget-bar-labels">
                      <span>
                        {Math.round(
                          (Number(data?.budgetOverview?.totalSpent) /
                            Number(data?.budgetOverview?.totalBudget)) *
                            100
                        )}
                        % Spent
                      </span>
                      <span>
                        {formatCurrency(data?.budgetOverview?.remainingBudget)} Available
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Expense Category Chart & Most Visited Destinations */}
            <div className="dashboard-col-right">
              {/* EXPENSE CATEGORY BREAKDOWN */}
              <div className="dashboard-card-widget">
                <div className="widget-header-row">
                  <div className="widget-title-group">
                    <PieChartIcon size={18} className="widget-icon" />
                    <h2>Expense Category Breakdown</h2>
                  </div>
                  <button
                    type="button"
                    className="widget-add-expense-link"
                    onClick={() => handleOpenAddExpense()}
                  >
                    <Plus size={14} /> Add Expense
                  </button>
                </div>

                {!data?.expenseSummary || data.expenseSummary.length === 0 ? (
                  <div className="widget-empty-box">
                    <DollarSign size={36} className="empty-icon-muted" />
                    <h4>No Expenses Logged Yet</h4>
                    <p>
                      When you record expenses for your trips, category analytics will appear here.
                    </p>
                    <button
                      type="button"
                      className="btn-add-expense-empty"
                      onClick={() => handleOpenAddExpense()}
                    >
                      <Plus size={15} /> Log Your First Expense
                    </button>
                  </div>
                ) : (
                  <div className="expense-chart-container">
                    <div className="chart-canvas-wrapper">
                      <canvas ref={chartRef} />
                    </div>

                    <div className="expense-category-breakdown-list">
                      {data.expenseSummary.map((item, i) => (
                        <div key={item.category || i} className="expense-cat-row">
                          <div className="cat-row-left">
                            <span className="cat-name">{item.category}</span>
                            <span className="cat-count">({item.count} items)</span>
                          </div>
                          <div className="cat-row-right">
                            <strong className="cat-amount">
                              {formatCurrency(item.amount)}
                            </strong>
                            <span className="cat-pct">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* MOST VISITED / FAVORITE DESTINATIONS */}
              <div className="dashboard-card-widget">
                <div className="widget-header-row">
                  <div className="widget-title-group">
                    <MapPin size={18} className="widget-icon" />
                    <h2>Most-Visited Destinations</h2>
                  </div>
                  <Link to="/destinations" className="widget-view-all">
                    Explore <ArrowRight size={13} />
                  </Link>
                </div>

                {!data?.favoriteDestinations || data.favoriteDestinations.length === 0 ? (
                  <div className="widget-empty-box">
                    <MapPin size={36} className="empty-icon-muted" />
                    <h4>No Destination Visits Yet</h4>
                    <p>Explore curated destinations worldwide to build your expedition log.</p>
                  </div>
                ) : (
                  <div className="most-visited-dest-list">
                    {data.favoriteDestinations.map((dest, idx) => (
                      <div
                        key={dest.destinationId || idx}
                        className="visited-dest-card"
                        onClick={() =>
                          dest.destinationId && navigate(`/destinations/${dest.destinationId}`)
                        }
                      >
                        <div className="visited-dest-rank">#{idx + 1}</div>
                        <div className="visited-dest-info">
                          <h4 className="visited-dest-name">{dest.destinationName}</h4>
                          <span className="visited-dest-country">{dest.country}</span>
                        </div>
                        <div className="visited-dest-count-tag">
                          <strong>{dest.visitCount}</strong>{' '}
                          {dest.visitCount === 1 ? 'trip' : 'trips'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ADD EXPENSE MODAL */}
      {isAddExpenseOpen && (
        <div
          className="modal-backdrop"
          onClick={handleCloseAddExpense}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-expense-modal-title"
        >
          <div className="modal-card add-expense-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-icon-badge">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 id="add-expense-modal-title" className="modal-title">
                    Add Expense
                  </h3>
                  <p className="modal-subtitle">Log a new expense to track your trip budget.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={handleCloseAddExpense}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {expenseError && (
              <div className="modal-error-banner">
                <AlertCircle size={16} />
                <span>{expenseError}</span>
              </div>
            )}

            <form onSubmit={handleAddExpenseSubmit} className="modal-form">
              {/* 1. Select Trip */}
              <div className="form-group">
                <label htmlFor="expense-trip-select" className="form-label">
                  Trip <span className="required-star">*</span>
                </label>
                {loadingTrips ? (
                  <div className="form-input-loading">Loading your trips...</div>
                ) : userTrips.length === 0 ? (
                  <div className="form-empty-notice">
                    No trips found.{' '}
                    <Link to="/trips?action=create" onClick={handleCloseAddExpense}>
                      Create a trip first
                    </Link>
                  </div>
                ) : (
                  <select
                    id="expense-trip-select"
                    name="tripId"
                    value={expenseForm.tripId}
                    onChange={handleExpenseInputChange}
                    className="form-select"
                    required
                  >
                    <option value="" disabled>
                      -- Select a trip --
                    </option>
                    {userTrips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.destination?.name || 'Trip'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 2. Category & Amount Row */}
              <div className="form-row-two-col">
                <div className="form-group">
                  <label htmlFor="expense-category-select" className="form-label">
                    Category <span className="required-star">*</span>
                  </label>
                  <select
                    id="expense-category-select"
                    name="category"
                    value={expenseForm.category}
                    onChange={handleExpenseInputChange}
                    className="form-select"
                    required
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="expense-amount-input" className="form-label">
                    Amount <span className="required-star">*</span>
                  </label>
                  <div className="input-with-adornment">
                    <span className="input-adornment">₹</span>
                    <input
                      id="expense-amount-input"
                      type="number"
                      name="amount"
                      min="0.01"
                      step="any"
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={handleExpenseInputChange}
                      className="form-input with-adornment"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 3. Date & Description */}
              <div className="form-row-two-col">
                <div className="form-group">
                  <label className="form-label">
                    Date <span className="required-star">*</span>
                  </label>
                  <DatePicker
                    value={expenseForm.expenseDate}
                    onChange={(d) => setExpenseForm((prev) => ({ ...prev, expenseDate: d }))}
                    placeholder="Select expense date"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expense-description-input" className="form-label">
                    Description <span className="optional-text">(optional)</span>
                  </label>
                  <input
                    id="expense-description-input"
                    type="text"
                    name="description"
                    placeholder="e.g. Dinner, Taxi fare, Museum ticket"
                    value={expenseForm.description}
                    onChange={handleExpenseInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={handleCloseAddExpense}
                  disabled={expenseSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={expenseSubmitting || userTrips.length === 0}
                >
                  {expenseSubmitting ? (
                    <span className="btn-loading-content">Adding...</span>
                  ) : (
                    <>
                      <Plus size={16} /> Add Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelerDashboardPage;

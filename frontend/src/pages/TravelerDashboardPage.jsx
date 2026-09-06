import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import Chart from 'chart.js/auto';

const TravelerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const fetchDashboard = async () => {
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
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Initialize and update Chart.js instance when data arrives
  useEffect(() => {
    if (!data?.expenseSummary || data.expenseSummary.length === 0 || !chartRef.current) {
      return;
    }

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = data.expenseSummary.map((item) => item.category);
    const values = data.expenseSummary.map((item) => Number(item.amount) || 0);

    const backgroundColors = [
      '#0284c7', // Primary Blue
      '#0d9488', // Teal
      '#d97706', // Amber
      '#059669', // Emerald
      '#7c3aed', // Purple
      '#e11d48', // Rose
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
              padding: 14,
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
                return ` ${label}: ₹${Number(val).toLocaleString()}`;
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
      {/* 1. HERO HEADER */}
      <div className="dashboard-hero-header">
        <div className="dashboard-welcome-area">
          <div className="dashboard-badge-pill">
            <Sparkles size={13} />
            <span>Traveler Command Center</span>
          </div>
          <h1 className="dashboard-title">
            Welcome back, {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Traveler'}!
          </h1>
          <p className="dashboard-subtitle">
            Here is your live itinerary schedule, budget spending metrics, and destination insights.
          </p>
        </div>

        <div className="dashboard-action-group">
          <Link to="/trips?action=create" className="btn-primary-action">
            <Plus size={16} /> Plan New Trip
          </Link>
          <Link to="/trips" className="btn-secondary-action">
            <Briefcase size={16} /> All Trips
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

                {(!data?.upcomingTrips || data.upcomingTrips.length === 0) ? (
                  <div className="widget-empty-box">
                    <Compass size={36} className="empty-icon-muted" />
                    <h4>No Upcoming Trips Scheduled</h4>
                    <p>Start planning your next getaway and track your itinerary schedule here.</p>
                    <Link to="/trips?action=create" className="btn-primary-compact">
                      <Plus size={14} /> Create Trip
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
                        Number(data?.budgetOverview?.remainingBudget) < 0 ? 'negative' : 'positive'
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
                </div>

                {(!data?.expenseSummary || data.expenseSummary.length === 0) ? (
                  <div className="widget-empty-box">
                    <DollarSign size={36} className="empty-icon-muted" />
                    <h4>No Expenses Logged Yet</h4>
                    <p>When you record expenses for your trips, category analytics will appear here.</p>
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
                            <strong className="cat-amount">{formatCurrency(item.amount)}</strong>
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

                {(!data?.favoriteDestinations || data.favoriteDestinations.length === 0) ? (
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
                        onClick={() => dest.destinationId && navigate(`/destinations/${dest.destinationId}`)}
                      >
                        <div className="visited-dest-rank">#{idx + 1}</div>
                        <div className="visited-dest-info">
                          <h4 className="visited-dest-name">{dest.destinationName}</h4>
                          <span className="visited-dest-country">{dest.country}</span>
                        </div>
                        <div className="visited-dest-count-tag">
                          <strong>{dest.visitCount}</strong> {dest.visitCount === 1 ? 'trip' : 'trips'}
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
    </div>
  );
};

export default TravelerDashboardPage;

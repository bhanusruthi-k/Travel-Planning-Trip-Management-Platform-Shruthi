import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tripApi } from '../api/tripApi';
import { itineraryApi } from '../api/itineraryApi';
import { budgetApi } from '../api/budgetApi';
import { useToast } from '../context/ToastContext';
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
  Layers,
  PiggyBank,
  Receipt,
  Wallet,
  Building2,
  Utensils,
  Plane,
  Ticket,
  ShieldCheck,
  Percent,
  Sparkles,
  TrendingDown,
  Coins,
  ChevronRight,
} from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];

const BUDGET_TIERS = ['Backpacker / Budget', 'Smart Mid-Range', 'Comfort & Boutique', 'Luxury Escape', 'Business / Work'];

const TripDetailsPage = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active view section
  const [activeSection, setActiveSection] = useState('all'); // 'all', 'itinerary', 'budget'

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

  // Budget Modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetFormData, setBudgetFormData] = useState({
    totalBudget: '',
    currency: 'USD',
    category: 'Smart Mid-Range',
    notes: '',
    accommodationBudget: '',
    foodBudget: '',
    transportationBudget: '',
    activitiesBudget: '',
    emergencyBudget: '',
  });
  const [budgetModalLoading, setBudgetModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const { showToast } = useToast();

  const loadTripData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tripData, daysData, budgetData] = await Promise.all([
        tripApi.getTripById(id),
        itineraryApi.getItineraryForTrip(id),
        budgetApi.getBudget(id).catch(() => null),
      ]);
      setTrip(tripData);
      setDays(daysData);
      setBudget(budgetData);
    } catch (err) {
      console.error('Failed to load trip details:', err);
      setError(err.response?.data?.message || 'Trip not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  // Currency Formatter Helper
  const getCurrencySymbol = (code = 'USD') => {
    const match = CURRENCIES.find((c) => c.code === code.toUpperCase());
    return match ? match.symbol : '$';
  };

  const formatMoney = (val, code = budget?.currency || 'USD') => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    const sym = getCurrencySymbol(code);
    return `${sym}${Math.round(num).toLocaleString()}`;
  };

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
      title: `Day ${nextDayNum} Exploration`,
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
      showToast(`Day ${dayFormData.dayNumber} added to itinerary!`, 'success');
      await loadTripData();
    } catch (err) {
      console.error('Failed to add itinerary day:', err);
      const msg = err.response?.data?.message || 'Failed to add day.';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setDayModalLoading(false);
    }
  };

  const handleDeleteDay = async (dayId, dayTitle) => {
    if (window.confirm(`Delete "${dayTitle}" and all its activities?`)) {
      try {
        await itineraryApi.deleteDay(id, dayId);
        setDays(days.filter((d) => d.id !== dayId));
        showToast(`Itinerary day deleted`, 'info');
      } catch (err) {
        console.error('Failed to delete day:', err);
        showToast(err.response?.data?.message || 'Failed to delete day.', 'error');
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
        showToast('Activity updated successfully!', 'success');
      } else {
        await itineraryApi.addActivity(selectedDayId, payload);
        showToast('Activity added to day schedule!', 'success');
      }

      setIsActivityModalOpen(false);
      await loadTripData();
    } catch (err) {
      console.error('Failed to save activity:', err);
      const msg = err.response?.data?.message || 'Failed to save activity.';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setActivityModalLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId, activityTitle) => {
    if (window.confirm(`Delete activity "${activityTitle}"?`)) {
      try {
        await itineraryApi.deleteActivity(activityId);
        showToast(`Activity "${activityTitle}" removed`, 'info');
        await loadTripData();
      } catch (err) {
        console.error('Failed to delete activity:', err);
        showToast(err.response?.data?.message || 'Failed to delete activity.', 'error');
      }
    }
  };

  // Budget Handlers
  const openCreateOrEditBudgetModal = () => {
    if (budget) {
      setBudgetFormData({
        totalBudget: budget.totalBudget ? String(budget.totalBudget) : '',
        currency: budget.currency || 'USD',
        category: budget.category || 'Smart Mid-Range',
        notes: budget.notes || '',
        accommodationBudget: budget.accommodationBudget ? String(budget.accommodationBudget) : '',
        foodBudget: budget.foodBudget ? String(budget.foodBudget) : '',
        transportationBudget: budget.transportationBudget ? String(budget.transportationBudget) : '',
        activitiesBudget: budget.activitiesBudget ? String(budget.activitiesBudget) : '',
        emergencyBudget: budget.emergencyBudget ? String(budget.emergencyBudget) : '',
      });
    } else {
      const fallbackTotal = trip?.budget ? String(trip.budget) : (trip?.destination?.averageCost ? String(trip.destination.averageCost) : '2000');
      const totNum = parseFloat(fallbackTotal) || 2000;
      setBudgetFormData({
        totalBudget: String(totNum),
        currency: 'USD',
        category: 'Smart Mid-Range',
        notes: '',
        accommodationBudget: String(Math.round(totNum * 0.35)),
        foodBudget: String(Math.round(totNum * 0.25)),
        transportationBudget: String(Math.round(totNum * 0.20)),
        activitiesBudget: String(Math.round(totNum * 0.15)),
        emergencyBudget: String(Math.round(totNum * 0.05)),
      });
    }
    setModalError('');
    setIsBudgetModalOpen(true);
  };

  const applyQuickSplit = (percentMap) => {
    const tot = parseFloat(budgetFormData.totalBudget);
    if (!tot || isNaN(tot) || tot <= 0) {
      setModalError('Please enter a valid Total Budget first to apply quick split.');
      return;
    }
    setBudgetFormData({
      ...budgetFormData,
      accommodationBudget: String(Math.round(tot * percentMap.stay)),
      foodBudget: String(Math.round(tot * percentMap.food)),
      transportationBudget: String(Math.round(tot * percentMap.transit)),
      activitiesBudget: String(Math.round(tot * percentMap.acts)),
      emergencyBudget: String(Math.round(tot * percentMap.buffer)),
    });
    setModalError('');
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const tot = parseFloat(budgetFormData.totalBudget);
    if (!tot || isNaN(tot) || tot <= 0) {
      setModalError('Total budget must be a positive number.');
      return;
    }

    const stay = budgetFormData.accommodationBudget ? parseFloat(budgetFormData.accommodationBudget) : 0;
    const food = budgetFormData.foodBudget ? parseFloat(budgetFormData.foodBudget) : 0;
    const transit = budgetFormData.transportationBudget ? parseFloat(budgetFormData.transportationBudget) : 0;
    const acts = budgetFormData.activitiesBudget ? parseFloat(budgetFormData.activitiesBudget) : 0;
    const buffer = budgetFormData.emergencyBudget ? parseFloat(budgetFormData.emergencyBudget) : 0;

    const sumAllocated = stay + food + transit + acts + buffer;
    if (sumAllocated > tot) {
      setModalError(`Total of categories (${getCurrencySymbol(budgetFormData.currency)}${sumAllocated.toLocaleString()}) exceeds your overall budget (${getCurrencySymbol(budgetFormData.currency)}${tot.toLocaleString()}). Please adjust allocations.`);
      return;
    }

    setBudgetModalLoading(true);

    try {
      const payload = {
        totalBudget: tot,
        currency: budgetFormData.currency,
        category: budgetFormData.category,
        notes: budgetFormData.notes,
        accommodationBudget: stay > 0 ? stay : null,
        foodBudget: food > 0 ? food : null,
        transportationBudget: transit > 0 ? transit : null,
        activitiesBudget: acts > 0 ? acts : null,
        emergencyBudget: buffer > 0 ? buffer : null,
      };

      if (budget) {
        await budgetApi.updateBudget(id, payload);
        showToast('Trip budget plan updated successfully!', 'success');
      } else {
        await budgetApi.createBudget(id, payload);
        showToast('Trip budget created and initialized!', 'success');
      }

      setIsBudgetModalOpen(false);
      await loadTripData();
    } catch (err) {
      console.error('Failed to save budget:', err);
      const msg = err.response?.data?.message || 'Failed to save budget plan.';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setBudgetModalLoading(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (window.confirm('Are you sure you want to remove the custom budget plan for this trip?')) {
      try {
        await budgetApi.deleteBudget(id);
        showToast('Budget plan removed', 'info');
        await loadTripData();
      } catch (err) {
        console.error('Failed to delete budget:', err);
        showToast(err.response?.data?.message || 'Failed to remove budget', 'error');
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

  // Calculations
  const totalActivitiesCount = days.reduce(
    (acc, d) => acc + (d.activities ? d.activities.length : 0),
    0
  );

  const totalSpentCost = days.reduce((acc, d) => {
    if (!d.activities) return acc;
    return (
      acc +
      d.activities.reduce((sub, a) => sub + (a.cost ? parseFloat(a.cost) : 0), 0)
    );
  }, 0);

  const activeBudgetAmount = budget?.totalBudget ? parseFloat(budget.totalBudget) : (trip?.budget || 0);
  const activeCurrency = budget?.currency || 'USD';
  const remainingBudget = activeBudgetAmount ? activeBudgetAmount - totalSpentCost : null;
  const budgetSpentPercentage =
    activeBudgetAmount > 0
      ? Math.min(Math.round((totalSpentCost / activeBudgetAmount) * 100), 100)
      : 0;

  // Category breakdowns
  const accommodationVal = budget?.accommodationBudget ? parseFloat(budget.accommodationBudget) : 0;
  const foodVal = budget?.foodBudget ? parseFloat(budget.foodBudget) : 0;
  const transitVal = budget?.transportationBudget ? parseFloat(budget.transportationBudget) : 0;
  const activitiesVal = budget?.activitiesBudget ? parseFloat(budget.activitiesBudget) : 0;
  const emergencyVal = budget?.emergencyBudget ? parseFloat(budget.emergencyBudget) : 0;
  const totalAllocatedVal = budget?.totalAllocated ? parseFloat(budget.totalAllocated) : (accommodationVal + foodVal + transitVal + activitiesVal + emergencyVal);
  const unallocatedVal = budget?.remainingUnallocated ? parseFloat(budget.remainingUnallocated) : Math.max(0, activeBudgetAmount - totalAllocatedVal);

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="spinner"></div>
        <p>Loading trip overview, daily schedule, and budget command center...</p>
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
    <div className="page-container trip-details-page-container">
      {/* Top Navigation Bar */}
      <div className="trip-nav-bar">
        <Link to="/trips" className="btn-back-link">
          <ArrowLeft size={16} />
          <span>Back to All Trips</span>
        </Link>
        {trip.destination && (
          <Link
            to={`/destinations/${trip.destination.id}`}
            className="btn-destination-guide"
          >
            <MapPin size={14} />
            <span>View {trip.destination.name} Guide</span>
          </Link>
        )}
      </div>

      {/* Trip Overview Hero Banner */}
      <div className="trip-hero-card">
        <div className="trip-hero-background-img">
          <img
            src={
              trip.destination?.imageUrl ||
              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=80'
            }
            alt={trip.destination?.name || 'Destination'}
            className="hero-backdrop"
          />
          <div className="hero-backdrop-tint"></div>
        </div>

        <div className="trip-hero-content">
          <div className="trip-hero-top-row">
            <div className="trip-hero-badges">
              <div className="hero-dest-pill">
                <MapPin size={14} />
                <span>
                  {trip.destination
                    ? `${trip.destination.name}, ${trip.destination.country}`
                    : 'Custom Location'}
                </span>
              </div>
              {getStatusBadge(trip.status)}
            </div>

            {/* Quick Actions */}
            <div className="trip-hero-action-buttons">
              <button
                onClick={openCreateOrEditBudgetModal}
                className="btn-hero-budget-pill"
                title="Manage Trip Budget"
              >
                <Wallet size={15} />
                <span>{budget ? 'Edit Budget Plan' : 'Set Budget Plan'}</span>
              </button>
            </div>
          </div>

          <h1 className="trip-hero-title">{trip.title}</h1>
          {trip.description && <p className="trip-hero-desc">{trip.description}</p>}

          <div className="trip-hero-metrics-row">
            <div className="hero-metric-item">
              <Calendar size={18} />
              <div>
                <span className="metric-title">Dates</span>
                <span className="metric-val">
                  {trip.startDate} → {trip.endDate}
                </span>
              </div>
            </div>

            <div className="hero-metric-item">
              <Layers size={18} />
              <div>
                <span className="metric-title">Schedule</span>
                <span className="metric-val">
                  {days.length} Days • {totalActivitiesCount} Activities
                </span>
              </div>
            </div>

            <div className="hero-metric-item">
              <Coins size={18} />
              <div>
                <span className="metric-title">Total Budget ({activeCurrency})</span>
                <span className="metric-val">{formatMoney(activeBudgetAmount, activeCurrency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section View Tabs */}
      <div className="trip-section-nav" role="tablist" aria-label="Trip Views">
        <button
          role="tab"
          aria-selected={activeSection === 'all'}
          onClick={() => setActiveSection('all')}
          className={`section-tab-btn ${activeSection === 'all' ? 'active' : ''}`}
        >
          <Layers size={16} />
          <span>Full Dashboard</span>
        </button>
        <button
          role="tab"
          aria-selected={activeSection === 'budget'}
          onClick={() => setActiveSection('budget')}
          className={`section-tab-btn ${activeSection === 'budget' ? 'active' : ''}`}
        >
          <Wallet size={16} />
          <span>Budget & Financials</span>
          {budget && <span className="tab-pill-badge">{activeCurrency} {formatMoney(activeBudgetAmount, activeCurrency)}</span>}
        </button>
        <button
          role="tab"
          aria-selected={activeSection === 'itinerary'}
          onClick={() => setActiveSection('itinerary')}
          className={`section-tab-btn ${activeSection === 'itinerary' ? 'active' : ''}`}
        >
          <Calendar size={16} />
          <span>Daily Schedule ({days.length} Days)</span>
        </button>
      </div>

      {/* ====================================================================
          1. BUDGET MANAGEMENT & FINANCIAL COMMAND CENTER
          ==================================================================== */}
      {(activeSection === 'all' || activeSection === 'budget') && (
        <section className="budget-command-center-section" id="budget-hub">
          <div className="budget-section-header">
            <div className="budget-title-block">
              <div className="budget-section-icon-badge">
                <PiggyBank size={20} />
              </div>
              <div>
                <h2 className="budget-section-main-title">Trip Budget Management</h2>
                <p className="budget-section-subtitle">
                  Financial allocations, category breakdown, currency management, and live activity expense tracking.
                </p>
              </div>
            </div>

            <div className="budget-header-actions">
              {budget ? (
                <div className="budget-actions-group">
                  <button onClick={openCreateOrEditBudgetModal} className="btn-secondary btn-budget-edit">
                    <Edit2 size={14} />
                    <span>Edit Budget</span>
                  </button>
                  <button onClick={handleDeleteBudget} className="btn-danger-outline" title="Reset Budget Plan">
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={openCreateOrEditBudgetModal} className="btn-primary btn-budget-init">
                  <Plus size={16} />
                  <span>Create Budget Plan</span>
                </button>
              )}
            </div>
          </div>

          {!budget ? (
            /* Empty State for Budget */
            <div className="budget-empty-card">
              <div className="budget-empty-icon-wrap">
                <Wallet size={36} />
              </div>
              <h3 className="budget-empty-title">No Custom Budget Initialized</h3>
              <p className="budget-empty-desc">
                Set up a tailored financial plan for {trip.title}. Allocate target amounts for accommodation, food, transportation, activities, and emergency buffer.
              </p>
              <div className="budget-empty-perks">
                <span className="perk-item"><Percent size={13} /> Custom category limits</span>
                <span className="perk-item"><Coins size={13} /> Multi-currency support</span>
                <span className="perk-item"><TrendingDown size={13} /> Real-time activity burn rate</span>
              </div>
              <button onClick={openCreateOrEditBudgetModal} className="btn-primary mt-3">
                <Plus size={16} />
                <span>Initialize Trip Budget</span>
              </button>
            </div>
          ) : (
            /* Active Budget Showcase */
            <div className="budget-hub-grid">
              {/* Top Financial Key Metrics */}
              <div className="budget-key-metrics-card">
                <div className="metrics-card-top">
                  <div className="budget-tag-row">
                    <span className="currency-pill">
                      {budget.currency} ({getCurrencySymbol(budget.currency)})
                    </span>
                    {budget.category && (
                      <span className="tier-pill">
                        <Sparkles size={11} />
                        {budget.category}
                      </span>
                    )}
                  </div>
                  <span className="budget-last-updated">
                    Updated: {new Date(budget.updatedAt || budget.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="metrics-figures-row">
                  <div className="metric-big-box">
                    <span className="metric-box-label">Total Allocated Budget</span>
                    <span className="metric-box-value primary-gradient-text">
                      {formatMoney(budget.totalBudget, budget.currency)}
                    </span>
                  </div>

                  <div className="metric-big-box">
                    <span className="metric-box-label">Scheduled Activities Cost</span>
                    <span className="metric-box-value text-spent">
                      {formatMoney(totalSpentCost, budget.currency)}
                    </span>
                    <span className="metric-box-sub">
                      Across {totalActivitiesCount} planned activities
                    </span>
                  </div>

                  <div className="metric-big-box">
                    <span className="metric-box-label">Estimated Remaining Surplus</span>
                    <span className={`metric-box-value ${remainingBudget >= 0 ? 'text-surplus' : 'text-deficit'}`}>
                      {formatMoney(Math.abs(remainingBudget), budget.currency)} {remainingBudget < 0 ? 'Over' : 'Left'}
                    </span>
                    <span className="metric-box-sub">
                      {remainingBudget >= 0 ? `${100 - budgetSpentPercentage}% remaining` : 'Exceeds budget'}
                    </span>
                  </div>
                </div>

                {/* Main Progress Meter */}
                <div className="budget-visual-tracker">
                  <div className="tracker-labels-row">
                    <span>Overall Budget Consumption</span>
                    <span className="tracker-pct">{budgetSpentPercentage}% spent</span>
                  </div>
                  <div className="tracker-bar-track">
                    <div
                      className={`tracker-bar-fill ${budgetSpentPercentage > 90 ? 'fill-danger' : 'fill-primary'}`}
                      style={{ width: `${budgetSpentPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {budget.notes && (
                  <div className="budget-memo-box">
                    <span className="memo-title">Budget Notes / Strategy:</span>
                    <p className="memo-text">{budget.notes}</p>
                  </div>
                )}
              </div>

              {/* Category Allocation Tiles */}
              <div className="budget-categories-panel">
                <div className="categories-header-row">
                  <h3 className="categories-title">Category Allocations & Caps</h3>
                  <span className="allocated-sum-tag">
                    Allocated: {formatMoney(totalAllocatedVal, budget.currency)} / {formatMoney(budget.totalBudget, budget.currency)}
                  </span>
                </div>

                <div className="category-tiles-grid">
                  {/* Accommodation */}
                  <div className="category-tile stay-tile">
                    <div className="tile-icon-wrap stay-icon">
                      <Building2 size={18} />
                    </div>
                    <div className="tile-body">
                      <span className="tile-name">Accommodation</span>
                      <span className="tile-amount">{formatMoney(accommodationVal, budget.currency)}</span>
                      <span className="tile-sub">
                        {budget.totalBudget > 0 ? `${Math.round((accommodationVal / budget.totalBudget) * 100)}% of total` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Food & Dining */}
                  <div className="category-tile food-tile">
                    <div className="tile-icon-wrap food-icon">
                      <Utensils size={18} />
                    </div>
                    <div className="tile-body">
                      <span className="tile-name">Food & Dining</span>
                      <span className="tile-amount">{formatMoney(foodVal, budget.currency)}</span>
                      <span className="tile-sub">
                        {budget.totalBudget > 0 ? `${Math.round((foodVal / budget.totalBudget) * 100)}% of total` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Transportation */}
                  <div className="category-tile transit-tile">
                    <div className="tile-icon-wrap transit-icon">
                      <Plane size={18} />
                    </div>
                    <div className="tile-body">
                      <span className="tile-name">Transit & Flights</span>
                      <span className="tile-amount">{formatMoney(transitVal, budget.currency)}</span>
                      <span className="tile-sub">
                        {budget.totalBudget > 0 ? `${Math.round((transitVal / budget.totalBudget) * 100)}% of total` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="category-tile acts-tile">
                    <div className="tile-icon-wrap acts-icon">
                      <Ticket size={18} />
                    </div>
                    <div className="tile-body">
                      <span className="tile-name">Activities & Tours</span>
                      <span className="tile-amount">{formatMoney(activitiesVal, budget.currency)}</span>
                      <span className="tile-sub">
                        Actual Scheduled: {formatMoney(totalSpentCost, budget.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Emergency Buffer */}
                  <div className="category-tile buffer-tile">
                    <div className="tile-icon-wrap buffer-icon">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="tile-body">
                      <span className="tile-name">Emergency Buffer</span>
                      <span className="tile-amount">{formatMoney(emergencyVal, budget.currency)}</span>
                      <span className="tile-sub">
                        {budget.totalBudget > 0 ? `${Math.round((emergencyVal / budget.totalBudget) * 100)}% of total` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Unallocated Contingency */}
                  <div className="category-tile unallocated-tile">
                    <div className="tile-icon-wrap unalloc-icon">
                      <Percent size={18} />
                    </div>
                    <div className="tile-body">
                      <span className="tile-name">Unallocated Surplus</span>
                      <span className="tile-amount">{formatMoney(unallocatedVal, budget.currency)}</span>
                      <span className="tile-sub">Flexible Reserve</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          2. ITINERARY SCHEDULE & ACTIVITIES SECTION
          ==================================================================== */}
      {(activeSection === 'all' || activeSection === 'itinerary') && (
        <section className="itinerary-section" id="itinerary-schedule">
          <div className="itinerary-section-header">
            <div>
              <h2 className="itinerary-main-heading">Day-by-Day Itinerary</h2>
              <p className="itinerary-subheading">
                Organize sightseeing stops, scheduled tours, dining reservations, and travel notes.
              </p>
            </div>
            <button onClick={openAddDayModal} className="btn-primary btn-add-day">
              <Plus size={16} />
              <span>Add Day</span>
            </button>
          </div>

          {days.length === 0 ? (
            <div className="empty-itinerary-card">
              <Calendar size={44} className="empty-icon" />
              <h3>No days created yet</h3>
              <p>Start outlining your trip by adding Day 1 to your schedule.</p>
              <button onClick={openAddDayModal} className="btn-primary mt-3">
                <Plus size={16} />
                <span>Add Day 1</span>
              </button>
            </div>
          ) : (
            <div className="itinerary-days-timeline">
              {days.map((day) => {
                const dayCost = (day.activities || []).reduce(
                  (sum, a) => sum + (a.cost ? parseFloat(a.cost) : 0),
                  0
                );

                return (
                  <div key={day.id} className="itinerary-day-card">
                    <div className="day-card-header">
                      <div className="day-header-left">
                        <span className="day-pill">Day {day.dayNumber}</span>
                        <div className="day-title-block">
                          <h3 className="day-title">{day.title || `Day ${day.dayNumber}`}</h3>
                          {day.date && <span className="day-date-badge">{day.date}</span>}
                        </div>
                      </div>

                      <div className="day-header-right">
                        {dayCost > 0 && (
                          <span className="day-cost-subtotal">
                            <Receipt size={13} />
                            <span>{formatMoney(dayCost, activeCurrency)}</span>
                          </span>
                        )}
                        <button
                          onClick={() => openAddActivityModal(day.id)}
                          className="btn-add-activity-pill"
                          title="Add Activity to Day"
                        >
                          <Plus size={14} />
                          <span>Add Activity</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDay(day.id, day.title || `Day ${day.dayNumber}`)}
                          className="btn-delete-day"
                          title="Delete Day"
                          aria-label="Delete Day"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Activities list for this day */}
                    <div className="activities-container">
                      {!day.activities || day.activities.length === 0 ? (
                        <div className="no-activities-box">
                          <p>No activities scheduled for this day yet.</p>
                          <button
                            onClick={() => openAddActivityModal(day.id)}
                            className="btn-inline-add-act"
                          >
                            <Plus size={13} />
                            <span>Schedule an activity</span>
                          </button>
                        </div>
                      ) : (
                        <div className="activities-timeline">
                          {day.activities.map((act) => (
                            <div key={act.id} className="activity-card-row">
                              <div className="act-time-col">
                                <Clock size={13} className="act-clock-icon" />
                                <span className="act-time-text">{act.time || 'Anytime'}</span>
                              </div>

                              <div className="act-content-col">
                                <div className="act-header-line">
                                  <h4 className="act-title">{act.title}</h4>
                                  {act.cost && (
                                    <span className="act-cost-badge">
                                      <span>{formatMoney(act.cost, activeCurrency)}</span>
                                    </span>
                                  )}
                                </div>

                                {act.location && (
                                  <div className="act-location-row">
                                    <MapPin size={12} className="loc-pin" />
                                    <span>{act.location}</span>
                                  </div>
                                )}

                                {act.description && (
                                  <p className="act-description-text">{act.description}</p>
                                )}
                              </div>

                              <div className="act-actions-col">
                                <button
                                  onClick={() => openEditActivityModal(day.id, act)}
                                  className="btn-act-btn"
                                  title="Edit Activity"
                                  aria-label="Edit Activity"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(act.id, act.title)}
                                  className="btn-act-btn btn-act-btn-delete"
                                  title="Delete Activity"
                                  aria-label="Delete Activity"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          3. BUDGET MANAGEMENT MODAL (Create & Edit)
          ==================================================================== */}
      {isBudgetModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBudgetModalOpen(false);
          }}
        >
          <div
            className="modal-container modal-container-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-modal-title"
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <div className="modal-title-icon-wrap">
                  <Wallet size={20} />
                </div>
                <div>
                  <h2 id="budget-modal-title">
                    {budget ? 'Edit Trip Budget & Financial Allocations' : 'Set Up Trip Budget Plan'}
                  </h2>
                  <span className="modal-subtitle">
                    Configure your total spend, currency, and category limits for {trip.title}.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="btn-close-modal"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="alert-box alert-error mb-3">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleBudgetSubmit} className="modal-form">
              {/* Primary Budget Row */}
              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="totalBudget">Total Trip Budget *</label>
                  <div className="input-with-icon">
                    <span className="field-prefix-symbol">
                      {getCurrencySymbol(budgetFormData.currency)}
                    </span>
                    <input
                      id="totalBudget"
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="e.g. 2500"
                      value={budgetFormData.totalBudget}
                      onChange={(e) => setBudgetFormData({ ...budgetFormData, totalBudget: e.target.value })}
                      required
                      className="form-input with-left-prefix"
                    />
                  </div>
                </div>

                <div className="form-group half-width">
                  <label htmlFor="budgetCurrency">Preferred Currency *</label>
                  <select
                    id="budgetCurrency"
                    value={budgetFormData.currency}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, currency: e.target.value })}
                    required
                    className="form-input form-select"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Tier Selector */}
              <div className="form-group">
                <label htmlFor="budgetTier">Travel Budget Style / Tier</label>
                <select
                  id="budgetTier"
                  value={budgetFormData.category}
                  onChange={(e) => setBudgetFormData({ ...budgetFormData, category: e.target.value })}
                  className="form-input form-select"
                >
                  {BUDGET_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Split Helper */}
              <div className="quick-split-helper-section">
                <span className="helper-label">
                  <Percent size={13} />
                  <span>Smart Allocation Presets (Auto-fills category values):</span>
                </span>
                <div className="quick-split-buttons">
                  <button
                    type="button"
                    className="btn-preset-split"
                    onClick={() => applyQuickSplit({ stay: 0.35, food: 0.25, transit: 0.20, acts: 0.15, buffer: 0.05 })}
                  >
                    Standard (35% Stay / 25% Food / 20% Travel / 15% Acts / 5% Buffer)
                  </button>
                  <button
                    type="button"
                    className="btn-preset-split"
                    onClick={() => applyQuickSplit({ stay: 0.45, food: 0.25, transit: 0.15, acts: 0.10, buffer: 0.05 })}
                  >
                    Resort / Luxury Focus (45% Stay)
                  </button>
                  <button
                    type="button"
                    className="btn-preset-split"
                    onClick={() => applyQuickSplit({ stay: 0.25, food: 0.30, transit: 0.20, acts: 0.20, buffer: 0.05 })}
                  >
                    Explorer & Foodie (30% Food / 20% Acts)
                  </button>
                </div>
              </div>

              {/* Category Inputs Grid */}
              <div className="modal-category-inputs-grid">
                <div className="form-group">
                  <label htmlFor="stayBudget">🏨 Stay & Lodging</label>
                  <input
                    id="stayBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 800"
                    value={budgetFormData.accommodationBudget}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, accommodationBudget: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="foodBudget">🍽️ Food & Dining</label>
                  <input
                    id="foodBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 500"
                    value={budgetFormData.foodBudget}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, foodBudget: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="transitBudget">✈️ Transit & Flights</label>
                  <input
                    id="transitBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 400"
                    value={budgetFormData.transportationBudget}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, transportationBudget: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="actsBudget">🎟️ Tours & Activities</label>
                  <input
                    id="actsBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 350"
                    value={budgetFormData.activitiesBudget}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, activitiesBudget: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bufferBudget">🛡️ Emergency Buffer</label>
                  <input
                    id="bufferBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 150"
                    value={budgetFormData.emergencyBudget}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, emergencyBudget: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label htmlFor="budgetNotes">Financial Notes / Currency Strategy</label>
                <textarea
                  id="budgetNotes"
                  rows={2}
                  placeholder="e.g. Bring local cash for street markets, use travel credit card for hotels..."
                  value={budgetFormData.notes}
                  onChange={(e) => setBudgetFormData({ ...budgetFormData, notes: e.target.value })}
                  className="form-input form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={budgetModalLoading} className="btn-primary">
                  {budgetModalLoading
                    ? 'Saving Budget...'
                    : budget
                    ? 'Save Changes'
                    : 'Save & Initialize Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Day Modal */}
      {isDayModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDayModalOpen(false);
          }}
        >
          <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="day-modal-title">
            <div className="modal-header">
              <h2 id="day-modal-title">Add Itinerary Day</h2>
              <button
                onClick={() => setIsDayModalOpen(false)}
                className="btn-close-modal"
                aria-label="Close dialog"
              >
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
                <label htmlFor="dayTitle">Day Title / Theme</label>
                <input
                  id="dayTitle"
                  type="text"
                  placeholder="e.g. City Center Walking Tour & Museum Visit"
                  value={dayFormData.title}
                  onChange={(e) => setDayFormData({ ...dayFormData, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsDayModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={dayModalLoading} className="btn-primary">
                  {dayModalLoading ? 'Adding...' : 'Add Day to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Activity Modal */}
      {isActivityModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsActivityModalOpen(false);
          }}
        >
          <div
            className="modal-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-modal-title"
          >
            <div className="modal-header">
              <h2 id="activity-modal-title">
                {editingActivityId ? 'Edit Activity Details' : 'Add New Activity'}
              </h2>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="btn-close-modal"
                aria-label="Close dialog"
              >
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
                <label htmlFor="actTitle">Activity Name / Event *</label>
                <input
                  id="actTitle"
                  type="text"
                  placeholder="e.g. Visit Louvre Museum & Mona Lisa"
                  value={activityFormData.title}
                  onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="actTime">Scheduled Time</label>
                  <input
                    id="actTime"
                    type="text"
                    placeholder="e.g. 10:30 AM or Afternoon"
                    value={activityFormData.time}
                    onChange={(e) => setActivityFormData({ ...activityFormData, time: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group half-width">
                  <label htmlFor="actCost">Estimated Cost ({activeCurrency})</label>
                  <input
                    id="actCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 35"
                    value={activityFormData.cost}
                    onChange={(e) => setActivityFormData({ ...activityFormData, cost: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="actLocation">Location / Meeting Point</label>
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
                <label htmlFor="actDesc">Notes / Ticket Info</label>
                <textarea
                  id="actDesc"
                  rows={3}
                  placeholder="Booking reference #12345, meet tour guide by pyramid entrance..."
                  value={activityFormData.description}
                  onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
                  className="form-input form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={activityModalLoading} className="btn-primary">
                  {activityModalLoading
                    ? 'Saving...'
                    : editingActivityId
                    ? 'Save Changes'
                    : 'Add Activity'}
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

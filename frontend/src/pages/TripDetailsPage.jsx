import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tripApi } from '../api/tripApi';
import { itineraryApi } from '../api/itineraryApi';
import { budgetApi } from '../api/budgetApi';
import { expenseApi } from '../api/expenseApi';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Clock,
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
  Coins,
  ShoppingBag,
  CreditCard,
  Search,
  ExternalLink,
  PieChart,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle);

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

const FIXED_EXPENSE_CATEGORIES = [
  { id: 'Transportation', label: 'Transportation', icon: Plane, color: '#0ea5e9', emoji: '✈️' },
  { id: 'Hotel', label: 'Hotel', icon: Building2, color: '#6366f1', emoji: '🏨' },
  { id: 'Food', label: 'Food', icon: Utensils, color: '#f59e0b', emoji: '🍜' },
  { id: 'Shopping', label: 'Shopping', icon: ShoppingBag, color: '#ec4899', emoji: '🛍️' },
  { id: 'Entertainment', label: 'Entertainment', icon: Ticket, color: '#8b5cf6', emoji: '🎟️' },
  { id: 'Miscellaneous', label: 'Miscellaneous', icon: Receipt, color: '#10b981', emoji: '🏷️' },
];

const BUDGET_TIERS = ['Backpacker / Budget', 'Smart Mid-Range', 'Comfort & Boutique', 'Luxury Escape', 'Business / Work'];

const TripDetailsPage = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categorySummaries, setCategorySummaries] = useState([]);
  const [budgetExpenseSummary, setBudgetExpenseSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active view section
  const [activeSection, setActiveSection] = useState('all'); // 'all', 'budget_expenses', 'itinerary'

  // Expense Filter & Search
  const [expenseFilterCategory, setExpenseFilterCategory] = useState('ALL');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [chartType, setChartType] = useState('doughnut'); // 'doughnut' | 'bar'

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

  // Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    category: 'Food',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    receiptUrl: '',
    description: '',
  });
  const [expenseModalLoading, setExpenseModalLoading] = useState(false);

  const [modalError, setModalError] = useState('');
  const { showToast } = useToast();

  // Chart ref
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const loadTripData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tripData, daysData, budgetData, expensesData, catSummaryData, bSummaryData] = await Promise.all([
        tripApi.getTripById(id),
        itineraryApi.getItineraryForTrip(id),
        budgetApi.getBudget(id).catch(() => null),
        expenseApi.getExpenses(id).catch(() => []),
        expenseApi.getCategorySummary(id).catch(() => []),
        expenseApi.getRemainingBudget(id).catch(() => null),
      ]);
      setTrip(tripData);
      setDays(daysData || []);
      setBudget(budgetData);
      setExpenses(expensesData || []);
      setCategorySummaries(catSummaryData || []);
      setBudgetExpenseSummary(bSummaryData);
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
  const activeCurrencyCode = budget?.currency || budgetExpenseSummary?.currency || 'USD';

  const getCurrencySymbol = (code = activeCurrencyCode) => {
    const match = CURRENCIES.find((c) => c.code === code.toUpperCase());
    return match ? match.symbol : '$';
  };

  const formatMoney = (val, code = activeCurrencyCode) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    const sym = getCurrencySymbol(code);
    return `${sym}${Math.round(num).toLocaleString()}`;
  };

  // Render & Update Chart.js Instance
  useEffect(() => {
    if (!chartCanvasRef.current) return;

    // Cleanup previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!categorySummaries || categorySummaries.length === 0) return;

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = categorySummaries.map((c) => c.category);
    const dataValues = categorySummaries.map((c) => (c.totalAmount ? parseFloat(c.totalAmount) : 0));

    // Map category colors
    const colors = categorySummaries.map((c) => {
      const match = FIXED_EXPENSE_CATEGORIES.find(
        (cat) => cat.id.toLowerCase() === c.category.toLowerCase()
      );
      return match ? match.color : '#94a3b8';
    });

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f8fafc' : '#0f172a';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    if (chartType === 'doughnut') {
      chartInstanceRef.current = new ChartJS(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: dataValues,
              backgroundColor: colors,
              borderColor: isDark ? '#111827' : '#ffffff',
              borderWidth: 3,
              hoverOffset: 8,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(15, 23, 42, 0.9)',
              titleColor: '#ffffff',
              bodyColor: '#f1f5f9',
              padding: 12,
              cornerRadius: 10,
              boxPadding: 6,
              callbacks: {
                label: (item) => {
                  const val = item.raw || 0;
                  const sym = getCurrencySymbol(activeCurrencyCode);
                  const total = dataValues.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                  return ` ${item.label}: ${sym}${val.toLocaleString()} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    } else {
      chartInstanceRef.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: `Amount (${activeCurrencyCode})`,
              data: dataValues,
              backgroundColor: colors,
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(15, 23, 42, 0.9)',
              titleColor: '#ffffff',
              bodyColor: '#f1f5f9',
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (item) => {
                  const val = item.raw || 0;
                  const sym = getCurrencySymbol(activeCurrencyCode);
                  return ` ${item.label}: ${sym}${val.toLocaleString()}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' } },
            },
            y: {
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                callback: (val) => `${getCurrencySymbol(activeCurrencyCode)}${val}`,
                font: { family: "'Plus Jakarta Sans', sans-serif" },
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [categorySummaries, chartType, activeCurrencyCode]);

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
      const fallbackTotal = trip?.budget ? String(trip.budget) : (trip?.destination?.averageCost ? String(trip.destination.averageCost) : '2500');
      const totNum = parseFloat(fallbackTotal) || 2500;
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
      setModalError(`Total of categories (${getCurrencySymbol(budgetFormData.currency)}${sumAllocated.toLocaleString()}) exceeds overall budget (${getCurrencySymbol(budgetFormData.currency)}${tot.toLocaleString()}). Please adjust allocations.`);
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

  // ==========================================
  // EXPENSE HANDLERS
  // ==========================================
  const openAddExpenseModal = () => {
    setEditingExpenseId(null);
    setExpenseFormData({
      title: '',
      category: 'Food',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      receiptUrl: '',
      description: '',
    });
    setModalError('');
    setIsExpenseModalOpen(true);
  };

  const openEditExpenseModal = (exp) => {
    setEditingExpenseId(exp.id);
    setExpenseFormData({
      title: exp.title || '',
      category: exp.category || 'Food',
      amount: exp.amount ? String(exp.amount) : '',
      expenseDate: exp.expenseDate || new Date().toISOString().split('T')[0],
      receiptUrl: exp.receiptUrl || '',
      description: exp.description || '',
    });
    setModalError('');
    setIsExpenseModalOpen(true);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!expenseFormData.title.trim()) {
      setModalError('Expense title is required.');
      return;
    }

    const amt = parseFloat(expenseFormData.amount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setModalError('Expense amount must be a positive number greater than zero.');
      return;
    }

    if (!expenseFormData.expenseDate) {
      setModalError('Expense date is required.');
      return;
    }

    setExpenseModalLoading(true);

    try {
      const payload = {
        title: expenseFormData.title.trim(),
        category: expenseFormData.category,
        amount: amt,
        expenseDate: expenseFormData.expenseDate,
        receiptUrl: expenseFormData.receiptUrl.trim() || null,
        description: expenseFormData.description.trim() || null,
      };

      if (editingExpenseId) {
        await expenseApi.updateExpense(id, editingExpenseId, payload);
        showToast('Expense updated successfully!', 'success');
      } else {
        await expenseApi.createExpense(id, payload);
        showToast('New expense logged in trip ledger!', 'success');
      }

      setIsExpenseModalOpen(false);
      await loadTripData();
    } catch (err) {
      console.error('Failed to save expense:', err);
      const msg = err.response?.data?.message || 'Failed to save expense.';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setExpenseModalLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId, expenseTitle) => {
    if (window.confirm(`Delete expense "${expenseTitle}"?`)) {
      try {
        await expenseApi.deleteExpense(id, expenseId);
        showToast(`Expense "${expenseTitle}" removed`, 'info');
        await loadTripData();
      } catch (err) {
        console.error('Failed to delete expense:', err);
        showToast(err.response?.data?.message || 'Failed to delete expense.', 'error');
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

  const activeBudgetAmount = budgetExpenseSummary?.totalBudget
    ? parseFloat(budgetExpenseSummary.totalBudget)
    : budget?.totalBudget
    ? parseFloat(budget.totalBudget)
    : trip?.budget || 0;

  const totalSpentExpenses = budgetExpenseSummary?.totalExpenses
    ? parseFloat(budgetExpenseSummary.totalExpenses)
    : expenses.reduce((sum, e) => sum + (e.amount ? parseFloat(e.amount) : 0), 0);

  const remainingBudgetAmount = budgetExpenseSummary?.remainingBudget !== undefined
    ? parseFloat(budgetExpenseSummary.remainingBudget)
    : activeBudgetAmount - totalSpentExpenses;

  const isOverBudget = remainingBudgetAmount < 0;
  const budgetSpentPct =
    activeBudgetAmount > 0
      ? Math.min(Math.round((totalSpentExpenses / activeBudgetAmount) * 100), 100)
      : 0;

  // Filtered expenses list
  const filteredExpenses = expenses.filter((e) => {
    const matchesCategory =
      expenseFilterCategory === 'ALL' ||
      e.category?.toLowerCase() === expenseFilterCategory.toLowerCase();
    const matchesSearch =
      !expenseSearchQuery ||
      e.title?.toLowerCase().includes(expenseSearchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(expenseSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="spinner"></div>
        <p>Loading trip details, budget ledger, and expenses...</p>
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

            {/* Hero Quick Actions */}
            <div className="trip-hero-action-buttons">
              <button
                onClick={openAddExpenseModal}
                className="btn-hero-expense-pill"
                title="Log New Expense"
              >
                <Plus size={15} />
                <span>Log Expense</span>
              </button>
              <button
                onClick={openCreateOrEditBudgetModal}
                className="btn-hero-budget-pill"
                title="Manage Trip Budget"
              >
                <Wallet size={15} />
                <span>{budget ? 'Edit Budget' : 'Set Budget'}</span>
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
              <CreditCard size={18} />
              <div>
                <span className="metric-title">Expenses Logged</span>
                <span className="metric-val">
                  {formatMoney(totalSpentExpenses, activeCurrencyCode)} ({expenses.length} records)
                </span>
              </div>
            </div>

            <div className="hero-metric-item">
              <Coins size={18} />
              <div>
                <span className="metric-title">Remaining Budget</span>
                <span className={`metric-val ${isOverBudget ? 'text-deficit' : 'text-surplus'}`}>
                  {formatMoney(Math.abs(remainingBudgetAmount), activeCurrencyCode)} {isOverBudget ? 'Deficit' : 'Surplus'}
                </span>
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
          aria-selected={activeSection === 'budget_expenses'}
          onClick={() => setActiveSection('budget_expenses')}
          className={`section-tab-btn ${activeSection === 'budget_expenses' ? 'active' : ''}`}
        >
          <Receipt size={16} />
          <span>Budget & Expense Ledger</span>
          {expenses.length > 0 && (
            <span className="tab-pill-badge">{expenses.length} logged</span>
          )}
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
          1. REDESIGNED BUDGET & EXPENSE TRACKING MODULE (HUMAN TRAVEL JOURNAL)
          ==================================================================== */}
      {(activeSection === 'all' || activeSection === 'budget_expenses') && (
        <section className="travel-ledger-section" id="budget-expenses-hub">
          {/* Section Banner */}
          <div className="ledger-header-panel">
            <div className="ledger-title-group">
              <div className="ledger-passport-stamp">
                <PiggyBank size={22} />
              </div>
              <div>
                <div className="ledger-badge-row">
                  <span className="passport-sub-tag">Voyage Financial Passport</span>
                  <span className="currency-tag-stamp">
                    {activeCurrencyCode} ({getCurrencySymbol(activeCurrencyCode)})
                  </span>
                </div>
                <h2 className="ledger-main-title">Trip Budget & Live Expense Ledger</h2>
                <p className="ledger-subtitle">
                  Track real travel expenses, categorize expenditures, monitor category burn rates, and verify your live remaining budget balance.
                </p>
              </div>
            </div>

            <div className="ledger-cta-group">
              <button onClick={openAddExpenseModal} className="btn-primary btn-log-expense">
                <Plus size={16} />
                <span>Log Expense</span>
              </button>
              <button onClick={openCreateOrEditBudgetModal} className="btn-secondary btn-adjust-budget">
                <Edit2 size={14} />
                <span>{budget ? 'Adjust Budget' : 'Set Budget'}</span>
              </button>
              {budget && (
                <button
                  onClick={handleDeleteBudget}
                  className="btn-icon-action btn-delete-expense"
                  title="Reset Budget Plan"
                  aria-label="Reset Budget Plan"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Top 3 Financial Passport Cards */}
          <div className="passport-finance-grid">
            {/* Total Budget Card */}
            <div className="passport-card budget-vault-card">
              <div className="passport-card-header">
                <span className="card-micro-label">Total Allocated Budget</span>
                <div className="card-icon-bubble vault-bubble">
                  <Wallet size={18} />
                </div>
              </div>
              <div className="passport-amount-display">
                <span className="passport-currency-symbol">{getCurrencySymbol(activeCurrencyCode)}</span>
                <span className="passport-amount-number">
                  {Math.round(activeBudgetAmount).toLocaleString()}
                </span>
              </div>
              <div className="passport-card-footer">
                <span className="footer-status-tag">
                  {budget?.category || 'Custom Plan'}
                </span>
                <button onClick={openCreateOrEditBudgetModal} className="card-link-action">
                  Edit Plan <ArrowUpRight size={13} />
                </button>
              </div>
            </div>

            {/* Total Expenses Card */}
            <div className="passport-card expenses-spent-card">
              <div className="passport-card-header">
                <span className="card-micro-label">Total Money Spent</span>
                <div className="card-icon-bubble spent-bubble">
                  <TrendingDown size={18} />
                </div>
              </div>
              <div className="passport-amount-display">
                <span className="passport-currency-symbol">{getCurrencySymbol(activeCurrencyCode)}</span>
                <span className="passport-amount-number text-spent">
                  {Math.round(totalSpentExpenses).toLocaleString()}
                </span>
              </div>
              <div className="passport-card-footer">
                <span className="footer-status-tag">
                  {expenses.length} receipts & expenses logged
                </span>
                <span className="burn-rate-tag">
                  {budgetSpentPct}% consumed
                </span>
              </div>
            </div>

            {/* Remaining Balance Card */}
            <div className={`passport-card balance-card ${isOverBudget ? 'card-deficit-state' : 'card-surplus-state'}`}>
              <div className="passport-card-header">
                <span className="card-micro-label">Remaining Safe Balance</span>
                <div className={`card-icon-bubble ${isOverBudget ? 'deficit-bubble' : 'surplus-bubble'}`}>
                  {isOverBudget ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                </div>
              </div>
              <div className="passport-amount-display">
                <span className="passport-currency-symbol">{getCurrencySymbol(activeCurrencyCode)}</span>
                <span className={`passport-amount-number ${isOverBudget ? 'text-deficit' : 'text-surplus'}`}>
                  {Math.round(Math.abs(remainingBudgetAmount)).toLocaleString()}
                </span>
              </div>
              <div className="passport-card-footer">
                <span className={`footer-status-tag ${isOverBudget ? 'badge-deficit' : 'badge-surplus'}`}>
                  {isOverBudget ? 'Exceeds Total Budget' : 'Safe Spending Margin'}
                </span>
                <span className="balance-pct-tag">
                  {isOverBudget ? 'Over Budget' : `${100 - budgetSpentPct}% left`}
                </span>
              </div>
            </div>
          </div>

          {/* Middle Row: Category Chart & Breakdown Analysis */}
          <div className="ledger-analytics-split">
            {/* Chart Column */}
            <div className="analytics-card chart-analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-title-wrap">
                  <PieChart size={18} className="analytics-icon" />
                  <div>
                    <h3 className="analytics-title">Spending by Category</h3>
                    <span className="analytics-sub">Live visual distribution from category API</span>
                  </div>
                </div>

                <div className="chart-type-toggle">
                  <button
                    onClick={() => setChartType('doughnut')}
                    className={`chart-type-btn ${chartType === 'doughnut' ? 'active' : ''}`}
                    title="Doughnut Chart"
                    aria-label="Doughnut Chart View"
                  >
                    <PieChart size={14} />
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                    title="Bar Chart"
                    aria-label="Bar Chart View"
                  >
                    <BarChart3 size={14} />
                  </button>
                </div>
              </div>

              {categorySummaries.length === 0 ? (
                <div className="chart-empty-state">
                  <Receipt size={36} className="empty-chart-icon" />
                  <h4>No Category Expenses Yet</h4>
                  <p>Log your first travel expense to unlock live visual spending analytics.</p>
                  <button onClick={openAddExpenseModal} className="btn-primary mt-2">
                    <Plus size={14} />
                    <span>Log First Expense</span>
                  </button>
                </div>
              ) : (
                <div className="chart-canvas-container">
                  <div className="canvas-wrapper">
                    <canvas ref={chartCanvasRef} />
                  </div>

                  {/* Bespoke Category Legend Grid */}
                  <div className="category-legend-grid">
                    {categorySummaries.map((catSummary) => {
                      const matchedCat = FIXED_EXPENSE_CATEGORIES.find(
                        (c) => c.id.toLowerCase() === catSummary.category.toLowerCase()
                      ) || { color: '#94a3b8', emoji: '🏷️' };

                      return (
                        <div key={catSummary.category} className="legend-chip">
                          <span
                            className="legend-color-dot"
                            style={{ backgroundColor: matchedCat.color }}
                          ></span>
                          <span className="legend-cat-name">
                            {matchedCat.emoji} {catSummary.category}
                          </span>
                          <span className="legend-cat-amt">
                            {formatMoney(catSummary.totalAmount, activeCurrencyCode)}
                          </span>
                          {catSummary.percentage !== undefined && (
                            <span className="legend-cat-pct">{catSummary.percentage}%</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Budget Categories vs Real Expenses Comparison */}
            <div className="analytics-card budget-vs-actual-card">
              <div className="analytics-card-header">
                <div className="analytics-title-wrap">
                  <Coins size={18} className="analytics-icon" />
                  <div>
                    <h3 className="analytics-title">Category Allocations & Burn</h3>
                    <span className="analytics-sub">Planned target vs logged expense</span>
                  </div>
                </div>
              </div>

              <div className="category-burn-list">
                {FIXED_EXPENSE_CATEGORIES.map((fc) => {
                  // Find planned amount from budget
                  let planned = 0;
                  if (budget) {
                    if (fc.id === 'Hotel') planned = parseFloat(budget.accommodationBudget) || 0;
                    if (fc.id === 'Food') planned = parseFloat(budget.foodBudget) || 0;
                    if (fc.id === 'Transportation') planned = parseFloat(budget.transportationBudget) || 0;
                    if (fc.id === 'Entertainment') planned = parseFloat(budget.activitiesBudget) || 0;
                    if (fc.id === 'Miscellaneous') planned = parseFloat(budget.emergencyBudget) || 0;
                  }

                  // Find actual spent
                  const actualObj = categorySummaries.find(
                    (cs) => cs.category.toLowerCase() === fc.id.toLowerCase()
                  );
                  const actual = actualObj ? parseFloat(actualObj.totalAmount) : 0;
                  const ratio = planned > 0 ? Math.min(Math.round((actual / planned) * 100), 100) : (actual > 0 ? 100 : 0);

                  const IconComp = fc.icon;

                  return (
                    <div key={fc.id} className="category-burn-row">
                      <div className="burn-row-header">
                        <div className="burn-cat-title">
                          <span className="burn-cat-icon" style={{ color: fc.color }}>
                            <IconComp size={15} />
                          </span>
                          <span className="burn-cat-text">{fc.label}</span>
                        </div>
                        <div className="burn-numbers">
                          <span className="burn-spent-num">{formatMoney(actual, activeCurrencyCode)}</span>
                          {planned > 0 && (
                            <span className="burn-planned-num">/ {formatMoney(planned, activeCurrencyCode)}</span>
                          )}
                        </div>
                      </div>

                      <div className="burn-progress-track">
                        <div
                          className="burn-progress-fill"
                          style={{
                            width: `${ratio}%`,
                            backgroundColor: ratio > 90 ? '#ef4444' : fc.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ====================================================================
              TRAVEL EXPENSE JOURNAL & LEDGER
              ==================================================================== */}
          <div className="expense-journal-container">
            <div className="journal-toolbar">
              <div className="journal-toolbar-left">
                <h3 className="journal-title">Expense Transactions</h3>
                <span className="journal-count-badge">
                  {filteredExpenses.length} {filteredExpenses.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              <div className="journal-toolbar-right">
                {/* Search */}
                <div className="journal-search-wrap">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={expenseSearchQuery}
                    onChange={(e) => setExpenseSearchQuery(e.target.value)}
                    className="journal-search-input"
                  />
                  {expenseSearchQuery && (
                    <button
                      onClick={() => setExpenseSearchQuery('')}
                      className="search-clear-btn"
                      aria-label="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Add Expense Button */}
                <button onClick={openAddExpenseModal} className="btn-primary btn-add-expense-sm">
                  <Plus size={14} />
                  <span>Log Expense</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="category-filter-pills" role="tablist" aria-label="Filter expenses by category">
              <button
                onClick={() => setExpenseFilterCategory('ALL')}
                className={`filter-pill ${expenseFilterCategory === 'ALL' ? 'active' : ''}`}
              >
                All Categories
              </button>
              {FIXED_EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setExpenseFilterCategory(cat.id)}
                  className={`filter-pill ${expenseFilterCategory === cat.id ? 'active' : ''}`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Expense Rows List */}
            {filteredExpenses.length === 0 ? (
              <div className="journal-empty-state">
                <Receipt size={40} className="journal-empty-icon" />
                <h4>No Expenses Found</h4>
                <p>
                  {expenseSearchQuery || expenseFilterCategory !== 'ALL'
                    ? 'No expense matches the selected filter or search query.'
                    : 'No expenses have been recorded for this trip yet.'}
                </p>
                <button onClick={openAddExpenseModal} className="btn-primary mt-3">
                  <Plus size={15} />
                  <span>Log an Expense</span>
                </button>
              </div>
            ) : (
              <div className="journal-rows-list">
                {filteredExpenses.map((exp) => {
                  const matchedCat = FIXED_EXPENSE_CATEGORIES.find(
                    (c) => c.id.toLowerCase() === exp.category?.toLowerCase()
                  ) || { color: '#94a3b8', emoji: '🏷️', icon: Receipt };
                  const CatIcon = matchedCat.icon;

                  return (
                    <div key={exp.id} className="expense-journal-row">
                      <div className="expense-category-avatar" style={{ backgroundColor: `${matchedCat.color}20`, color: matchedCat.color }}>
                        <CatIcon size={18} />
                      </div>

                      <div className="expense-main-info">
                        <div className="expense-title-line">
                          <h4 className="expense-name">{exp.title}</h4>
                          <span className="expense-cat-badge" style={{ borderColor: `${matchedCat.color}40`, color: matchedCat.color }}>
                            {matchedCat.emoji} {exp.category}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="expense-description-text">{exp.description}</p>
                        )}
                        <div className="expense-meta-line">
                          <span className="expense-date-stamp">
                            <Calendar size={12} />
                            <span>{exp.expenseDate}</span>
                          </span>
                          <span className="expense-payer-stamp">
                            <span>Paid by:</span>
                            <strong>{exp.payerName || 'Traveler'}</strong>
                          </span>
                          {exp.receiptUrl && (
                            <a
                              href={exp.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="expense-receipt-link"
                              title="Open receipt in new tab"
                            >
                              <ExternalLink size={12} />
                              <span>View Receipt</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="expense-amount-actions">
                        <div className="expense-price-block">
                          <span className="expense-price-val">
                            {formatMoney(exp.amount, activeCurrencyCode)}
                          </span>
                        </div>

                        <div className="expense-actions-wrap">
                          <button
                            onClick={() => openEditExpenseModal(exp)}
                            className="btn-icon-action btn-edit-expense"
                            title="Edit Expense"
                            aria-label="Edit Expense"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id, exp.title)}
                            className="btn-icon-action btn-delete-expense"
                            title="Delete Expense"
                            aria-label="Delete Expense"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
                            <span>{formatMoney(dayCost, activeCurrencyCode)}</span>
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
                                      {formatMoney(act.cost, activeCurrencyCode)}
                                    </span>
                                  )}
                                </div>
                                {act.location && (
                                  <div className="act-location-row">
                                    <MapPin size={12} />
                                    <span>{act.location}</span>
                                  </div>
                                )}
                                {act.description && (
                                  <p className="act-desc-text">{act.description}</p>
                                )}
                              </div>

                              <div className="act-actions-col">
                                <button
                                  onClick={() => openEditActivityModal(day.id, act)}
                                  className="btn-act-icon"
                                  title="Edit Activity"
                                  aria-label="Edit Activity"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(act.id, act.title)}
                                  className="btn-act-icon delete-act"
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
          MODAL 1: ADD / EDIT EXPENSE MODAL
          ==================================================================== */}
      {isExpenseModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsExpenseModalOpen(false);
          }}
        >
          <div
            className="modal-container modal-expense-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
          >
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Receipt size={20} className="modal-header-icon" />
                <h2 id="expense-modal-title">
                  {editingExpenseId ? 'Edit Travel Expense' : 'Log New Travel Expense'}
                </h2>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
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

            <form onSubmit={handleExpenseSubmit} className="modal-form">
              {/* Category selector */}
              <div className="form-group">
                <label htmlFor="expCategory">Expense Category *</label>
                <select
                  id="expCategory"
                  value={expenseFormData.category}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                  className="form-input form-select"
                  required
                >
                  {FIXED_EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="form-group">
                <label htmlFor="expTitle">Expense Name / Title *</label>
                <input
                  id="expTitle"
                  type="text"
                  placeholder="e.g. Bullet Train ticket, Dinner at Bistro, Louvre admission..."
                  value={expenseFormData.title}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, title: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              {/* Amount & Date row */}
              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="expAmount">Amount ({getCurrencySymbol(activeCurrencyCode)}) *</label>
                  <input
                    id="expAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 85.50"
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group half-width">
                  <label htmlFor="expDate">Expense Date *</label>
                  <input
                    id="expDate"
                    type="date"
                    value={expenseFormData.expenseDate}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, expenseDate: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* Receipt URL */}
              <div className="form-group">
                <label htmlFor="expReceipt">Receipt Link / URL (Optional)</label>
                <input
                  id="expReceipt"
                  type="url"
                  placeholder="https://example.com/receipts/booking.pdf or image link"
                  value={expenseFormData.receiptUrl}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, receiptUrl: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Description / Notes */}
              <div className="form-group">
                <label htmlFor="expDesc">Description / Notes</label>
                <textarea
                  id="expDesc"
                  rows={2}
                  placeholder="Additional details, splitting notes, payment method..."
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  className="form-input form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={expenseModalLoading} className="btn-primary">
                  {expenseModalLoading
                    ? 'Saving...'
                    : editingExpenseId
                    ? 'Update Expense'
                    : 'Save & Log Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: CREATE / EDIT BUDGET PLAN MODAL
          ==================================================================== */}
      {isBudgetModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBudgetModalOpen(false);
          }}
        >
          <div
            className="modal-container modal-budget-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-modal-title"
          >
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Wallet size={20} className="modal-header-icon" />
                <h2 id="budget-modal-title">
                  {budget ? 'Configure Trip Budget Plan' : 'Initialize Trip Budget Plan'}
                </h2>
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
              {/* Primary Budget Inputs */}
              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="totalBudget">Total Budget Target *</label>
                  <input
                    id="totalBudget"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 3500"
                    value={budgetFormData.totalBudget}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, totalBudget: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group half-width">
                  <label htmlFor="budgetCurrency">Preferred Currency *</label>
                  <select
                    id="budgetCurrency"
                    value={budgetFormData.currency}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, currency: e.target.value })}
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

              <div className="form-group">
                <label htmlFor="travelTier">Travel Style / Tier</label>
                <select
                  id="travelTier"
                  value={budgetFormData.category}
                  onChange={(e) => setBudgetFormData({ ...budgetFormData, category: e.target.value })}
                  className="form-input form-select"
                >
                  {BUDGET_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Split Presets */}
              <div className="quick-split-section">
                <span className="quick-split-label">⚡ 1-Click Smart Split Presets:</span>
                <div className="quick-split-buttons">
                  <button
                    type="button"
                    onClick={() => applyQuickSplit({ stay: 0.35, food: 0.25, transit: 0.20, acts: 0.15, buffer: 0.05 })}
                    className="btn-quick-split"
                  >
                    🏖️ Balanced
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickSplit({ stay: 0.25, food: 0.20, transit: 0.25, acts: 0.20, buffer: 0.10 })}
                    className="btn-quick-split"
                  >
                    🎒 Backpacker
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickSplit({ stay: 0.45, food: 0.30, transit: 0.15, acts: 0.05, buffer: 0.05 })}
                    className="btn-quick-split"
                  >
                    ✨ Luxury
                  </button>
                </div>
              </div>

              {/* Category Breakdown Inputs */}
              <div className="breakdown-grid">
                <div className="form-group">
                  <label htmlFor="stayBudget">🏨 Hotel / Stay</label>
                  <input
                    id="stayBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 1200"
                    value={budgetFormData.accommodationBudget}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, accommodationBudget: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="foodBudget">🍜 Food & Dining</label>
                  <input
                    id="foodBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 800"
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
                    placeholder="e.g. 600"
                    value={budgetFormData.transportationBudget}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, transportationBudget: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="actsBudget">🎟️ Entertainment & Tours</label>
                  <input
                    id="actsBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 400"
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
                <label htmlFor="budgetNotes">Financial Strategy / Currency Notes</label>
                <textarea
                  id="budgetNotes"
                  rows={2}
                  placeholder="e.g. Local cash for street markets, travel card with 0% foreign FX fee..."
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
                    ? 'Saving...'
                    : budget
                    ? 'Save Changes'
                    : 'Save & Initialize Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: ADD ITINERARY DAY
          ==================================================================== */}
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

      {/* ====================================================================
          MODAL 4: ADD / EDIT ACTIVITY
          ==================================================================== */}
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
                  <label htmlFor="actCost">Estimated Cost ({activeCurrencyCode})</label>
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

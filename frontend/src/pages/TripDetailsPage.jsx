import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tripApi } from '../api/tripApi';
import { itineraryApi } from '../api/itineraryApi';
import { budgetApi } from '../api/budgetApi';
import { expenseApi } from '../api/expenseApi';
import { memberApi } from '../api/memberApi';
import { useAuth } from '../context/AuthContext';
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
  Users,
  UserPlus,
  UserMinus,
  ShieldCheck,
  MoreVertical,
  Mail,
  User as UserIcon,
  TrendingDown,
  XCircle,
  Ban,
} from 'lucide-react';
import DatePicker from '../components/DatePicker';
import ConfirmModal from '../components/ConfirmModal';
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
];

const BUDGET_TIERS = ['Backpacker / Budget', 'Smart Mid-Range', 'Comfort & Boutique', 'Luxury Escape', 'Business / Work'];

const TripDetailsPage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categorySummaries, setCategorySummaries] = useState([]);
  const [budgetExpenseSummary, setBudgetExpenseSummary] = useState(null);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active view section
  const [activeSection, setActiveSection] = useState('all'); // 'all', 'members', 'itinerary', 'budget_expenses'

  // Member Management State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [openMemberMenuId, setOpenMemberMenuId] = useState(null);

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
    paidBy: '',
  });
  const [expenseModalLoading, setExpenseModalLoading] = useState(false);

  const [modalError, setModalError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    danger: true,
    onConfirm: () => {},
  });
  const { showToast } = useToast();
  const hasShownOpenToast = useRef(false);

  // Chart ref
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const loadTripData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [tripData, daysData, budgetData, expensesData, catSummaryData, bSummaryData, membersData] = await Promise.all([
        tripApi.getTripById(id),
        itineraryApi.getItineraryForTrip(id),
        budgetApi.getBudget(id).catch(() => null),
        expenseApi.getExpenses(id).catch(() => []),
        expenseApi.getCategorySummary(id).catch(() => []),
        expenseApi.getRemainingBudget(id).catch(() => null),
        memberApi.getMembers(id).catch(() => []),
      ]);
      setTrip(tripData);
      setDays(daysData || []);
      setBudget(budgetData);
      setExpenses(expensesData || []);
      setCategorySummaries(catSummaryData || []);
      setBudgetExpenseSummary(bSummaryData);
      setMembers(membersData || []);
    } catch (err) {
      console.error('Failed to load trip details:', err);
      setError(err.response?.data?.message || 'Trip not found or access denied.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  // Click outside to close member menus
  useEffect(() => {
    const handleClickOutside = () => setOpenMemberMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

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

  // Authoritative, real-time category summaries derived from loaded expenses
  const computedCategorySummaries = useMemo(() => {
    const catMap = new Map();
    FIXED_EXPENSE_CATEGORIES.forEach((fc) => {
      catMap.set(fc.id.toLowerCase(), { category: fc.id, totalAmount: 0, percentage: 0 });
    });

    let totalExpSum = 0;
    expenses.forEach((e) => {
      const amt = e.amount != null ? parseFloat(e.amount) : 0;
      if (!isNaN(amt) && amt > 0) {
        totalExpSum += amt;
        const catKey = (e.category || 'Food').toLowerCase();
        if (catMap.has(catKey)) {
          const item = catMap.get(catKey);
          item.totalAmount += amt;
        } else {
          catMap.set(catKey, { category: e.category || 'Other', totalAmount: amt, percentage: 0 });
        }
      }
    });

    const result = [];
    catMap.forEach((val) => {
      if (val.totalAmount > 0) {
        val.percentage = totalExpSum > 0 ? Math.round((val.totalAmount / totalExpSum) * 1000) / 10 : 0;
        result.push(val);
      }
    });

    if (result.length > 0) return result;
    return categorySummaries || [];
  }, [expenses, categorySummaries]);

  // Render & Update Chart.js Instance
  useEffect(() => {
    if (!chartCanvasRef.current) return;

    // Cleanup previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    if (!computedCategorySummaries || computedCategorySummaries.length === 0) return;

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = computedCategorySummaries.map((c) => c.category);
    const dataValues = computedCategorySummaries.map((c) =>
      typeof c.totalAmount === 'number' ? c.totalAmount : parseFloat(c.totalAmount) || 0
    );

    // Map category colors
    const colors = computedCategorySummaries.map((c) => {
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
              backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(15, 23, 42, 0.95)',
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
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                  return ` ${item.label}: ${sym}${Number(val).toLocaleString()} (${pct}%)`;
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
              backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(15, 23, 42, 0.95)',
              titleColor: '#ffffff',
              bodyColor: '#f1f5f9',
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (item) => {
                  const val = item.raw || 0;
                  const sym = getCurrencySymbol(activeCurrencyCode);
                  const total = dataValues.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                  return ` ${item.label}: ${sym}${Number(val).toLocaleString()} (${pct}%)`;
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
  }, [computedCategorySummaries, chartType, activeCurrencyCode]);

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

  const handleDeleteDay = (dayId, dayTitle) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Itinerary Day?',
      message: `Are you sure you want to delete "${dayTitle}" and all its activities?`,
      confirmText: 'Delete Day',
      danger: true,
      onConfirm: async () => {
        try {
          await itineraryApi.deleteDay(id, dayId);
          setDays((prev) => prev.filter((d) => d.id !== dayId));
          showToast(`Itinerary day deleted successfully`, 'info');
        } catch (err) {
          console.error('Failed to delete day:', err);
          showToast(err.response?.data?.message || 'Failed to delete day.', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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

  const handleDeleteActivity = (activityId, activityTitle) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Activity?',
      message: `Are you sure you want to delete activity "${activityTitle}"?`,
      confirmText: 'Delete Activity',
      danger: true,
      onConfirm: async () => {
        try {
          await itineraryApi.deleteActivity(activityId);
          showToast(`Activity "${activityTitle}" deleted successfully`, 'success');
          await loadTripData();
        } catch (err) {
          console.error('Failed to delete activity:', err);
          showToast(err.response?.data?.message || 'Failed to delete activity.', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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
      await loadTripData(true);
    } catch (err) {
      console.error('Failed to save budget:', err);
      const msg = err.response?.data?.message || 'Failed to save budget plan.';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setBudgetModalLoading(false);
    }
  };

  const handleDeleteBudget = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Budget Plan?',
      message: 'Are you sure you want to remove the custom budget plan for this trip?',
      confirmText: 'Remove Budget',
      danger: true,
      onConfirm: async () => {
        try {
          await budgetApi.deleteBudget(id);
          showToast('Budget plan removed successfully', 'info');
          await loadTripData(true);
        } catch (err) {
          console.error('Failed to delete budget:', err);
          showToast(err.response?.data?.message || 'Failed to remove budget', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ==========================================
  // EXPENSE HANDLERS
  // ==========================================
  const openAddExpenseModal = () => {
    setEditingExpenseId(null);
    const defaultPayerId =
      members.find((m) => m.email?.toLowerCase() === currentUser?.email?.toLowerCase())?.userId ||
      members[0]?.userId ||
      '';
    setExpenseFormData({
      title: '',
      category: 'Food',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      receiptUrl: '',
      description: '',
      payerId: defaultPayerId,
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
      payerId: exp.payerId || '',
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
        payerId: expenseFormData.payerId ? Number(expenseFormData.payerId) : undefined,
      };

      if (editingExpenseId) {
        await expenseApi.updateExpense(id, editingExpenseId, payload);
        showToast('Expense updated successfully!', 'success');
      } else {
        await expenseApi.createExpense(id, payload);
        showToast('New expense logged in trip ledger!', 'success');
      }

      setIsExpenseModalOpen(false);
      await loadTripData(true);
    } catch (err) {
      console.error('Failed to save expense:', err);
      const msg = err.response?.data?.message || 'Failed to save expense.';
      setModalError(msg);
      showToast(msg, 'error');
    } finally {
      setExpenseModalLoading(false);
    }
  };

  const handleDeleteExpense = (expenseId, expenseTitle) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Expense?',
      message: `Are you sure you want to delete expense "${expenseTitle}"?`,
      confirmText: 'Delete Expense',
      danger: true,
      onConfirm: async () => {
        try {
          await expenseApi.deleteExpense(id, expenseId);
          showToast(`Expense "${expenseTitle}" deleted successfully`, 'success');
          await loadTripData(true);
        } catch (err) {
          console.error('Failed to delete expense:', err);
          showToast(err.response?.data?.message || 'Failed to delete expense.', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Member Management Helpers & Handlers
  const isTripOwner =
    trip?.user?.id === currentUser?.id ||
    members.some((m) => m.userId === currentUser?.id && m.role === 'OWNER');
  const isGroupAdmin = members.some(
    (m) => m.userId === currentUser?.id && m.role === 'GROUP_ADMIN'
  );
  const canManageMembers = isTripOwner || isGroupAdmin;

  const getInitials = (name) => {
    if (!name) return 'TR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleOpenInviteModal = () => {
    setInviteEmail('');
    setInviteError('');
    setIsInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteError('');
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setInviteError('Please enter an email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setInviteError('Please enter a valid email address.');
      return;
    }

    if (members.some((m) => m.email?.toLowerCase() === email)) {
      setInviteError('This user is already a member of this trip.');
      return;
    }

    setInviteLoading(true);
    try {
      const res = await memberApi.addMember(id, { email, role: 'MEMBER' });
      if (res && res.emailDelivered === false) {
        showToast(`Member added, but invitation email could not be delivered (check SMTP settings).`, 'warning');
      } else {
        showToast(`Invitation sent successfully to ${email}.`, 'success');
      }
      handleCloseInviteModal();
      await loadTripData();
    } catch (err) {
      console.error('Failed to invite member:', err);
      const msg =
        err.response?.data?.message ||
        'Failed to send invitation. Please verify the email address exists in TripNest.';
      setInviteError(msg);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = (member) => {
    setOpenMemberMenuId(null);
    if (member.role === 'OWNER') {
      showToast('Trip owner cannot be removed.', 'error');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Remove Member?',
      message: `Are you sure you want to remove "${member.fullName}" from this trip?`,
      confirmText: 'Remove Member',
      danger: true,
      onConfirm: async () => {
        try {
          await memberApi.removeMember(id, member.userId);
          showToast(`${member.fullName} has been removed from the trip`, 'success');
          await loadTripData();
        } catch (err) {
          console.error('Failed to remove member:', err);
          showToast(err.response?.data?.message || 'Failed to remove member.', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleToggleRole = async (member) => {
    setOpenMemberMenuId(null);
    if (member.role === 'OWNER') {
      showToast('Trip owner role cannot be changed.', 'error');
      return;
    }

    const newRole = member.role === 'GROUP_ADMIN' ? 'MEMBER' : 'GROUP_ADMIN';
    const roleLabel = newRole === 'GROUP_ADMIN' ? 'Group Admin' : 'Member';

    try {
      await memberApi.updateMemberRole(id, member.userId, { role: newRole });
      showToast(`Updated ${member.fullName}'s role to ${roleLabel}`, 'success');
      await loadTripData();
    } catch (err) {
      console.error('Failed to update member role:', err);
      showToast(err.response?.data?.message || 'Failed to update member role.', 'error');
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

  const activeBudgetAmount = budget?.totalBudget != null
    ? parseFloat(budget.totalBudget)
    : trip?.budget?.totalAmount != null
    ? parseFloat(trip.budget.totalAmount)
    : trip?.budget != null && trip.budget !== ''
    ? parseFloat(trip.budget)
    : budgetExpenseSummary?.totalBudget != null
    ? parseFloat(budgetExpenseSummary.totalBudget)
    : 0;

  const totalSpentExpenses = expenses.reduce(
    (sum, e) => sum + (e.amount != null ? parseFloat(e.amount) : 0),
    0
  );

  const remainingBudgetAmount = activeBudgetAmount - totalSpentExpenses;

  const isOverBudget = remainingBudgetAmount < 0;
  const budgetSpentPct =
    activeBudgetAmount > 0
      ? Math.round((totalSpentExpenses / activeBudgetAmount) * 100)
      : 0;
  const progressBarWidth = Math.min(Math.max(budgetSpentPct, 0), 100);

  const handleCancelTripClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Trip?',
      message: `Are you sure you want to cancel the trip "${trip?.title}"? The trip status will be marked as CANCELLED and will remain visible under your Cancelled trips filter.`,
      confirmText: 'Yes, Cancel Trip',
      danger: true,
      onConfirm: async () => {
        try {
          const payload = {
            title: trip.title,
            description: trip.description,
            destinationId: trip.destination?.id || trip.destinationId,
            startDate: trip.startDate,
            endDate: trip.endDate,
            budget: trip.budget?.totalAmount || trip.budget,
            status: 'CANCELLED',
          };
          await tripApi.updateTrip(id, payload);
          showToast('Trip cancelled successfully', 'success');
          await loadTripData();
        } catch (err) {
          console.error('Failed to cancel trip:', err);
          showToast(err.response?.data?.message || 'Failed to cancel trip.', 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

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
          <span>Back to My Trips</span>
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
              {trip.status !== 'CANCELLED' ? (
                <button
                  onClick={handleCancelTripClick}
                  className="btn-hero-cancel-pill"
                  title="Cancel Trip"
                >
                  <XCircle size={15} />
                  <span>Cancel Trip</span>
                </button>
              ) : (
                <div className="hero-cancelled-tag">
                  <Ban size={15} />
                  <span>Trip Cancelled</span>
                </div>
              )}
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
              <Users size={18} />
              <div>
                <span className="metric-title">Trip Members</span>
                <span className="metric-val">
                  {members.length || 1} {members.length === 1 ? 'Person' : 'People'}
                  {trip?.user?.fullName ? ` (Owner: ${trip.user.fullName.split(' ')[0]})` : ''}
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
                  {isOverBudget ? '-' : ''}{formatMoney(Math.abs(remainingBudgetAmount), activeCurrencyCode)} {isOverBudget ? '(Deficit)' : '(Surplus)'}
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
          aria-selected={activeSection === 'members'}
          onClick={() => setActiveSection('members')}
          className={`section-tab-btn ${activeSection === 'members' ? 'active' : ''}`}
        >
          <Users size={16} />
          <span>People & Members</span>
          {members.length > 0 && (
            <span className="tab-pill-badge">{members.length}</span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={activeSection === 'itinerary' || activeSection === 'all'}
          onClick={() => setActiveSection('itinerary')}
          className={`section-tab-btn ${activeSection === 'itinerary' || activeSection === 'all' ? 'active' : ''}`}
        >
          <Calendar size={16} />
          <span>Daily Schedule ({days.length} Days)</span>
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
                <span className="passport-currency-symbol">{isOverBudget ? '-' : ''}{getCurrencySymbol(activeCurrencyCode)}</span>
                <span className={`passport-amount-number ${isOverBudget ? 'text-deficit' : 'text-surplus'}`}>
                  {Math.round(Math.abs(remainingBudgetAmount)).toLocaleString()}
                </span>
              </div>
              <div className="passport-card-footer">
                <span className={`footer-status-tag ${isOverBudget ? 'badge-deficit' : 'badge-surplus'}`}>
                  {isOverBudget ? 'Exceeds Total Budget' : 'Safe Spending Margin'}
                </span>
                <span className="balance-pct-tag">
                  {isOverBudget ? `${budgetSpentPct}% spent (Over Budget)` : `${100 - budgetSpentPct}% left`}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Budget Progress Bar */}
          <div className="budget-progress-strip">
            <div className="progress-strip-header">
              <div className="progress-label-group">
                <span className="progress-title">Budget Utilization</span>
                <span className={`progress-badge ${isOverBudget ? 'badge-danger' : budgetSpentPct > 80 ? 'badge-warning' : 'badge-good'}`}>
                  {isOverBudget ? `Over Budget (${budgetSpentPct}%)` : `${budgetSpentPct}% Spent`}
                </span>
              </div>
              <span className="progress-stat-fraction">
                {formatMoney(totalSpentExpenses, activeCurrencyCode)} of {formatMoney(activeBudgetAmount, activeCurrencyCode)} ({budgetSpentPct}%)
              </span>
            </div>
            <div className="budget-progress-track">
              <div
                className={`budget-progress-fill ${isOverBudget ? 'fill-danger' : budgetSpentPct > 80 ? 'fill-warning' : 'fill-good'}`}
                style={{ width: `${progressBarWidth}%` }}
              ></div>
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
                    <span className="analytics-sub">
                      {trip?.title ? `${trip.title} • ` : ''}Category Breakdown
                    </span>
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

              {computedCategorySummaries.length === 0 ? (
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
                    {computedCategorySummaries.map((catSummary) => {
                      const matchedCat = FIXED_EXPENSE_CATEGORIES.find(
                        (c) => c.id.toLowerCase() === catSummary.category.toLowerCase()
                      ) || { color: '#94a3b8', emoji: '🏷️' };

                      const catAmt = typeof catSummary.totalAmount === 'number'
                        ? catSummary.totalAmount
                        : parseFloat(catSummary.totalAmount) || 0;
                      const totalSpent = computedCategorySummaries.reduce(
                        (sum, c) => sum + (typeof c.totalAmount === 'number' ? c.totalAmount : parseFloat(c.totalAmount) || 0),
                        0
                      );
                      const pct = totalSpent > 0 ? ((catAmt / totalSpent) * 100).toFixed(1) : '0.0';

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
                            {formatMoney(catAmt, activeCurrencyCode)}
                          </span>
                          <span className="legend-cat-pct">{pct}%</span>
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
                    <span className="analytics-sub">Planned target vs real spending</span>
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
                    if (fc.id === 'Shopping') planned = parseFloat(budget.emergencyBudget) || 0;
                  }

                  // Find actual spent dynamically from expenses list
                  const spent = expenses
                    .filter((e) => e.category?.toLowerCase() === fc.id.toLowerCase())
                    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

                  const isOver = planned > 0 && spent > planned;
                  const overAmt = isOver ? spent - planned : 0;
                  const remainingAmt = planned > 0 ? Math.max(planned - spent, 0) : 0;
                  const pct = planned > 0 ? (spent / planned) * 100 : 0;
                  const progressWidth = planned > 0 ? Math.min(pct, 100) : (spent > 0 ? 100 : 0);

                  const IconComp = fc.icon;

                  return (
                    <div key={fc.id} className={`category-burn-row ${isOver ? 'is-over-budget' : ''}`}>
                      <div className="burn-row-header">
                        <div className="burn-cat-title">
                          <span className="burn-cat-icon" style={{ color: fc.color, backgroundColor: `${fc.color}15` }}>
                            <IconComp size={15} />
                          </span>
                          <div className="burn-title-block">
                            <span className="burn-cat-text">{fc.label}</span>
                            {isOver && (
                              <span className="burn-over-pill">
                                Over by {formatMoney(overAmt, activeCurrencyCode)} ({pct.toFixed(0)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="burn-numbers">
                          <span className="burn-spent-num">{formatMoney(spent, activeCurrencyCode)}</span>
                          {planned > 0 ? (
                            <span className="burn-planned-num">/ {formatMoney(planned, activeCurrencyCode)}</span>
                          ) : (
                            <span className="burn-no-limit-tag">No target</span>
                          )}
                        </div>
                      </div>

                      <div className="burn-progress-track">
                        <div
                          className={`burn-progress-fill ${isOver ? 'fill-overbudget' : pct > 85 ? 'fill-warning' : ''}`}
                          style={{
                            width: `${progressWidth}%`,
                            backgroundColor: isOver ? '#ef4444' : pct > 85 ? '#f59e0b' : fc.color,
                          }}
                        ></div>
                      </div>

                      <div className="burn-row-footer">
                        <span className="burn-usage-text">
                          {planned > 0
                            ? `${pct.toFixed(1)}% used`
                            : (spent > 0 ? `${formatMoney(spent, activeCurrencyCode)} logged` : '0% used')}
                        </span>
                        {planned > 0 && !isOver && (
                          <span className="burn-remaining-text">
                            {formatMoney(remainingAmt, activeCurrencyCode)} left
                          </span>
                        )}
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
                <div className="empty-journal-icon-bubble">
                  <Receipt size={28} />
                </div>
                <h4 className="empty-journal-title">No Expenses Found</h4>
                <p className="empty-journal-desc">
                  {expenseSearchQuery || expenseFilterCategory !== 'ALL'
                    ? 'No expense matches the selected filter or search query.'
                    : 'No expenses have been recorded for this trip yet.'}
                </p>
                <button onClick={openAddExpenseModal} className="btn-primary btn-log-expense-empty">
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
                              className="expense-receipt-link"
                              title="Open receipt link"
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
                        <div className="itinerary-empty-activities-card">
                          <div className="empty-calendar-icon-bubble">
                            <Calendar size={28} />
                          </div>
                          <h4 className="empty-activities-title">No activities planned yet</h4>
                          <p className="empty-activities-desc">
                            Start building your itinerary for this day by adding your first activity.
                          </p>
                          <button
                            type="button"
                            onClick={() => openAddActivityModal(day.id)}
                            className="btn-primary btn-schedule-activity-empty"
                          >
                            <Plus size={15} />
                            <span>Schedule an Activity</span>
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
          3. PEOPLE / TRIP MEMBERS & COLLABORATION MODULE
          ==================================================================== */}
      {(activeSection === 'all' || activeSection === 'members') && (
        <section className="trip-members-section" id="members-hub">
          <div className="members-header-panel">
            <div className="members-title-group">
              <div className="members-icon-bubble">
                <Users size={22} />
              </div>
              <div>
                <div className="members-badge-row">
                  <span className="members-tag-stamp">Voyage Companions</span>
                  <span className="members-count-badge">
                    {members.length} {members.length === 1 ? 'Member' : 'Members'}
                  </span>
                </div>
                <h2 className="members-main-title">People & Trip Members</h2>
                <p className="members-subtitle">
                  Manage travel companions, role assignments, and collaboration access for this itinerary.
                </p>
              </div>
            </div>

            {canManageMembers && (
              <button
                onClick={handleOpenInviteModal}
                className="btn-primary btn-invite-member"
                title="Invite people by email"
              >
                <UserPlus size={16} />
                <span>+ Invite People</span>
              </button>
            )}
          </div>

          <div className="members-list-container">
            {members.length === 0 ? (
              <div className="members-empty-box">
                <Users size={36} className="empty-members-icon" />
                <h4>No Members Added Yet</h4>
                <p>Invite friends or fellow travelers by email to plan this journey together.</p>
                {canManageMembers && (
                  <button onClick={handleOpenInviteModal} className="btn-primary mt-2">
                    <UserPlus size={15} />
                    <span>Invite First Person</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="members-cards-grid">
                {members.map((member) => {
                  const isOwnerMember = member.role === 'OWNER';
                  const isAdminMember = member.role === 'GROUP_ADMIN';
                  const isSelf = member.userId === currentUser?.id;
                  const initials = getInitials(member.fullName);

                  return (
                    <div key={member.userId || member.email} className="member-card-row">
                      <div className="member-avatar-col">
                        <div
                          className={`member-avatar-circle ${
                            isOwnerMember
                              ? 'owner-avatar'
                              : isAdminMember
                              ? 'admin-avatar'
                              : 'member-avatar'
                          }`}
                        >
                          {initials}
                        </div>
                      </div>

                      <div className="member-info-col">
                        <div className="member-name-row">
                          <h4 className="member-full-name">{member.fullName}</h4>
                          {isSelf && <span className="member-self-badge">(You)</span>}
                        </div>
                        <div className="member-meta-row">
                          {member.email && (
                            <span className="member-email-text">{member.email}</span>
                          )}
                          {member.joinedAt && (
                            <span className="member-joined-text">
                              • Joined{' '}
                              {new Date(member.joinedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="member-role-col">
                        <span
                          className={`member-role-pill ${
                            isOwnerMember
                              ? 'role-owner'
                              : isAdminMember
                              ? 'role-admin'
                              : 'role-member'
                          }`}
                        >
                          {isOwnerMember ? (
                            <>
                              <ShieldCheck size={12} /> Owner
                            </>
                          ) : isAdminMember ? (
                            <>
                              <ShieldCheck size={12} /> Group Admin
                            </>
                          ) : (
                            <>
                              <UserIcon size={12} /> Member
                            </>
                          )}
                        </span>
                      </div>

                      {/* Actions Menu for Owner / Group Admin */}
                      {canManageMembers && !isOwnerMember && (
                        <div className="member-menu-col">
                          <div className="member-dropdown-wrap">
                            <button
                              type="button"
                              className="btn-member-menu"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMemberMenuId(
                                  openMemberMenuId === member.userId ? null : member.userId
                                );
                              }}
                              aria-label="Member options"
                              title="Member options"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openMemberMenuId === member.userId && (
                              <div
                                className="member-dropdown-popover"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isTripOwner && (
                                  <button
                                    type="button"
                                    className="dropdown-item-action"
                                    onClick={() => handleToggleRole(member)}
                                  >
                                    <ShieldCheck size={14} />
                                    <span>
                                      {isAdminMember
                                        ? 'Change to Member'
                                        : 'Promote to Group Admin'}
                                    </span>
                                  </button>
                                )}

                                {(isTripOwner ||
                                  (isGroupAdmin && member.role === 'MEMBER')) && (
                                  <button
                                    type="button"
                                    className="dropdown-item-action danger"
                                    onClick={() => handleRemoveMember(member)}
                                  >
                                    <UserMinus size={14} />
                                    <span>Remove from Trip</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

              {/* Paid By Trip Member Dropdown */}
              <div className="form-group">
                <label htmlFor="expPayer">Paid By</label>
                <select
                  id="expPayer"
                  value={expenseFormData.payerId || ''}
                  onChange={(e) =>
                    setExpenseFormData({
                      ...expenseFormData,
                      payerId: e.target.value ? Number(e.target.value) : '',
                    })
                  }
                  className="form-input form-select"
                >
                  {members && members.length > 0 ? (
                    members.map((m) => (
                      <option key={m.userId || m.email} value={m.userId || ''}>
                        {m.fullName || m.name || m.email}{' '}
                        {m.role
                          ? `(${
                              m.role === 'OWNER'
                                ? 'Owner'
                                : m.role === 'GROUP_ADMIN'
                                ? 'Group Admin'
                                : 'Member'
                            })`
                          : ''}
                      </option>
                    ))
                  ) : (
                    <option value="">{trip?.user?.fullName || currentUser?.fullName || 'Trip Owner'}</option>
                  )}
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
                  <label>Expense Date *</label>
                  <DatePicker
                    value={expenseFormData.expenseDate}
                    onChange={(d) => setExpenseFormData({ ...expenseFormData, expenseDate: d })}
                    placeholder="Select expense date"
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
                  <label htmlFor="bufferBudget">🛍️ Shopping & Extras</label>
                  <input
                    id="bufferBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 200"
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
                  <label>Date</label>
                  <DatePicker
                    value={dayFormData.date}
                    onChange={(d) => setDayFormData({ ...dayFormData, date: d })}
                    placeholder="Select itinerary date"
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

      {/* ====================================================================
          MODAL 5: INVITE PEOPLE / MEMBERS MODAL
          ==================================================================== */}
      {isInviteModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseInviteModal();
          }}
        >
          <div
            className="modal-container modal-invite-container"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-modal-title"
          >
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <UserPlus size={20} className="modal-header-icon" />
                <h2 id="invite-modal-title">Invite People to Trip</h2>
              </div>
              <button
                onClick={handleCloseInviteModal}
                className="btn-close-modal"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {inviteError && (
              <div className="alert-box alert-error mb-3">
                <AlertCircle size={16} />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="inviteModalEmail">Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={16} className="field-icon" />
                  <input
                    id="inviteModalEmail"
                    type="email"
                    placeholder="e.g. friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      if (inviteError) setInviteError('');
                    }}
                    required
                    className="form-input with-icon"
                    autoFocus
                  />
                </div>
                <p className="form-help-text mt-1">
                  We'll notify them and add them as a trip member so they can collaborate on itineraries and expenses.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCloseInviteModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="btn-primary"
                >
                  {inviteLoading ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ACTION MODAL */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        danger={confirmDialog.danger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default TripDetailsPage;

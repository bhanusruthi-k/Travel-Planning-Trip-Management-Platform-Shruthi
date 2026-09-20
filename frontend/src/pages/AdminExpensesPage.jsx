import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  DollarSign,
  ArrowLeft,
  AlertTriangle,
  Receipt,
  User,
  Calendar,
  Tag,
  Briefcase,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';

const AdminExpensesPage = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardApi.getAdminExpenses();
      setExpenses(data || []);
    } catch (err) {
      console.error('Failed to load platform expenses:', err);
      setError('Unable to load platform expenses. Please verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const formatCurrency = (amount) => {
    const val = Number(amount) || 0;
    return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
          <h1 className="admin-main-heading">Platform Expenses Logged</h1>
          <p className="admin-sub-heading">
            Live log of all travel transactions, trip expenses, and budget utilization.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <div className="discovery-stats-badge">
            <DollarSign size={16} />
            <span>Total: {formatCurrency(totalAmount)}</span>
          </div>
          <div className="discovery-stats-badge">
            <Receipt size={16} />
            <span>{expenses.length} Transactions</span>
          </div>
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
            <h3>Failed to load expenses</h3>
            <p>{error}</p>
          </div>
          <button onClick={fetchExpenses} className="btn-retry">
            Try Again
          </button>
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty-results-box" style={{ marginTop: '24px' }}>
          <DollarSign size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <h3>No Platform Expenses Logged</h3>
          <p>No transactions or expense records have been recorded yet.</p>
        </div>
      ) : (
        <div className="dashboard-card-widget" style={{ marginTop: '24px' }}>
          <div className="admin-dest-table-wrap">
            <table className="admin-dest-table">
              <thead>
                <tr>
                  <th>Expense / Description</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Trip</th>
                  <th>Traveler / Payer</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong className="dest-table-name">{e.title || 'Expense'}</strong>
                      {e.description && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.description}
                        </span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--accent-emerald, #10b981)', fontSize: '0.95rem' }}>
                        {formatCurrency(e.amount)}
                      </strong>
                    </td>
                    <td>
                      <span className="dest-table-cat">
                        <Tag size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        {e.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Briefcase size={13} style={{ color: 'var(--color-primary, #BD4444)' }} />
                        {e.tripTitle || (e.tripId ? `Trip #${e.tripId}` : '—')}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                        <User size={13} style={{ opacity: 0.7 }} />
                        {e.payerName || e.payerEmail || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}>
                        <Calendar size={13} style={{ opacity: 0.7 }} />
                        {e.expenseDate || (e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—')}
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

export default AdminExpensesPage;

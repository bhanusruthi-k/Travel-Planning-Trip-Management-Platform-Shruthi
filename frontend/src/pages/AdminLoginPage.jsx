import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, AlertCircle, Lock, Mail, ArrowLeft } from 'lucide-react';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email.trim(), password, 'ADMINISTRATOR');
      showToast(`Welcome Administrator, ${user.fullName || user.email}!`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid admin credentials. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-circle" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
              <Shield size={26} />
            </div>
            <h1 className="auth-title">Administrator Sign In</h1>
            <p className="auth-subtitle">Sign in with verified administrator credentials</p>
          </div>

          {error && (
            <div className="alert-box alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Admin Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@tripnest.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input with-left-icon"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input with-left-icon"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-full"
              style={{ backgroundColor: '#92400e', borderColor: '#78350f' }}
            >
              {loading ? <span className="spinner-small"></span> : 'Sign In as Admin'}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <Link to="/login" className="btn-text-back">
              <ArrowLeft size={15} />
              <span>Traveler Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;

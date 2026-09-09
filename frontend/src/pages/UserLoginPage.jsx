import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Compass,
  AlertCircle,
  Lock,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Users
} from 'lucide-react';

const UserLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      showToast(`Welcome back, ${user.fullName || user.email}!`, 'success');
      const targetPath = location.state?.from?.pathname;
      let redirectDestination;

      if (user.role === 'ADMINISTRATOR') {
        redirectDestination = (targetPath && targetPath.startsWith('/admin')) ? targetPath : '/admin/dashboard';
      } else {
        redirectDestination = (!targetPath || targetPath === '/trips' || targetPath.startsWith('/login') || targetPath === '/' || targetPath.startsWith('/admin'))
          ? '/dashboard'
          : targetPath;
      }
      navigate(redirectDestination, { replace: true });
    } catch (err) {
      console.error('User login error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid email or password. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-wrapper">
        {/* Left Side: Welcome / Branding Panel */}
        <div className="auth-welcome-panel">
          <div className="auth-welcome-header">
            <div className="auth-brand-badge">
              <Compass size={16} className="auth-brand-badge-icon" />
              <span className="auth-brand-badge-text">TripNest</span>
            </div>
            <h1 className="auth-welcome-heading">Welcome to TripNest</h1>
            <p className="auth-welcome-tagline">
              Plan your trips. Discover destinations. Travel smarter.
            </p>
          </div>

          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon-box">
                <MapPin size={16} />
              </div>
              <span className="auth-feature-text">Curated Destinations & Insights</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon-box">
                <Calendar size={16} />
              </div>
              <span className="auth-feature-text">Day-by-day Itinerary Planning</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon-box">
                <Sparkles size={16} />
              </div>
              <span className="auth-feature-text">Budget & Real-time Expense Tracking</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon-box">
                <Users size={16} />
              </div>
              <span className="auth-feature-text">Seamless Group Travel Collaboration</span>
            </div>
          </div>

          <div className="auth-welcome-footer">
            <span>© 2026 TripNest. Plan, travel & explore together.</span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome Back</h2>
            <p className="auth-form-subtitle">
              Sign in to your TripNest account to continue planning your trips
            </p>
          </div>

          {error && (
            <div className="alert-box alert-error" role="alert" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="field-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
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
                  placeholder="Enter your password"
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
              style={{ marginTop: '4px' }}
            >
              {loading ? <span className="spinner-small"></span> : 'Sign In'}
            </button>
          </form>

          <div className="auth-form-footer">
            <p style={{ margin: 0 }}>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLoginPage;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useToast } from '../context/ToastContext';
import {
  Compass,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Lock,
  MapPin,
  Calendar,
  Sparkles,
  Users
} from 'lucide-react';

const UserRegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      const successMsg = 'Account created successfully. Please sign in.';
      setSuccess(successMsg);
      showToast(successMsg, 'success');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to create account. Please check your details and try again.';
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

        {/* Right Side: Registration Form */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create your TripNest account</h2>
            <p className="auth-form-subtitle">
              Join thousands of travelers planning their next adventures
            </p>
          </div>

          {error && (
            <div className="alert-box alert-error" role="alert" style={{ marginBottom: '16px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-box alert-success" role="status" style={{ marginBottom: '16px' }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="field-icon" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="form-input with-left-icon"
                  autoComplete="name"
                />
              </div>
            </div>

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
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="form-input with-left-icon"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="field-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-type your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="form-input with-left-icon"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-full"
              style={{ marginTop: '4px' }}
            >
              {loading ? <span className="spinner-small"></span> : 'Register'}
            </button>
          </form>

          <div className="auth-form-footer">
            <p style={{ margin: 0 }}>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegisterPage;

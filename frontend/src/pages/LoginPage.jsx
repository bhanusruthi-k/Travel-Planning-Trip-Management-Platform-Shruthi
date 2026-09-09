import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Compass, AlertCircle, CheckCircle2, Lock, Mail } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/trips';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.fullName || user.email}!`, 'success');
      const targetPath = location.state?.from?.pathname;
      const defaultDest = user.role === 'ADMINISTRATOR' ? '/admin/dashboard' : '/dashboard';
      const destination = (!targetPath || targetPath === '/trips' || targetPath === '/login' || targetPath === '/')
        ? defaultDest
        : targetPath;
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-circle">
              <Compass size={28} />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your TripNest account to manage your trips</p>
          </div>

          {error && (
            <div className="alert-box alert-error" role="alert">
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
              <div className="label-row">
                <label htmlFor="password">Password</label>
              </div>
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
            >
              {loading ? <span className="spinner-small"></span> : 'Sign In'}
            </button>
          </form>

          <div className="quick-demo-section">
            <span className="demo-label">Demo accounts for quick testing</span>
            <div className="demo-buttons">
              <button
                type="button"
                className="btn-demo"
                onClick={() => handleQuickFill('traveler@tripnest.com', 'Traveler@123')}
              >
                <CheckCircle2 size={13} />
                <span>Traveler</span>
              </button>
              <button
                type="button"
                className="btn-demo"
                onClick={() => handleQuickFill('admin@tripnest.com', 'Admin@123')}
              >
                <CheckCircle2 size={13} />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

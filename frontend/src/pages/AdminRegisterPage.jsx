import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useToast } from '../context/ToastContext';
import { Shield, AlertCircle, CheckCircle2, User, Mail, Lock, ArrowLeft } from 'lucide-react';

const AdminRegisterPage = () => {
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
      setError('Please enter your admin email address.');
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
      await authApi.registerAdmin({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      const successMsg = 'Admin account created successfully. Please sign in.';
      setSuccess(successMsg);
      showToast(successMsg, 'success');
      setTimeout(() => {
        navigate('/login/admin', { replace: true });
      }, 1000);
    } catch (err) {
      console.error('Admin registration error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to create admin account. Please check your details and try again.';
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
            <h1 className="auth-title">Create Administrator Account</h1>
            <p className="auth-subtitle">Register administrative credentials for TripNest platform management</p>
          </div>

          {error && (
            <div className="alert-box alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-box alert-success" role="status">
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
                  placeholder="e.g. Administrator Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="form-input with-left-icon"
                  autoComplete="name"
                />
              </div>
            </div>

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
              style={{ backgroundColor: '#92400e', borderColor: '#78350f' }}
            >
              {loading ? <span className="spinner-small"></span> : 'Create Admin Account'}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <Link to="/register" className="btn-text-back">
              <ArrowLeft size={15} />
              <span>Back</span>
            </Link>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Already an admin?{' '}
              <Link to="/login/admin" className="auth-link">
                Admin Sign In
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminRegisterPage;

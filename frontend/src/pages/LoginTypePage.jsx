import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, User, Shield, ArrowLeft, ArrowRight } from 'lucide-react';

const LoginTypePage = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card-wrapper" style={{ maxWidth: '560px' }}>
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-circle">
              <Compass size={28} />
            </div>
            <h1 className="auth-title">Welcome to TripNest</h1>
            <p className="auth-subtitle">Select your login portal to access your dashboard</p>
          </div>

          <div className="account-type-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '24px 0' }}>
            {/* Option 1: Traveler */}
            <div className="account-type-card" style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Traveler Login</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '3px 0 0 0', lineHeight: '1.4' }}>
                    Login to plan, organize, and manage your travel journeys and itineraries.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/login/user')}
                  className="btn-account-portal"
                >
                  Traveler Login
                </button>
              </div>
            </div>

            {/* Option 2: Admin */}
            <div className="account-type-card" style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Shield size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Admin Login</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '3px 0 0 0', lineHeight: '1.4' }}>
                    Login to access administrator controls, destination catalogs, and platform stats.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/login/admin')}
                  className="btn-account-portal"
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <Link to="/" className="btn-text-back">
              <ArrowLeft size={15} />
              <span>Back</span>
            </Link>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
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

export default LoginTypePage;

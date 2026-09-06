import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  Compass,
  MapPin,
  Calendar,
  LogOut,
  User,
  Shield,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Signed out successfully', 'info');
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMINISTRATOR':
        return 'badge-admin';
      case 'GROUP_ADMIN':
        return 'badge-group-admin';
      default:
        return 'badge-traveler';
    }
  };

  const isActive = (path) => location.pathname === path;

  const handleThemeToggle = () => {
    toggleTheme();
    showToast(`Switched to ${theme === 'light' ? 'Dark' : 'Light'} Mode`, 'info', 1800);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-icon-wrapper">
            <Compass className="brand-icon" size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-name">TripNest</span>
            <span className="brand-tagline">Travel Planner</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-links" aria-label="Main Navigation">
          <Link
            to="/destinations"
            className={`nav-link ${isActive('/destinations') || location.pathname.startsWith('/destinations/') ? 'active' : ''}`}
          >
            <MapPin size={16} />
            <span>Destinations</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/trips"
              className={`nav-link ${isActive('/trips') || location.pathname.startsWith('/trips/') ? 'active' : ''}`}
            >
              <Calendar size={16} />
              <span>My Trips</span>
            </Link>
          )}
        </nav>

        {/* Actions & Profile */}
        <div className="navbar-actions">
          {/* Theme Toggle Button */}
          <button
            onClick={handleThemeToggle}
            className="theme-toggle-btn"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle light and dark theme"
          >
            {isDark ? (
              <Sun size={18} className="theme-icon sun-icon" />
            ) : (
              <Moon size={18} className="theme-icon moon-icon" />
            )}
            <span className="theme-label">{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {isAuthenticated ? (
            <div className="user-profile-menu">
              <div className="user-info">
                <div className="user-avatar" aria-hidden="true">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={15} />}
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.fullName || user?.email?.split('@')[0]}</span>
                  {user?.role && (
                    <span className={`role-badge ${getRoleBadgeClass(user?.role)}`}>
                      {user?.role === 'ADMINISTRATOR' ? <Shield size={10} /> : <Sparkles size={10} />}
                      {user?.role === 'ADMINISTRATOR' ? 'Admin' : user?.role === 'GROUP_ADMIN' ? 'Leader' : 'Traveler'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-logout"
                title="Sign out of TripNest"
              >
                <LogOut size={16} />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-nav-login">
                Sign In
              </Link>
              <Link to="/register" className="btn-nav-register">
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <Link
            to="/destinations"
            className={`mobile-nav-link ${isActive('/destinations') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <MapPin size={18} />
            <span>Destinations</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/trips"
              className={`mobile-nav-link ${isActive('/trips') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar size={18} />
              <span>My Trips</span>
            </Link>
          )}

          <div className="mobile-drawer-footer">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="btn-logout-mobile">
                <LogOut size={16} />
                <span>Logout ({user?.email})</span>
              </button>
            ) : (
              <div className="mobile-auth-row">
                <Link to="/login" className="btn-nav-login" onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="btn-nav-register" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

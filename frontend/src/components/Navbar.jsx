import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import NotificationDropdown from './NotificationDropdown';
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
  Bell,
  PlusCircle,
  Briefcase,
  Layers,
  LayoutDashboard,
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
    showToast('Signed out of TripNest', 'info');
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

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Left: Brand Identity */}
        <div className="navbar-left">
          <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-icon-box">
              <Compass size={20} className="brand-compass-icon" />
            </div>
            <div className="brand-text-group">
              <span className="brand-name">TripNest</span>
              <span className="brand-workspace-tag">Planner</span>
            </div>
          </Link>

          {/* Desktop Primary Navigation */}
          <nav className="navbar-nav-links" aria-label="Main Navigation">
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
            )}

            <Link
              to="/destinations"
              className={`nav-link ${isActive('/destinations') ? 'active' : ''}`}
            >
              <Compass size={16} />
              <span>Explore</span>
            </Link>

            {isAuthenticated && (
              <Link
                to="/trips"
                className={`nav-link ${isActive('/trips') ? 'active' : ''}`}
              >
                <Briefcase size={16} />
                <span>My Trips</span>
              </Link>
            )}

            {isAuthenticated && user?.role === 'ADMINISTRATOR' && (
              <Link
                to="/admin/dashboard"
                className={`nav-link admin-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              >
                <Shield size={16} />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Quick Action Controls & Profile */}
        <div className="navbar-right">
          {isAuthenticated && (
            <Link to="/trips?action=create" className="btn-nav-create">
              <PlusCircle size={15} />
              <span>New Trip</span>
            </Link>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="navbar-icon-btn"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notifications Trigger */}
          {isAuthenticated && <NotificationDropdown />}

          {/* User Profile or Auth Links */}
          {isAuthenticated ? (
            <div className="user-profile-menu">
              <div className="user-avatar-badge" title={user?.fullName || user?.email}>
                <span className="avatar-initials">
                  {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="user-details-compact">
                <span className="user-display-name">{user?.fullName || user?.email?.split('@')[0]}</span>
                <span className={`user-role-chip ${getRoleBadgeClass(user?.role)}`}>
                  {user?.role === 'ADMINISTRATOR' ? 'Admin' : 'Traveler'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-nav-logout"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="auth-nav-buttons">
              <Link to="/login" className="btn-nav-login">
                Sign In
              </Link>
              <Link to="/register" className="btn-nav-register">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand-icon-box">
                <Compass size={18} />
              </div>
              <span className="brand-name">TripNest</span>
              <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="mobile-drawer-links">
              <Link
                to="/destinations"
                className={`mobile-nav-link ${isActive('/destinations') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Compass size={18} />
                <span>Explore Destinations</span>
              </Link>

              {isAuthenticated && (
                <Link
                  to="/trips"
                  className={`mobile-nav-link ${isActive('/trips') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Briefcase size={18} />
                  <span>My Trips Workspace</span>
                </Link>
              )}

              {isAuthenticated && (
                <Link
                  to="/trips?action=create"
                  className="mobile-nav-link create-trip-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PlusCircle size={18} />
                  <span>Create New Trip</span>
                </Link>
              )}
            </div>

            <div className="mobile-drawer-footer">
              {isAuthenticated ? (
                <button onClick={handleLogout} className="btn-mobile-logout">
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="mobile-auth-actions">
                  <Link
                    to="/login"
                    className="btn-mobile-login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn-mobile-register"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

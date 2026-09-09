import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api/notificationApi';
import {
  Compass,
  User as UserIcon,
  Shield,
  Menu,
  X,
  PlusCircle,
  Briefcase,
  LayoutDashboard,
  Bell,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data?.count || 0);
    } catch (err) {
      // Silently catch unread count errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

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

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || (location.pathname === '/' && isAuthenticated && user?.role !== 'ADMINISTRATOR');
    }
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || (location.pathname === '/' && isAuthenticated && user?.role === 'ADMINISTRATOR');
    }
    if (path === '/trips') {
      return location.pathname === '/trips' || (location.pathname.startsWith('/trips/') && !location.pathname.startsWith('/trips/create'));
    }
    if (path === '/destinations') {
      return location.pathname === '/destinations' || location.pathname.startsWith('/destinations/');
    }
    if (path === '/profile') {
      return location.pathname === '/profile';
    }
    if (path === '/notifications') {
      return location.pathname === '/notifications';
    }
    return location.pathname === path;
  };

  const isAdministrator = user?.role === 'ADMINISTRATOR';

  const handleProfileClick = () => {
    navigate('/profile');
    setMobileMenuOpen(false);
  };

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
            {isAuthenticated && !isAdministrator && (
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
            )}

            {isAuthenticated && isAdministrator && (
              <Link
                to="/admin/dashboard"
                className={`nav-link admin-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              >
                <Shield size={16} />
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

            {isAuthenticated && !isAdministrator && (
              <Link
                to="/trips"
                className={`nav-link ${isActive('/trips') ? 'active' : ''}`}
              >
                <Briefcase size={16} />
                <span>My Trips</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Actions, Notifications & Profile Navigation Trigger */}
        <div className="navbar-right">
          {/* New Trip button - Only for Travelers */}
          {isAuthenticated && !isAdministrator && (
            <Link to="/trips?action=create" className="btn-nav-create">
              <PlusCircle size={15} />
              <span>New Trip</span>
            </Link>
          )}

          {/* Notifications Trigger - Navigates directly to /notifications in SAME tab */}
          {isAuthenticated && (
            <Link
              to="/notifications"
              className={`navbar-icon-btn notification-trigger-btn ${isActive('/notifications') ? 'active-nav-btn' : ''}`}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="notification-badge-count">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User Profile Area (Navigates directly to /profile on click, NO dropdown) */}
          {isAuthenticated ? (
            <div
              className={`user-profile-card ${isActive('/profile') ? 'active-profile' : ''}`}
              onClick={handleProfileClick}
              role="button"
              tabIndex={0}
              title="View Profile"
              aria-label="View Profile"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleProfileClick();
                }
              }}
            >
              <div className="user-avatar-badge" title={user?.fullName || user?.email}>
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user?.fullName || 'User Avatar'}
                    className="avatar-photo-img"
                  />
                ) : (
                  <span className="avatar-initials">
                    {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="user-details-compact">
                <span className="user-display-name">{user?.fullName || user?.email?.split('@')[0]}</span>
                <span className={`user-role-chip ${getRoleBadgeClass(user?.role)}`}>
                  {isAdministrator ? 'ADMINISTRATOR' : (user?.role === 'GROUP_ADMIN' ? 'GROUP_ADMIN' : 'TRAVELER')}
                </span>
              </div>
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
              {isAuthenticated && !isAdministrator && (
                <Link
                  to="/dashboard"
                  className={`mobile-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
              )}

              {isAuthenticated && isAdministrator && (
                <Link
                  to="/admin/dashboard"
                  className={`mobile-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield size={18} />
                  <span>Admin Panel</span>
                </Link>
              )}

              <Link
                to="/destinations"
                className={`mobile-nav-link ${isActive('/destinations') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Compass size={18} />
                <span>Explore Destinations</span>
              </Link>

              {isAuthenticated && !isAdministrator && (
                <Link
                  to="/trips"
                  className={`mobile-nav-link ${isActive('/trips') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Briefcase size={18} />
                  <span>My Trips</span>
                </Link>
              )}

              {isAuthenticated && !isAdministrator && (
                <Link
                  to="/trips?action=create"
                  className="mobile-nav-link create-trip-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PlusCircle size={18} />
                  <span>Create New Trip</span>
                </Link>
              )}

              {isAuthenticated && (
                <Link
                  to="/notifications"
                  className={`mobile-nav-link ${isActive('/notifications') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Bell size={18} />
                  <span>Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
                </Link>
              )}

              {isAuthenticated && (
                <Link
                  to="/profile"
                  className={`mobile-nav-link ${isActive('/profile') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserIcon size={18} />
                  <span>My Profile</span>
                </Link>
              )}
            </div>

            <div className="mobile-drawer-footer">
              {!isAuthenticated && (
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

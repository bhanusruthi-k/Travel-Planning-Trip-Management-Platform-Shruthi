import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, MapPin, Calendar, LogOut, User, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon-wrapper">
            <Compass className="brand-icon" size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-name">TripNest</span>
          </div>
        </Link>

        <nav className="navbar-links" aria-label="Main Navigation">
          <Link
            to="/destinations"
            className={`nav-link ${isActive('/destinations') ? 'active' : ''}`}
          >
            <MapPin size={16} />
            <span>Destinations</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/trips"
              className={`nav-link ${isActive('/trips') ? 'active' : ''}`}
            >
              <Calendar size={16} />
              <span>My Trips</span>
            </Link>
          )}
        </nav>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="user-profile-menu">
              <div className="user-info">
                <div className="user-avatar" aria-hidden="true">
                  <User size={15} />
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.fullName || user?.email}</span>
                  {user?.role && (
                    <span className={`role-badge ${getRoleBadgeClass(user?.role)}`}>
                      {user?.role === 'ADMINISTRATOR' && <Shield size={10} />}
                      {user?.role}
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
                <span>Logout</span>
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
        </div>
      </div>
    </header>
  );
};

export default Navbar;

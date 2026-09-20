import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const allowed = allowedRoles || roles;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading TripNest...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowed && !allowed.includes(user?.role)) {
    return <Navigate to="/trips" replace />;
  }

  return children;
};

export default ProtectedRoute;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginTypePage from './pages/LoginTypePage';
import UserLoginPage from './pages/UserLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterTypePage from './pages/RegisterTypePage';
import UserRegisterPage from './pages/UserRegisterPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import DestinationsPage from './pages/DestinationsPage';
import DestinationDetailsPage from './pages/DestinationDetailsPage';
import TripsPage from './pages/TripsPage';
import TripDetailsPage from './pages/TripDetailsPage';
import TravelerDashboardPage from './pages/TravelerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminTravelersPage from './pages/AdminTravelersPage';
import AdminTripsPage from './pages/AdminTripsPage';
import AdminExpensesPage from './pages/AdminExpensesPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="app-layout">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/destinations" replace />} />
                  <Route path="/destinations" element={<DestinationsPage />} />
                  <Route path="/destinations/:id" element={<DestinationDetailsPage />} />
                  
                  {/* Authentication Routes - Single Login & Single Public Register */}
                  <Route path="/login" element={<UserLoginPage />} />
                  <Route path="/login/user" element={<Navigate to="/login" replace />} />
                  <Route path="/login/admin" element={<Navigate to="/login" replace />} />
                  <Route path="/register" element={<UserRegisterPage />} />
                  <Route path="/register/user" element={<Navigate to="/register" replace />} />
                  <Route path="/register/admin" element={<Navigate to="/register" replace />} />

                  {/* Protected Dashboards & Trip Management */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <TravelerDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute roles={['ADMINISTRATOR']}>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/travelers"
                    element={
                      <ProtectedRoute roles={['ADMINISTRATOR']}>
                        <AdminTravelersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/trips"
                    element={
                      <ProtectedRoute roles={['ADMINISTRATOR']}>
                        <AdminTripsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/expenses"
                    element={
                      <ProtectedRoute roles={['ADMINISTRATOR']}>
                        <AdminExpensesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/trips"
                    element={
                      <ProtectedRoute>
                        <TripsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/trips/:id"
                    element={
                      <ProtectedRoute>
                        <TripDetailsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/destinations" replace />} />
                </Routes>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}


export default App;

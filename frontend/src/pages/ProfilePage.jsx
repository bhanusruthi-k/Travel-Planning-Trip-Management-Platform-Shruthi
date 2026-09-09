import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/userApi';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  FileText,
  Shield,
  Key,
  Bell,
  Sun,
  Moon,
  LogOut,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  X,
  Sparkles,
} from 'lucide-react';
import DatePicker from '../components/DatePicker';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  // Profile Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    country: '',
    city: '',
    bio: '',
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password Change State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const saved = localStorage.getItem('tripnest_notif_prefs');
    return saved
      ? JSON.parse(saved)
      : { tripUpdates: true, joinRequests: true, emailAlerts: true };
  });

  // Photo Upload State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch latest profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const data = await userApi.getProfile();
        setFormData({
          fullName: data.fullName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || '',
          country: data.country || '',
          city: data.city || '',
          bio: data.bio || '',
        });
        updateUser(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
        if (user) {
          setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            dateOfBirth: user.dateOfBirth || '',
            gender: user.gender || '',
            country: user.country || '',
            city: user.city || '',
            bio: user.bio || '',
          });
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle Photo Selection & Upload
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation: file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showToast('Please select a valid image file (JPG, PNG, or WEBP).', 'error');
      return;
    }

    // Client-side validation: file size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB.', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const updatedUser = await userApi.updatePhoto(base64Data);
          updateUser(updatedUser);
          showToast('Profile photo updated successfully.', 'success');
        } catch (err) {
          console.error('Failed to update photo on server:', err);
          showToast('Failed to update photo. Please try again.', 'error');
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error reading file:', err);
      setUploadingPhoto(false);
      showToast('Failed to process image file.', 'error');
    }
  };

  // Handle Profile Form Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!formData.fullName.trim()) {
      setProfileError('Full Name is required.');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        dateOfBirth: formData.dateOfBirth.trim(),
        gender: formData.gender.trim(),
        country: formData.country.trim(),
        city: formData.city.trim(),
        bio: formData.bio.trim(),
      };

      const updatedUser = await userApi.updateProfile(payload);
      updateUser(updatedUser);
      setProfileSuccess('Profile updated successfully.');
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to update profile:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to update profile. Please verify your details.';
      setProfileError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await userApi.changePassword(passwordData);
      setPasswordSuccess('Password changed successfully.');
      showToast('Password changed successfully.', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowPasswordSection(false), 2000);
    } catch (err) {
      console.error('Failed to change password:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to change password. Please check your current password.';
      setPasswordError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Notification Preferences Change
  const handleSaveNotifPrefs = () => {
    localStorage.setItem('tripnest_notif_prefs', JSON.stringify(notifPrefs));
    showToast('Notification preferences saved.', 'success');
  };

  // Handle Logout
  const handleLogout = () => {
    logout();
    showToast('Signed out of TripNest.', 'info');
    navigate('/login');
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await userApi.deleteAccount();
      setShowDeleteModal(false);
      logout();
      showToast('Your account has been deleted permanently.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Failed to delete account:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to delete account. Please try again.';
      showToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const isAdministrator = user?.role === 'ADMINISTRATOR';

  return (
    <div className="profile-page-wrapper">
      <div className="profile-page-container">
        {/* Navigation & Header */}
        <div className="profile-top-bar">
          <button
            type="button"
            className="btn-profile-back"
            onClick={() => navigate(-1)}
            aria-label="Back to previous page"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="profile-heading-group">
            <h1 className="profile-page-title">Profile</h1>
            <p className="profile-page-subtitle">
              Manage your personal information and TripNest account.
            </p>
          </div>
        </div>

        {/* Hero / Avatar Banner Card */}
        <div className="profile-hero-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user?.fullName || 'User Avatar'}
                  className="profile-large-img"
                />
              ) : (
                <span className="profile-large-initial">
                  {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="profile-identity-details">
              <h2 className="profile-display-name">{user?.fullName || 'TripNest Member'}</h2>
              <div className="profile-role-badge-row">
                <span className={`profile-role-tag ${isAdministrator ? 'admin' : 'traveler'}`}>
                  {isAdministrator ? <Shield size={12} /> : <User size={12} />}
                  {isAdministrator ? 'ADMINISTRATOR' : (user?.role === 'GROUP_ADMIN' ? 'GROUP_ADMIN' : 'TRAVELER')}
                </span>
                <span className="profile-email-subtext">{user?.email}</span>
              </div>
            </div>

            <div className="profile-photo-actions">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/jpeg,image/png,image/webp,image/jpg"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-change-photo"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                <Camera size={14} />
                <span>{uploadingPhoto ? 'Uploading...' : 'Change Photo'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Profile Form Grid */}
        <div className="profile-content-layout">
          {/* 1. PERSONAL INFORMATION CARD */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="card-header-icon-box blue">
                <User size={18} />
              </div>
              <div>
                <h3 className="card-section-title">Personal Information</h3>
                <p className="card-section-desc">
                  Update your contact details and public travel biography.
                </p>
              </div>
            </div>

            {profileError && (
              <div className="profile-alert error" role="alert">
                <AlertTriangle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="profile-alert success" role="alert">
                <CheckCircle2 size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-grid-two-col">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <div className="input-with-icon">
                    <User size={15} className="field-icon" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Sruthi Sruthi"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="form-input-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email Address <Lock size={12} title="Email cannot be changed" />
                  </label>
                  <div className="input-with-icon disabled">
                    <Mail size={15} className="field-icon" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="form-input-field disabled"
                      title="Email is permanently tied to account authentication"
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid-three-col">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={15} className="field-icon" />
                    <input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+91 ..."
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="form-input-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <DatePicker
                    value={formData.dateOfBirth}
                    onChange={(d) => setFormData({ ...formData, dateOfBirth: d })}
                    placeholder="Select date of birth"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="form-select-field"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-two-col">
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <div className="input-with-icon">
                    <Globe size={15} className="field-icon" />
                    <input
                      id="country"
                      type="text"
                      placeholder="e.g. India"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="form-input-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <div className="input-with-icon">
                    <MapPin size={15} className="field-icon" />
                    <input
                      id="city"
                      type="text"
                      placeholder="e.g. Nellore"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="form-input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <div className="textarea-wrapper">
                  <textarea
                    id="bio"
                    rows="3"
                    placeholder="Tell other travelers about your travel passions, favorite destinations, and goals..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="form-textarea-field"
                    maxLength={1000}
                  />
                </div>
                <span className="field-character-count">
                  {formData.bio?.length || 0}/1000 characters
                </span>
              </div>

              <div className="profile-form-footer">
                <button
                  type="submit"
                  className="btn-save-profile"
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* 2. ACCOUNT & SECURITY CARD */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="card-header-icon-box purple">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="card-section-title">Account & Security</h3>
                <p className="card-section-desc">
                  Review your role permissions and update your login password.
                </p>
              </div>
            </div>

            <div className="account-info-strip">
              <div className="account-info-row">
                <span className="info-label">Account Role</span>
                <span className={`profile-role-tag ${isAdministrator ? 'admin' : 'traveler'}`}>
                  {isAdministrator ? 'ADMINISTRATOR' : (user?.role === 'GROUP_ADMIN' ? 'GROUP_ADMIN' : 'TRAVELER')}
                </span>
              </div>

              <div className="account-info-row">
                <span className="info-label">Password</span>
                <div className="password-action-wrap">
                  <span className="masked-password">••••••••••••</span>
                  <button
                    type="button"
                    className="btn-action-outline"
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                  >
                    <Key size={14} />
                    <span>{showPasswordSection ? 'Cancel' : 'Change Password'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Change Password Form */}
            {showPasswordSection && (
              <form onSubmit={handlePasswordSubmit} className="change-password-form">
                {passwordError && (
                  <div className="profile-alert error" role="alert">
                    <AlertTriangle size={15} />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="profile-alert success" role="alert">
                    <CheckCircle2 size={15} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password *</label>
                  <input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                    className="form-input-field"
                  />
                </div>

                <div className="form-grid-two-col">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password (min 6 chars) *</label>
                    <input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      required
                      minLength={6}
                      className="form-input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password *</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repeat new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      required
                      className="form-input-field"
                    />
                  </div>
                </div>

                <div className="password-form-actions">
                  <button
                    type="submit"
                    className="btn-save-profile"
                    disabled={savingPassword}
                  >
                    {savingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 3. NOTIFICATION PREFERENCES & APPEARANCE */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="card-header-icon-box emerald">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="card-section-title">Preferences & Appearance</h3>
                <p className="card-section-desc">
                  Customize notification delivery and interface theme.
                </p>
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="preferences-group">
              <h4 className="preferences-subheading">Notification Settings</h4>

              <div className="toggle-list">
                <label className="pref-toggle-item">
                  <input
                    type="checkbox"
                    checked={notifPrefs.tripUpdates}
                    onChange={(e) =>
                      setNotifPrefs({ ...notifPrefs, tripUpdates: e.target.checked })
                    }
                    className="pref-checkbox"
                  />
                  <div className="toggle-text-block">
                    <strong className="toggle-title">Travel Updates & Itinerary Changes</strong>
                    <span className="toggle-desc">
                      Receive alerts when trip dates, destinations, or activities are modified.
                    </span>
                  </div>
                </label>

                <label className="pref-toggle-item">
                  <input
                    type="checkbox"
                    checked={notifPrefs.joinRequests}
                    onChange={(e) =>
                      setNotifPrefs({ ...notifPrefs, joinRequests: e.target.checked })
                    }
                    className="pref-checkbox"
                  />
                  <div className="toggle-text-block">
                    <strong className="toggle-title">Trip Invitations & Collaboration</strong>
                    <span className="toggle-desc">
                      Get notified when members join or request to join your travel itineraries.
                    </span>
                  </div>
                </label>

                <label className="pref-toggle-item">
                  <input
                    type="checkbox"
                    checked={notifPrefs.emailAlerts}
                    onChange={(e) =>
                      setNotifPrefs({ ...notifPrefs, emailAlerts: e.target.checked })
                    }
                    className="pref-checkbox"
                  />
                  <div className="toggle-text-block">
                    <strong className="toggle-title">Email Notifications</strong>
                    <span className="toggle-desc">
                      Send critical itinerary and safety reminders to your registered email.
                    </span>
                  </div>
                </label>
              </div>

              <button
                type="button"
                className="btn-action-outline compact"
                onClick={handleSaveNotifPrefs}
              >
                Save Notification Preferences
              </button>
            </div>

            <div className="profile-section-divider"></div>

            {/* Appearance Mode */}
            <div className="preferences-group">
              <h4 className="preferences-subheading">Appearance</h4>
              <p className="preferences-desc">Choose between clean bright mode and sleek dark mode.</p>

              <div className="appearance-toggle-container">
                <button
                  type="button"
                  className={`btn-appearance-choice ${!isDark ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <Sun size={15} />
                  <span>Bright Mode</span>
                </button>
                <button
                  type="button"
                  className={`btn-appearance-choice ${isDark ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <Moon size={15} />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. ACCOUNT ACTIONS & DANGER ZONE */}
          <div className="profile-card danger-card">
            <div className="profile-card-header">
              <div className="card-header-icon-box red">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="card-section-title">Account Actions & Danger Zone</h3>
                <p className="card-section-desc">
                  Sign out of your session or permanently remove your account data.
                </p>
              </div>
            </div>

            <div className="account-action-rows">
              {/* Logout Action */}
              <div className="account-action-item">
                <div>
                  <strong className="action-title">Logout</strong>
                  <p className="action-subtitle">
                    Safely sign out of your TripNest account on this device.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-logout-action"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>

              <div className="profile-section-divider"></div>

              {/* Delete Account Danger Action */}
              <div className="account-action-item danger-item">
                <div>
                  <strong className="action-title danger-text">Delete My Account</strong>
                  <p className="action-subtitle">
                    Permanently delete your account, trips, itineraries, and all personal records.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-delete-account-action"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={15} />
                  <span>Delete My Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal-backdrop"
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="delete-modal-title-group">
                <div className="delete-icon-circle">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="modal-title">Delete your account?</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !deleteLoading && setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="delete-modal-body">
              <p>
                Are you sure you want to permanently delete your TripNest account?
              </p>
              <p className="warning-callout">
                This action cannot be undone. All your trips, itineraries, budget records, and profile details will be permanently removed.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-delete-confirm"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting Account...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

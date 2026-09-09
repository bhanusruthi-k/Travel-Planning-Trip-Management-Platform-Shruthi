import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Clock,
  CheckCircle2,
  UserPlus,
  Users,
  AlertCircle,
  TrendingDown,
  ArrowLeft,
  Calendar,
  Check,
  X,
  Mail,
  Compass,
} from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import { memberApi } from '../api/memberApi';
import { useToast } from '../context/ToastContext';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [actionStatus, setActionStatus] = useState({}); // { [notifId]: 'accepting' | 'accepted' | 'rejecting' | 'rejected' }

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Unable to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
      );
      showToast('Notification marked as read', 'info');
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      showToast('Failed to mark notification as read', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, isRead: true }))
      );
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      showToast('Failed to mark all notifications as read', 'error');
    }
  };

  const handleAcceptInvitation = async (e, notif) => {
    e.stopPropagation();
    const tripId = notif.tripId;
    if (!tripId) {
      showToast('Unable to determine trip for invitation.', 'error');
      return;
    }

    setActionStatus((prev) => ({ ...prev, [notif.id]: 'accepting' }));
    try {
      await memberApi.acceptInvitation(tripId);
      setActionStatus((prev) => ({ ...prev, [notif.id]: 'accepted' }));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true, isRead: true } : n))
      );
      showToast('You have joined the trip successfully!', 'success');
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      const msg = err.response?.data?.message || 'Failed to accept invitation.';
      showToast(msg, 'error');
      setActionStatus((prev) => ({ ...prev, [notif.id]: null }));
    }
  };

  const handleRejectInvitation = async (e, notif) => {
    e.stopPropagation();
    const tripId = notif.tripId;
    if (!tripId) {
      showToast('Unable to determine trip for invitation.', 'error');
      return;
    }

    setActionStatus((prev) => ({ ...prev, [notif.id]: 'rejecting' }));
    try {
      await memberApi.rejectInvitation(tripId);
      setActionStatus((prev) => ({ ...prev, [notif.id]: 'rejected' }));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true, isRead: true } : n))
      );
      showToast('Trip invitation declined.', 'info');
    } catch (err) {
      console.error('Failed to reject invitation:', err);
      const msg = err.response?.data?.message || 'Failed to reject invitation.';
      showToast(msg, 'error');
      setActionStatus((prev) => ({ ...prev, [notif.id]: null }));
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffSecs = Math.floor((now - date) / 1000);

      let relative = '';
      if (diffSecs < 60) relative = 'Just now';
      else if (diffSecs < 3600) relative = `${Math.floor(diffSecs / 60)}m ago`;
      else if (diffSecs < 86400) relative = `${Math.floor(diffSecs / 3600)}h ago`;
      else if (diffSecs < 604800) relative = `${Math.floor(diffSecs / 86400)}d ago`;
      else relative = date.toLocaleDateString();

      const fullTime = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return { relative, fullTime };
    } catch {
      return { relative: '', fullTime: '' };
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'TRIP_INVITATION':
        return <Mail size={18} className="notif-page-icon invitation" />;
      case 'INVITATION_ACCEPTED':
        return <CheckCircle2 size={18} className="notif-page-icon approved" />;
      case 'INVITATION_REJECTED':
        return <AlertCircle size={18} className="notif-page-icon rejected" />;
      case 'MEMBER_ADDED':
        return <UserPlus size={18} className="notif-page-icon member" />;
      case 'JOIN_REQUEST_SUBMITTED':
        return <Users size={18} className="notif-page-icon join" />;
      case 'JOIN_REQUEST_APPROVED':
        return <CheckCircle2 size={18} className="notif-page-icon approved" />;
      case 'JOIN_REQUEST_REJECTED':
        return <AlertCircle size={18} className="notif-page-icon rejected" />;
      case 'BUDGET_ALERT':
        return <TrendingDown size={18} className="notif-page-icon budget" />;
      case 'TRIP_REMINDER':
        return <Calendar size={18} className="notif-page-icon reminder" />;
      default:
        return <Bell size={18} className="notif-page-icon general" />;
    }
  };

  const formatTypeLabel = (type) => {
    if (!type) return 'Update';
    if (type === 'TRIP_INVITATION') return 'Trip Invitation';
    if (type === 'INVITATION_ACCEPTED') return 'Invitation Accepted';
    if (type === 'INVITATION_REJECTED') return 'Invitation Rejected';
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') {
      return !n.read && !n.isRead;
    }
    return true;
  });

  return (
    <div className="notifications-page-container">
      {/* Top Breadcrumb / Back Bar */}
      <div className="notifications-page-topbar">
        <button
          className="btn-notifications-back"
          onClick={() => navigate(-1)}
          title="Back to previous page"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {/* Main Card Wrapper */}
      <div className="notifications-main-card">
        {/* Header Section */}
        <div className="notifications-header-section">
          <div className="notifications-title-area">
            <div className="notifications-title-row">
              <h1 className="notifications-title">Notifications</h1>
              {unreadCount > 0 && (
                <span className="notifications-unread-count-badge">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="notifications-subtitle">
              Stay updated on your trip invitations, budget updates, and travel activities.
            </p>
          </div>

          <div className="notifications-header-actions">
            {unreadCount > 0 && (
              <button
                className="btn-mark-all-read-page"
                onClick={handleMarkAllAsRead}
                title="Mark all notifications as read"
              >
                <CheckCheck size={16} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="notifications-filter-bar">
          <div className="notifications-tab-group">
            <button
              className={`notifications-tab-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All Notifications ({notifications.length})
            </button>
            <button
              className={`notifications-tab-btn ${filter === 'UNREAD' ? 'active' : ''}`}
              onClick={() => setFilter('UNREAD')}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="notifications-content-body">
          {loading ? (
            <div className="notifications-loading-state">
              <div className="notifications-spinner"></div>
              <p>Loading your notifications...</p>
            </div>
          ) : error ? (
            <div className="notifications-error-banner">
              <AlertCircle size={24} />
              <div>
                <h4>Unable to load notifications</h4>
                <p>{error}</p>
              </div>
              <button onClick={() => fetchNotifications(false)} className="btn-retry">
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notifications-empty-container">
              <div className="empty-notif-illustration-box">
                <Bell size={42} className="empty-notif-icon" />
              </div>
              <h3 className="empty-notif-title">No notifications yet</h3>
              <p className="empty-notif-subtitle">
                You are all caught up on trip activities!
              </p>
            </div>
          ) : (
            <div className="notifications-list-wrapper">
              {filteredNotifications.map((notif) => {
                const isUnread = !notif.read && !notif.isRead;
                const { relative, fullTime } = formatTimestamp(notif.createdAt);
                const isTripInvitation =
                  notif.type === 'TRIP_INVITATION' ||
                  (notif.message && notif.message.toLowerCase().includes('invited to join'));
                const status = actionStatus[notif.id];

                return (
                  <div
                    key={notif.id}
                    className={`notification-page-item ${isUnread ? 'is-unread' : 'is-read'} ${isTripInvitation ? 'invitation-item' : ''}`}
                    onClick={(e) => isUnread && !isTripInvitation && handleMarkAsRead(e, notif.id)}
                  >
                    <div className="notif-page-icon-wrapper">
                      {getNotifIcon(notif.type)}
                      {isUnread && <span className="notif-page-unread-dot"></span>}
                    </div>

                    <div className="notif-page-body-content">
                      <div className="notif-page-top-meta">
                        {notif.type && (
                          <span className={`notif-type-tag ${notif.type.toLowerCase().replace(/_/g, '-')}`}>
                            {formatTypeLabel(notif.type)}
                          </span>
                        )}
                        <span className="notif-page-time" title={fullTime}>
                          <Clock size={12} /> {relative || fullTime}
                        </span>
                      </div>

                      <p className="notif-page-message">{notif.message}</p>

                      {/* Interactive Actions for Trip Invitations */}
                      {isTripInvitation && notif.tripId && (
                        <div className="notif-invitation-actions-row">
                          {status === 'accepted' ? (
                            <span className="notif-action-badge accepted">
                              <CheckCircle2 size={14} /> Accepted & Joined
                            </span>
                          ) : status === 'rejected' ? (
                            <span className="notif-action-badge rejected">
                              <X size={14} /> Declined
                            </span>
                          ) : (
                            <div className="notif-action-buttons-group">
                              <button
                                className="btn-notif-accept"
                                disabled={status === 'accepting' || status === 'rejecting'}
                                onClick={(e) => handleAcceptInvitation(e, notif)}
                                title="Accept trip invitation"
                              >
                                {status === 'accepting' ? (
                                  <span className="spinner-small"></span>
                                ) : (
                                  <Check size={14} />
                                )}
                                <span>Accept</span>
                              </button>
                              <button
                                className="btn-notif-reject"
                                disabled={status === 'accepting' || status === 'rejecting'}
                                onClick={(e) => handleRejectInvitation(e, notif)}
                                title="Decline trip invitation"
                              >
                                {status === 'rejecting' ? (
                                  <span className="spinner-small"></span>
                                ) : (
                                  <X size={14} />
                                )}
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {fullTime && (
                        <span className="notif-page-fulltime-caption">
                          {fullTime}
                        </span>
                      )}
                    </div>

                    <div className="notif-page-right-actions">
                      {isUnread && !isTripInvitation ? (
                        <button
                          className="btn-notif-page-mark-read"
                          onClick={(e) => handleMarkAsRead(e, notif.id)}
                          title="Mark as read"
                        >
                          <CheckCircle2 size={16} />
                          <span className="action-text">Mark Read</span>
                        </button>
                      ) : (
                        <span className="notif-read-status-pill">
                          <CheckCheck size={14} /> {isUnread ? 'Pending' : 'Read'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

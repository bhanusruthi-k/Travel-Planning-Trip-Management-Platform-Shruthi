import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, Clock, CheckCircle2, UserPlus, Users, AlertCircle } from 'lucide-react';
import { notificationApi } from '../api/notificationApi';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data || []);
      const count = (data || []).filter((n) => !n.read && !n.isRead).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // When dropdown opens, fetch full notifications list
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const date = new Date(timestamp);
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'MEMBER_ADDED':
        return <UserPlus size={15} className="notif-type-icon member" />;
      case 'JOIN_REQUEST_SUBMITTED':
        return <Users size={15} className="notif-type-icon join" />;
      case 'JOIN_REQUEST_APPROVED':
        return <CheckCircle2 size={15} className="notif-type-icon approved" />;
      case 'JOIN_REQUEST_REJECTED':
        return <AlertCircle size={15} className="notif-type-icon rejected" />;
      default:
        return <Bell size={15} className="notif-type-icon general" />;
    }
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button
        className="navbar-icon-btn notification-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="notification-badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-panel" role="region" aria-label="Notifications Panel">
          <div className="notification-panel-header">
            <div className="notification-header-title-row">
              <span className="notification-panel-title">Notifications</span>
              {unreadCount > 0 && (
                <span className="notification-unread-pill">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="btn-mark-all-read"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notification-panel-body">
            {loading ? (
              <div className="notification-loading-state">
                <div className="notification-mini-spinner"></div>
                <span>Loading notifications...</span>
              </div>
            ) : error ? (
              <div className="notification-error-state">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty-state">
                <Bell size={32} className="empty-bell-icon" />
                <p className="empty-title">No notifications yet</p>
                <p className="empty-subtitle">You are all caught up on trip activities!</p>
              </div>
            ) : (
              <div className="notification-items-list">
                {notifications.map((notif) => {
                  const isUnread = !notif.read && !notif.isRead;
                  return (
                    <div
                      key={notif.id}
                      className={`notification-item-card ${isUnread ? 'unread' : 'read'}`}
                      onClick={(e) => isUnread && handleMarkAsRead(e, notif.id)}
                    >
                      <div className="notification-item-left">
                        {getNotifIcon(notif.type)}
                        {isUnread && <span className="notification-unread-dot"></span>}
                      </div>

                      <div className="notification-item-content">
                        <p className="notification-item-message">{notif.message}</p>
                        <span className="notification-item-timestamp">
                          <Clock size={11} /> {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      {isUnread && (
                        <button
                          className="btn-mark-single-read"
                          onClick={(e) => handleMarkAsRead(e, notif.id)}
                          title="Mark as read"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const lastToastRef = useRef({ message: '', timestamp: 0 });

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    if (!message) return;

    // De-duplication: prevent showing the exact same toast if requested within 1.5 seconds
    const now = Date.now();
    if (
      lastToastRef.current.message === message &&
      now - lastToastRef.current.timestamp < 1500
    ) {
      return;
    }
    lastToastRef.current = { message, timestamp: now };

    const id = now + '-' + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => {
      // Limit maximum visible toasts to 4 at a time
      const filtered = prev.filter((t) => t.message !== message);
      return [...filtered.slice(-3), { id, message, type }];
    });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <div className="toast-icon-badge toast-badge-success">
            <Check size={15} strokeWidth={2.8} />
          </div>
        );
      case 'error':
        return (
          <div className="toast-icon-badge toast-badge-error">
            <X size={15} strokeWidth={2.8} />
          </div>
        );
      case 'warning':
        return (
          <div className="toast-icon-badge toast-badge-warning">
            <AlertTriangle size={15} strokeWidth={2.5} />
          </div>
        );
      default:
        return (
          <div className="toast-icon-badge toast-badge-info">
            <Info size={15} strokeWidth={2.5} />
          </div>
        );
    }
  };

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      <div className="toast-portal" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-card toast-${toast.type}`}
            role="alert"
          >
            {getToastIcon(toast.type)}
            <div className="toast-content">
              <span className="toast-message">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast-close-btn"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;

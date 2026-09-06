import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="toast-icon toast-icon-success" />;
      case 'error':
        return <AlertCircle size={18} className="toast-icon toast-icon-error" />;
      case 'warning':
        return <AlertTriangle size={18} className="toast-icon toast-icon-warning" />;
      default:
        return <Info size={18} className="toast-icon toast-icon-info" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      <div className="toast-portal" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            {getToastIcon(toast.type)}
            <span className="toast-message">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast-close"
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

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop confirm-modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true">
      <div
        className="modal-content confirm-dialog-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
          opacity: 1,
          animation: 'modalFadeIn 0.18s ease-out',
        }}
      >
        <div className="confirm-modal-header" style={{ padding: '22px 24px 12px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#ffffff' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: danger ? '#fee2e2' : 'rgba(189, 68, 68, 0.12)',
              color: danger ? '#dc2626' : 'var(--color-primary, #BD4444)',
              flexShrink: 0,
            }}
          >
            {danger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '0 24px 22px', backgroundColor: '#ffffff' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: 1.6 }}>
            {message}
          </p>
        </div>

        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="btn-modal-cancel"
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              transition: 'all 0.15s ease',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className="btn-modal-confirm"
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              backgroundColor: danger ? '#dc2626' : 'var(--color-primary, #BD4444)',
              color: '#ffffff',
              border: 'none',
              boxShadow: danger ? '0 2px 6px rgba(220, 38, 38, 0.3)' : '0 2px 6px rgba(189, 68, 68, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

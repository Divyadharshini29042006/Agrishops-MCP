// frontend/src/context/ToastContext.jsx - COMPLETE FIXED VERSION
import { createContext, useState, useCallback } from 'react';

/**
 * Toast Context
 * Provides global toast notification functionality
 */
const ToastContext = createContext(); // ✅ Created but needs to be exported

// ✅ Module-level counter — always unique, no floating-point collision
let toastCounter = 0;

/**
 * Default toast durations (in milliseconds)
 */
const TOAST_DURATIONS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000
};

/**
 * Maximum number of toasts to show simultaneously
 */
const MAX_TOASTS = 3;

/**
 * Toast Provider Component
 * Wraps the app to provide toast functionality
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);

  /**
   * Add a toast to the queue or display immediately
   * @param {string} message - Toast message
   * @param {string} type - Toast type ('success', 'error', 'warning', 'info')
   * @param {number} duration - Auto-dismiss duration in ms
   */
  const addToast = useCallback((message, type = 'info', duration) => {
    if (!message || typeof message !== 'string') {
      console.warn('Toast message must be a non-empty string');
      return;
    }

    const toastDuration = duration || TOAST_DURATIONS[type] || TOAST_DURATIONS.info;
    const id = ++toastCounter;

    const newToast = {
      id,
      message,
      type,
      duration: toastDuration,
      timestamp: Date.now()
    };

    setToasts(prev => {
      if (prev.length >= MAX_TOASTS) {
        // Add to queue
        setToastQueue(queue => [...queue, newToast]);
        return prev;
      }
      return [...prev, newToast];
    });
  }, []);

  /**
   * Remove a toast by ID
   * @param {string|number} id - Toast ID to remove
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => {
      const filtered = prev.filter(toast => toast.id !== id);

      // If we removed a toast and have queued toasts, add the next one
      if (filtered.length < MAX_TOASTS && toastQueue.length > 0) {
        setToastQueue(queue => {
          const [nextToast, ...remainingQueue] = queue;
          if (nextToast) {
            setTimeout(() => {
              setToasts(current => [...current, nextToast]);
            }, 100);
          }
          return remainingQueue;
        });
      }

      return filtered;
    });
  }, [toastQueue]);

  /**
   * Clear all toasts
   */
  const clearAllToasts = useCallback(() => {
    setToasts([]);
    setToastQueue([]);
  }, []);

  /**
   * Show success toast
   * @param {string} message - Success message
   * @param {number} duration - Optional custom duration
   */
  const showSuccess = useCallback((message, duration) => {
    addToast(message, 'success', duration);
  }, [addToast]);

  /**
   * Show error toast
   * @param {string} message - Error message
   * @param {number} duration - Optional custom duration
   */
  const showError = useCallback((message, duration) => {
    addToast(message, 'error', duration);
  }, [addToast]);

  /**
   * Show warning toast
   * @param {string} message - Warning message
   * @param {number} duration - Optional custom duration
   */
  const showWarning = useCallback((message, duration) => {
    addToast(message, 'warning', duration);
  }, [addToast]);

  /**
   * Show info toast
   * @param {string} message - Info message
   * @param {number} duration - Optional custom duration
   */
  const showInfo = useCallback((message, duration) => {
    addToast(message, 'info', duration);
  }, [addToast]);

  const value = {
    toasts,
    toastQueue,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

// ✅ EXPORT ToastContext as a named export
export { ToastContext };

// ✅ ALSO keep it as default export for backward compatibility
export default ToastContext;
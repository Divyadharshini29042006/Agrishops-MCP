// frontend/src/hooks/useToast.js - FINAL FIXED VERSION
import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext'; // ✅ Named import

/**
 * Custom hook to use toast functionality
 * @returns {Object} Toast context value with helper functions
 * @example
 * const { showSuccess, showError, showWarning, showInfo } = useToast();
 * showSuccess('Operation completed!');
 * showError('Something went wrong!');
 */
const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

export default useToast;
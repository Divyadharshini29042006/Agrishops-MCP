// frontend/src/components/common/Toast.jsx
import { useEffect, useState } from 'react';
import { HiCheckCircle, HiXCircle, HiExclamation, HiInformationCircle, HiX } from 'react-icons/hi';
import useToast from '../../hooks/useToast';

/**
 * Individual Toast Component
 */
const ToastItem = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const startTime = Date.now();
    const endTime = startTime + toast.duration;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;
      const newProgress = (remaining / toast.duration) * 100;

      if (newProgress <= 0) {
        clearInterval(interval);
        onClose(toast.id);
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, toast.duration, onClose, isPaused]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-600',
          icon: <HiCheckCircle className="w-6 h-6" />,
          progressBg: 'bg-green-400'
        };
      case 'error':
        return {
          bg: 'bg-red-600',
          icon: <HiXCircle className="w-6 h-6" />,
          progressBg: 'bg-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-600',
          icon: <HiExclamation className="w-6 h-6" />,
          progressBg: 'bg-yellow-400'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-600',
          icon: <HiInformationCircle className="w-6 h-6" />,
          progressBg: 'bg-blue-400'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`${styles.bg} text-white px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md transform transition-all duration-300 ease-in-out animate-slide-in`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {styles.icon}
        </div>

        {/* Message */}
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium leading-5">{toast.message}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
          aria-label="Close notification"
        >
          <HiX className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
        <div
          className={`h-full ${styles.progressBg} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Toast Container Component
 * Renders all active toasts
 */
const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
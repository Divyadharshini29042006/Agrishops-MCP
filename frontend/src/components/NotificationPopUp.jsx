import React, { useEffect, useState } from 'react';
import { HiBell, HiX, HiChevronRight, HiShoppingCart, HiTag, HiExclamation } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../hooks/useAuth';

const NotificationPopUp = () => {
  const { newNotification, setNewNotification, markAsRead } = useNotifications();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (newNotification) {
      setIsVisible(true);
      // Play a subtle sound if possible (optional)
    } else {
      setIsVisible(false);
    }
  }, [newNotification]);

  if (!newNotification) return null;

  const handleClose = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => setNewNotification(null), 300);
  };

  const handleClick = () => {
    // Navigate based on type and role
    if (newNotification.actionUrl) {
      navigate(newNotification.actionUrl);
    } else {
      const type = newNotification.type;
      const role = user?.role;

      if (type === 'order_placed' || type === 'order_status_update') {
        if (role === 'supplier') navigate('/supplier/orders');
        else if (role === 'retailer') navigate('/retailer/orders');
        else navigate('/orders');
      } else if (type?.startsWith('wholesale_inquiry')) {
        if (role === 'supplier') navigate('/supplier/wholesale-inquiries');
        else navigate('/wholesale-inquiries');
      }
    }
    
    // Mark as read
    markAsRead(newNotification._id);
    handleClose({ stopPropagation: () => {} });
  };

  const getIcon = () => {
    switch (newNotification.type) {
      case 'order_placed':
      case 'order_status_update':
        return <HiShoppingCart className="w-6 h-6 text-blue-600" />;
      case 'wholesale_inquiry_received':
      case 'wholesale_inquiry_response':
        return <HiBell className="w-6 h-6 text-indigo-600" />;
      case 'low_stock':
        return <HiTag className="w-6 h-6 text-orange-600" />;
      case 'system_alert':
        return <HiExclamation className="w-6 h-6 text-red-600" />;
      default:
        return <HiBell className="w-6 h-6 text-green-600" />;
    }
  };

  const getBgColor = () => {
    if (newNotification.priority === 'urgent' || newNotification.priority === 'high') {
      return 'bg-blue-50 border-blue-200';
    }
    return 'bg-white border-gray-200';
  };

  return (
    <div 
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-500 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
      }`}
    >
      <div 
        onClick={handleClick}
        className={`w-96 max-w-[calc(100vw-3rem)] p-4 rounded-2xl shadow-2xl border ${getBgColor()} cursor-pointer hover:shadow-green-100/50 transition-all group overflow-hidden relative`}
      >
        {/* Animated border line for high priority */}
        {(newNotification.priority === 'high' || newNotification.priority === 'urgent') && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 animate-pulse" />
        )}

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${newNotification.priority === 'high' ? 'bg-blue-100' : 'bg-gray-100'} group-hover:scale-110 transition-transform`}>
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {newNotification.title}
              </h4>
              <button 
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
              {newNotification.message}
            </p>
            
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Just Now
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
                <span>{newNotification.actionText || 'View Details'}</span>
                <HiChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopUp;

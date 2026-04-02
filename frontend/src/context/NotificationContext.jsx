import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { showInfo } = useToast?.() || {}; // Optional toast integration
  const [lastNotificationId, setLastNotificationId] = useState(null);
  const [newNotification, setNewNotification] = useState(null);

  const fetchNotifications = useCallback(async (isInitial = false) => {
    if (!isAuthenticated) return;

    try {
      if (isInitial) setLoading(true);
      const response = await api.get('/api/notifications?limit=10');
      
      if (response.data.success) {
        const fetchedNotifications = response.data.data;
        setNotifications(fetchedNotifications);
        setUnreadCount(response.data.unreadCount || 0);
        setUnreadOrderCount(response.data.unreadOrderCount || 0);

        // Check for new notifications to trigger pop-up
        if (!isInitial && fetchedNotifications.length > 0) {
          const latest = fetchedNotifications[0];
          // If the latest notification is different from what we saw last and it's unread
          if (latest._id !== lastNotificationId && !latest.isRead) {
            setLastNotificationId(latest._id);
            // Only trigger pop-up for important types if needed
            if (latest.type === 'order_placed' || latest.priority === 'high' || latest.priority === 'urgent') {
              setNewNotification(latest);
              // Auto-clear pop-up after 5 seconds
              setTimeout(() => setNewNotification(null), 8000);
            }
          }
        } else if (isInitial && fetchedNotifications.length > 0) {
          setLastNotificationId(fetchedNotifications[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [isAuthenticated, lastNotificationId]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(true);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setUnreadOrderCount(0);
      setLastNotificationId(null);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Polling for new notifications every 15 seconds (Real-time feel)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000); 

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const response = await api.patch(`/api/notifications/${id}/read`);
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await api.patch('/api/notifications/read-all');
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      unreadOrderCount,
      loading,
      newNotification,
      setNewNotification,
      markAsRead,
      markAllAsRead,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

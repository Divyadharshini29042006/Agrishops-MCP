// backend/src/routes/userRoutes.js
import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ============================================
// PROFILE ROUTES
// ============================================

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', protect, changePassword);

// ============================================
// NOTIFICATION ROUTES
// ============================================

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', protect, getNotifications);

// @route   PUT /api/users/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', protect, markAllNotificationsRead);

// @route   PUT /api/users/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', protect, markNotificationRead);

// @route   DELETE /api/users/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/notifications/:id', protect, deleteNotification);

export default router;
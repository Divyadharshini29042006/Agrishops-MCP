// backend/src/routes/adminRoutes.js
import express from 'express';
import { adminLogin } from '../controllers/admin/adminAuthController.js';
import {
  getAllUsers,
  getPendingApprovals,
  approveUser,
  rejectUser,
  updateUserStatus,
  deleteUser,
  getUserStats,
  // ✅ NEW: Brand Logo Functions
  getPendingBrandLogos,
  approveBrandLogo,
  rejectBrandLogo,
  updateBrandDisplay
} from '../controllers/admin/userManagementController.js';
import {
  getAllProducts,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  deleteProduct,
  getProductStats,
  getProductAlerts
} from '../controllers/admin/productModerationController.js';
import {
  getDashboardStats,
  getRecentActivity,
  getSalesAnalytics
} from '../controllers/admin/dashboardController.js';
import { getAllOrders } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Admin login (public)
router.post('/login', adminLogin);

// All routes below require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/activity', getRecentActivity);
router.get('/dashboard/analytics', getSalesAnalytics);
router.get('/orders', getAllOrders);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/pending', getPendingApprovals);
router.get('/users/stats', getUserStats);
router.put('/users/:id/approve', approveUser);
router.put('/users/:id/reject', rejectUser);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// ✅ NEW: Brand Logo Management Routes
router.get('/brands/pending', getPendingBrandLogos);
router.put('/brands/:id/approve', approveBrandLogo);
router.put('/brands/:id/reject', rejectBrandLogo);
router.put('/brands/:id/display', updateBrandDisplay);

// Product moderation routes
router.get('/products', getAllProducts);
router.get('/products/pending', getPendingProducts);
router.get('/products/stats', getProductStats);
router.get('/products/alerts', getProductAlerts);
router.put('/products/:id/approve', approveProduct);
router.put('/products/:id/reject', rejectProduct);
router.delete('/products/:id', deleteProduct);

export default router;
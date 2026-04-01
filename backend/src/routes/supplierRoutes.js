// backend/src/routes/supplierRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  getSupplierOrders,
  getSupplierOrderById,
  updateSupplierOrderStatus,
  getSupplierDashboardStats,
} from '../controllers/supplier/supplierOrderController.js';

const router = express.Router();

// Apply authentication and supplier role check to all routes
router.use(protect);
router.use(authorize('supplier'));

// ========== DASHBOARD ROUTES ==========

// @route   GET /api/supplier/dashboard/stats
// @desc    Get supplier dashboard stats
// @access  Private (Supplier only)
router.get('/dashboard/stats', getSupplierDashboardStats);

// ========== ORDER ROUTES ==========

// @route   GET /api/supplier/orders
// @desc    Get all orders for supplier (where supplier is seller)
// @access  Private (Supplier only)
router.get('/orders', getSupplierOrders);

// @route   GET /api/supplier/orders/:id
// @desc    Get single order details by ID
// @access  Private (Supplier only)
router.get('/orders/:id', getSupplierOrderById);

// @route   PATCH /api/supplier/orders/:id/status
// @desc    Update order status
// @access  Private (Supplier only)
router.patch('/orders/:id/status', updateSupplierOrderStatus);

export default router;
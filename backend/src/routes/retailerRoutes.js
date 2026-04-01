// backend/src/routes/retailerRoutes.js
import express from 'express';
import {
  getRetailerDashboardStats,
  getRetailerInventory,
  updateStock,
  getSupplierProducts,
  purchaseFromSupplier,
  checkExpiryAlerts,
} from '../controllers/retailer/retailerController.js';

import {
  getRetailerOrders,
  getRetailerPurchases, // ⭐ NEW IMPORT
  getOrderDetails,
  updateOrderStatus,
  addOrderNote,
  getOrderStats,
} from '../controllers/retailer/retailerOrderController.js';

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController.js';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ============================================
// DASHBOARD ROUTES
// ============================================

// @route   GET /api/retailer/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Retailer only)
router.get(
  '/dashboard/stats',
  protect,
  authorize('retailer'),
  getRetailerDashboardStats
);

// ============================================
// INVENTORY ROUTES
// ============================================

// @route   GET /api/retailer/inventory
// @desc    Get retailer's inventory
// @access  Private (Retailer only)
router.get(
  '/inventory',
  protect,
  authorize('retailer'),
  getRetailerInventory
);

// @route   PUT /api/retailer/inventory/:id/stock
// @desc    Update product stock
// @access  Private (Retailer only)
router.put(
  '/inventory/:id/stock',
  protect,
  authorize('retailer'),
  updateStock
);

// ============================================
// SUPPLIER PRODUCTS ROUTES (Wholesale Purchase)
// ============================================

// @route   GET /api/retailer/suppliers/products
// @desc    Get products from suppliers (wholesale catalog)
// @access  Private (Retailer only)
router.get(
  '/suppliers/products',
  protect,
  authorize('retailer'),
  getSupplierProducts
);

// @route   POST /api/retailer/purchase-from-supplier
// @desc    Create bulk purchase order from supplier
// @access  Private (Retailer only)
router.post(
  '/purchase-from-supplier',
  protect,
  authorize('retailer'),
  purchaseFromSupplier
);

// ============================================
// ORDER MANAGEMENT ROUTES (Customer Orders)
// ============================================

// @route   GET /api/retailer/orders/stats
// @desc    Get order statistics
// @access  Private (Retailer only)
router.get(
  '/orders/stats',
  protect,
  authorize('retailer'),
  getOrderStats
);

// @route   GET /api/retailer/orders
// @desc    Get all orders from customers (Retailer is SELLER)
// @access  Private (Retailer only)
router.get(
  '/orders',
  protect,
  authorize('retailer'),
  getRetailerOrders
);

// ⭐ NEW ROUTE ⭐
// @route   GET /api/retailer/purchases
// @desc    Get retailer's purchases from suppliers (Retailer is BUYER)
// @access  Private (Retailer only)
router.get(
  '/purchases',
  protect,
  authorize('retailer'),
  getRetailerPurchases
);

// @route   GET /api/retailer/orders/:id
// @desc    Get single order details
// @access  Private (Retailer only)
router.get(
  '/orders/:id',
  protect,
  authorize('retailer'),
  getOrderDetails
);

// @route   PUT /api/retailer/orders/:id/status
// @desc    Update order status (only for orders where retailer is seller)
// @access  Private (Retailer only)
router.put(
  '/orders/:id/status',
  protect,
  authorize('retailer'),
  updateOrderStatus
);

// @route   PUT /api/retailer/orders/:id/note
// @desc    Add note to order
// @access  Private (Retailer only)
router.put(
  '/orders/:id/note',
  protect,
  authorize('retailer'),
  addOrderNote
);

// ============================================
// CART ROUTES
// ============================================

// @route   GET /api/retailer/cart
// @desc    Get user's cart
// @access  Private (Retailer only)
router.get(
  '/cart',
  protect,
  authorize('retailer'),
  getCart
);

// @route   POST /api/retailer/cart
// @desc    Add item to cart
// @access  Private (Retailer only)
router.post(
  '/cart',
  protect,
  authorize('retailer'),
  addToCart
);

// @route   PUT /api/retailer/cart/:id
// @desc    Update cart item quantity
// @access  Private (Retailer only)
router.put(
  '/cart/:id',
  protect,
  authorize('retailer'),
  updateCartItem
);

// @route   DELETE /api/retailer/cart/:id
// @desc    Remove item from cart
// @access  Private (Retailer only)
router.delete(
  '/cart/:id',
  protect,
  authorize('retailer'),
  removeFromCart
);

// @route   DELETE /api/retailer/cart/clear
// @desc    Clear entire cart
// @access  Private (Retailer only)
router.delete(
  '/cart/clear',
  protect,
  authorize('retailer'),
  clearCart
);

// ============================================
// ALERTS & NOTIFICATIONS
// ============================================

// @route   POST /api/retailer/check-expiry-alerts
// @desc    Check for expiring products and create alerts
// @access  Private (Retailer only)
router.post(
  '/check-expiry-alerts',
  protect,
  authorize('retailer'),
  checkExpiryAlerts
);

export default router;
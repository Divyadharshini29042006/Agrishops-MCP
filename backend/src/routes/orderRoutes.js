// backend/src/routes/orderRoutes.js
import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
  cancelOrder
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Customer routes
router.post('/', authorize('customer'), createOrder);
router.get('/my-orders', authorize('customer'), getMyOrders);

// Seller routes
router.get('/received', authorize('retailer', 'supplier'), getSellerOrders);
router.put('/:id/status', authorize('retailer', 'supplier', 'admin'), updateOrderStatus);

// Shared routes (customer can view their order, seller can view their received order)
router.get('/:id', getOrderById);

// Cancel order (customer or admin)
router.delete('/:id', authorize('customer', 'admin'), cancelOrder);

export default router;
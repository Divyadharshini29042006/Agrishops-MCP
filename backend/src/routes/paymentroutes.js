// backend/src/routes/paymentroutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
  getRazorpayKey,
  createRazorpayOrder,
  verifyPayment,
  createCodOrder,
} from '../controllers/paymentController.js';

const router = express.Router();

router.use(protect);

// GET /api/payment/key  — send Razorpay key to frontend
router.get('/key', getRazorpayKey);

// POST /api/payment/create-order  — create Razorpay order
router.post('/create-order', authorize('customer'), createRazorpayOrder);

// POST /api/payment/verify  — verify payment & save DB order
router.post('/verify', authorize('customer'), verifyPayment);

// POST /api/payment/cod  — place COD order
router.post('/cod', authorize('customer'), createCodOrder);

export default router;

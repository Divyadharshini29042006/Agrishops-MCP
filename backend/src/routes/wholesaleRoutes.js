// backend/src/routes/wholesaleRoutes.js
import express from 'express';
import {
  createWholesaleInquiry,
  getMyInquiries,
  getSupplierInquiries,
  respondToInquiry,
  respondToQuote,
  rejectInquiry,
  validateAcceptance,
  completeOrder,
  verifyWholesalePayment,
  compareSuppliers,
} from '../controllers/wholesaleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public/General routes
router.get('/compare/:productId', compareSuppliers); // ✅ NEW: Smart bulk-order comparison

// Customer routes
router.post('/', protect, authorize('customer'), createWholesaleInquiry);
router.get('/my-inquiries', protect, authorize('customer'), getMyInquiries);
router.patch('/:id/respond', protect, authorize('customer'), respondToQuote);
router.get('/:id/validate', protect, authorize('customer'), validateAcceptance); // ✅ NEW
router.post('/:id/complete', protect, authorize('customer'), completeOrder); // ✅ NEW
router.post('/:id/verify-payment', protect, authorize('customer'), verifyWholesalePayment); // ✅ NEW

// Supplier routes
router.get('/supplier-inquiries', protect, authorize('supplier'), getSupplierInquiries);
router.patch('/:id/quote', protect, authorize('supplier'), respondToInquiry);
router.patch('/:id/reject', protect, authorize('supplier'), rejectInquiry); // ✅ NEW

export default router;
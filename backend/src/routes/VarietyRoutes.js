// backend/src/routes/varietyRoutes.js - NEW FILE
import express from 'express';
import {
  getVarieties,
  getVarietyById,
  createVariety,
  approveVariety,
  rejectVariety,
  getPendingVarieties,
} from '../controllers/varietyController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ========== PUBLIC ROUTES ==========
// Get approved varieties by product type (with optional auth for per-supplier filtering)
router.get('/', optionalProtect, getVarieties);

// Get single variety details
router.get('/:id', getVarietyById);

// ========== PROTECTED ROUTES - SUPPLIERS ==========
// Create new variety suggestion
router.post('/', protect, authorize('supplier', 'retailer'), createVariety);

// ========== ADMIN ONLY ROUTES ==========
// Get all pending varieties
router.get('/admin/pending', protect, authorize('admin'), getPendingVarieties);

// Approve variety
router.put('/:id/approve', protect, authorize('admin'), approveVariety);

// Reject variety
router.put('/:id/reject', protect, authorize('admin'), rejectVariety);

export default router;

// backend/src/routes/reviewRoutes.js
import express from 'express';
import {
  createReview,
  getReviewsByTarget,
  getAllReviewsAdmin
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private (Customer only)
 */
router.post('/', protect, authorize('customer'), createReview);

/**
 * @route   GET /api/reviews/target/:targetId
 * @desc    Get all reviews for a specific retailer or supplier
 * @access  Public
 */
router.get('/target/:targetId', getReviewsByTarget);

/**
 * @route   GET /api/reviews/admin/all
 * @desc    Get all reviews for admin dashboard
 * @access  Private (Admin only)
 */
router.get('/admin/all', protect, authorize('admin'), getAllReviewsAdmin);

export default router;

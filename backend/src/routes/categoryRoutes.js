// backend/src/routes/categoryRoutes.js - UPDATED WITH HIERARCHICAL ROUTES
import express from 'express';
import {
  getCategories,
  getCategoryTree,
  getSubcategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ✅ Public routes
router.get('/', getCategories); // Supports ?level=main&parent=xxxxx
router.get('/tree', getCategoryTree); // Get full hierarchical tree
router.get('/subcategories/:parentId', getSubcategories); // Get children of a category
router.get('/:id', getCategoryById); // Get single category with children

// ✅ Admin only routes
router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
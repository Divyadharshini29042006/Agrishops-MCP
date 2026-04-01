// backend/src/routes/productRoutes.js - FINAL FIXED VERSION
import express from 'express';
import {
  getProducts,
  getProductById,
  getProductDetails,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getSeasonalProducts,
  searchProducts,
  compareProducts,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { uploadMultiple } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ========== CRITICAL FIX: ROUTE ORDER MATTERS! ==========
// Express matches routes in order. Dynamic routes like /:id will catch EVERYTHING
// So we MUST put specific routes FIRST, before any dynamic routes

// ========== 1. PUBLIC ROUTES (Specific paths) ==========
router.get('/seasonal', getSeasonalProducts);
router.get('/search', searchProducts);

// ========== 2. PROTECTED ROUTES - Sellers (Specific paths) ==========
// ✅ CRITICAL: /my/products MUST come BEFORE /:id
router.get('/my/products', protect, authorize('retailer', 'supplier'), getMyProducts);

// Create new product
router.post('/', protect, authorize('retailer', 'supplier'), uploadMultiple, createProduct);

// ========== 3. DYNAMIC ROUTES (MUST be LAST!) ==========
// ⚠️ WARNING: /:id will match ANY string, so put it AFTER all specific routes
router.get('/:id/details', getProductDetails);
router.get('/:id/compare', compareProducts);
router.get('/:id', getProductById);
router.put('/:id', protect, authorize('retailer', 'supplier'), uploadMultiple, updateProduct);
router.delete('/:id', protect, authorize('retailer', 'supplier'), deleteProduct);

// ========== 4. GENERAL QUERY ROUTE (with filters) ==========
router.get('/', getProducts);

export default router;
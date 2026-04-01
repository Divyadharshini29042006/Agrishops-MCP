// backend/src/routes/brandRoutes.js
import express from 'express';
import {
  uploadBrandLogo,
  getMyBrandLogo,
  deleteBrandLogo
} from '../controllers/brandController.js';
import { getHomepageBrands } from '../controllers/admin/userManagementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { uploadSingle, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ✅ PUBLIC: Get brands for homepage
router.get('/homepage', getHomepageBrands);

// ✅ PROTECTED: Supplier and Retailer routes
router.post('/upload', protect, authorize('supplier', 'retailer'), uploadSingle, handleUploadError, uploadBrandLogo);
router.get('/my-logo', protect, authorize('supplier', 'retailer'), getMyBrandLogo);
router.delete('/my-logo', protect, authorize('supplier', 'retailer'), deleteBrandLogo);

export default router;
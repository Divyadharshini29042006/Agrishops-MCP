// backend/src/routes/chatbotRoutes.js
import express from 'express';
import {
  handleMessage,
  getRecommendations,
  getChatHistory,
  getSupportedLanguages,
} from '../controllers/chatbotController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (with optional auth for message)
router.post('/message', optionalAuth, handleMessage);
router.post('/query', optionalAuth, handleMessage); // Compatibility fallback
router.post('/recommendations', getRecommendations);
router.get('/languages', getSupportedLanguages);

// Protected routes
router.get('/history', protect, getChatHistory);

export default router;
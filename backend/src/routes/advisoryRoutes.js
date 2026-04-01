// backend/src/routes/advisoryRoutes.js
import express from 'express';
import {
  getSeasonalRecommendations,
  getRecommendationsByCrop,
  getSafetyGuidelines
} from '../controllers/advisoryController.js';

const router = express.Router();

// All advisory routes are public

// Get seasonal recommendations
router.get('/seasonal', getSeasonalRecommendations);

// Get recommendations by crop
router.post('/by-crop', getRecommendationsByCrop);

// Get safety guidelines for a product
router.get('/safety/:productId', getSafetyGuidelines);

export default router;
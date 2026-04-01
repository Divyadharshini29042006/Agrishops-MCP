// backend/src/routes/translationRoutes.js
import express from 'express';
import * as translationController from '../controllers/translationController.js';

const router = express.Router();

/**
 * @route   POST /api/translate
 * @desc    Translate single text
 * @access  Public
 * @body    { text, targetLanguage, sourceLanguage? }
 */
router.post('/', translationController.translate);

/**
 * @route   POST /api/translate/batch
 * @desc    Translate multiple texts in batch
 * @access  Public
 * @body    { texts: [], targetLanguage, sourceLanguage? }
 */
router.post('/batch', translationController.translateBatch);

/**
 * @route   POST /api/translate/detect
 * @desc    Detect language of text
 * @access  Public
 * @body    { text }
 */
router.post('/detect', translationController.detect);

/**
 * @route   GET /api/translate/languages
 * @desc    Get list of supported languages
 * @access  Public
 */
router.get('/languages', translationController.getSupportedLanguages);

export default router;

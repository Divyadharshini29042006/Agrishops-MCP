// backend/src/controllers/translationController.js
import * as translationService from '../services/translationService.js';

/**
 * Translate single text
 * POST /api/translate
 * Body: { text, targetLanguage, sourceLanguage? }
 */
export async function translate(req, res) {
    try {
        const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

        // Validate required fields
        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }

        if (!targetLanguage) {
            return res.status(400).json({
                success: false,
                message: 'Target language is required'
            });
        }

        // Perform translation
        const result = await translationService.translateText(
            text,
            targetLanguage,
            sourceLanguage
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Translation controller error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Translation failed',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

/**
 * Translate multiple texts in batch
 * POST /api/translate/batch
 * Body: { texts: [], targetLanguage, sourceLanguage? }
 */
export async function translateBatch(req, res) {
    try {
        const { texts, targetLanguage, sourceLanguage = 'en' } = req.body;

        // Validate required fields
        if (!texts || !Array.isArray(texts)) {
            return res.status(400).json({
                success: false,
                message: 'Texts must be an array'
            });
        }

        if (texts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Texts array cannot be empty'
            });
        }

        if (texts.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 50 texts allowed per batch'
            });
        }

        if (!targetLanguage) {
            return res.status(400).json({
                success: false,
                message: 'Target language is required'
            });
        }

        // Perform batch translation
        const results = await translationService.translateBatch(
            texts,
            targetLanguage,
            sourceLanguage
        );

        res.json({
            success: true,
            data: {
                translations: results,
                count: results.length
            }
        });
    } catch (error) {
        console.error('Batch translation controller error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Batch translation failed',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

/**
 * Detect language of text
 * POST /api/translate/detect
 * Body: { text }
 */
export async function detect(req, res) {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Text is required'
            });
        }

        const result = await translationService.detectLanguage(text);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Language detection controller error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Language detection failed',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

/**
 * Get supported languages
 * GET /api/translate/languages
 */
export function getSupportedLanguages(req, res) {
    try {
        const languages = translationService.getSupportedLanguages();

        res.json({
            success: true,
            data: {
                languages,
                count: languages.length
            }
        });
    } catch (error) {
        console.error('Get languages controller error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get languages',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

export default {
    translate,
    translateBatch,
    detect,
    getSupportedLanguages
};

// frontend/src/services/translationService.js
import api from './api';

/**
 * Translation Service - Frontend
 * Handles API calls to backend translation service with caching
 */

const CACHE_PREFIX = 'translation_';
const CACHE_EXPIRY_DAYS = 7;
const CACHE_EXPIRY_MS = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// Debounce timer
let debounceTimer = null;
const DEBOUNCE_DELAY = 300;

/**
 * Generate hash for text (simple hash function)
 */
function hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Generate cache key
 */
function getCacheKey(text, targetLanguage) {
    const hash = hashText(text);
    return `${CACHE_PREFIX}${targetLanguage}_${hash}`;
}

/**
 * Get translation from cache
 */
function getFromCache(text, targetLanguage) {
    try {
        const cacheKey = getCacheKey(text, targetLanguage);
        const cached = localStorage.getItem(cacheKey);

        if (!cached) return null;

        const data = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is expired
        if (now - data.timestamp > CACHE_EXPIRY_MS) {
            localStorage.removeItem(cacheKey);
            return null;
        }

        return data.translation;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
}

/**
 * Save translation to cache
 */
function saveToCache(text, targetLanguage, translation) {
    try {
        const cacheKey = getCacheKey(text, targetLanguage);
        const data = {
            text,
            translation,
            language: targetLanguage,
            timestamp: Date.now()
        };

        localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
        console.error('Cache write error:', error);
        // If localStorage is full, clear old entries
        if (error.name === 'QuotaExceededError') {
            clearExpiredCache();
            // Try again
            try {
                const cacheKey = getCacheKey(text, targetLanguage);
                const data = {
                    text,
                    translation,
                    language: targetLanguage,
                    timestamp: Date.now()
                };
                localStorage.setItem(cacheKey, JSON.stringify(data));
            } catch (retryError) {
                console.error('Cache write retry failed:', retryError);
            }
        }
    }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache() {
    try {
        const now = Date.now();
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (now - data.timestamp > CACHE_EXPIRY_MS) {
                        keysToRemove.push(key);
                    }
                } catch (error) {
                    // Invalid data, remove it
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared ${keysToRemove.length} expired cache entries`);
    } catch (error) {
        console.error('Cache cleanup error:', error);
    }
}

/**
 * Clear all translation cache
 */
export function clearAllCache() {
    try {
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared all ${keysToRemove.length} translation cache entries`);
    } catch (error) {
        console.error('Cache clear error:', error);
    }
}

/**
 * Translation Request Queue for batching
 */
const translationQueue = [];
let translationTimer = null;
const BATCH_WINDOW = 50; // 50ms window for batching

/**
 * Process the translation queue
 */
async function processTranslationQueue() {
    const queue = [...translationQueue];
    translationQueue.length = 0;
    translationTimer = null;

    if (queue.length === 0) return;

    // Group by target language
    const groups = queue.reduce((acc, item) => {
        const key = `${item.targetLanguage}_${item.sourceLanguage}`;
        if (!acc[key]) acc[key] = {
            texts: [],
            promises: [],
            target: item.targetLanguage,
            source: item.sourceLanguage
        };
        acc[key].texts.push(item.text);
        acc[key].promises.push(item);
        return acc;
    }, {});

    // Process each group
    for (const key in groups) {
        const { texts, promises, target, source } = groups[key];

        try {
            // Use existing translateBatch which handles caching and API calls
            const results = await translateBatch(texts, target, source);

            // Resolve all promises
            promises.forEach((p, idx) => {
                p.resolve(results[idx]);
            });
        } catch (error) {
            console.error('Queue processing error:', error);
            // Fallback to original text for all in case of error
            promises.forEach(p => p.resolve(p.text));
        }
    }
}

/**
 * Translate single text (Now with batching!)
 */
export async function translateText(text, targetLanguage, sourceLanguage = 'en') {
    try {
        // Return original if same language or no text
        if (!text || sourceLanguage === targetLanguage) {
            return text;
        }

        // Check cache first (Synchronous)
        const cached = getFromCache(text, targetLanguage);
        if (cached) {
            return cached;
        }

        // Add to queue and return promise
        return new Promise((resolve) => {
            translationQueue.push({
                text,
                targetLanguage,
                sourceLanguage,
                resolve
            });

            // Start timer if not already running
            if (!translationTimer) {
                translationTimer = setTimeout(processTranslationQueue, BATCH_WINDOW);
            }
        });
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
}

/**
 * Translate multiple texts in batch
 */
export async function translateBatch(texts, targetLanguage, sourceLanguage = 'en') {
    try {
        // Return original if same language
        if (sourceLanguage === targetLanguage) {
            return texts;
        }

        // Check cache for each text
        const results = [];
        const textsToTranslate = [];
        const indices = [];

        for (let i = 0; i < texts.length; i++) {
            const text = texts[i];
            const cached = getFromCache(text, targetLanguage);

            if (cached) {
                results[i] = cached;
            } else {
                textsToTranslate.push(text);
                indices.push(i);
            }
        }

        // If all cached, return immediately
        if (textsToTranslate.length === 0) {
            return results;
        }

        // Call API for uncached texts
        const response = await api.post('/translate/batch', {
            texts: textsToTranslate,
            targetLanguage,
            sourceLanguage
        });

        if (response.data.success) {
            const translations = response.data.data.translations;

            // Save to cache and fill results
            translations.forEach((item, idx) => {
                const translation = item.translatedText;
                const originalIndex = indices[idx];

                results[originalIndex] = translation;
                saveToCache(item.originalText, targetLanguage, translation);
            });

            return results;
        } else {
            throw new Error(response.data.message || 'Batch translation failed');
        }
    } catch (error) {
        console.error('Batch translation error:', error);
        // Return original texts on error
        return texts;
    }
}

/**
 * Translate with debounce
 */
export function translateDebounced(text, targetLanguage, sourceLanguage = 'en', callback) {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
        const translation = await translateText(text, targetLanguage, sourceLanguage);
        if (callback) {
            callback(translation);
        }
    }, DEBOUNCE_DELAY);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    try {
        let count = 0;
        let size = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                count++;
                const value = localStorage.getItem(key);
                size += key.length + (value ? value.length : 0);
            }
        }

        return {
            count,
            sizeKB: (size / 1024).toFixed(2)
        };
    } catch (error) {
        console.error('Cache stats error:', error);
        return { count: 0, sizeKB: 0 };
    }
}

// Clean up expired cache on load
clearExpiredCache();

export default {
    translateText,
    translateBatch,
    translateDebounced,
    clearExpiredCache,
    clearAllCache,
    getCacheStats
};

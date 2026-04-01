// backend/src/services/translationService.js
import https from 'https';
import http from 'http';

/**
 * Translation Service using MyMemory Translation API
 * Free translation API - no API key required (up to 1000 words/day)
 * Alternative to LibreTranslate which now requires API key
 */

const TRANSLATION_API_URL = process.env.TRANSLATION_API_URL || 'https://api.mymemory.translated.net/get';
const TRANSLATION_TIMEOUT = parseInt(process.env.TRANSLATION_TIMEOUT) || 10000;
const MAX_RETRIES = parseInt(process.env.TRANSLATION_MAX_RETRIES) || 3;

// Supported language codes
const SUPPORTED_LANGUAGES = ['en', 'hi', 'ml', 'ta', 'te'];

// Language code mapping for MyMemory API
const LANGUAGE_MAP = {
  'en': 'en-US',
  'hi': 'hi-IN',
  'ml': 'ml-IN',
  'ta': 'ta-IN',
  'te': 'te-IN'
};

/**
 * Validate language code
 */
function isValidLanguage(langCode) {
  return SUPPORTED_LANGUAGES.includes(langCode);
}

/**
 * Make HTTP/HTTPS request to Translation API
 */
function makeRequest(url, attempt = 1) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'AgriShop-Translation-Service/1.0'
      },
      timeout: TRANSLATION_TIMEOUT
    };

    const req = protocol.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } else if (res.statusCode === 429 && attempt < MAX_RETRIES) {
            // Rate limited - retry with exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
            setTimeout(() => {
              makeRequest(url, attempt + 1).then(resolve).catch(reject);
            }, delay);
          } else {
            reject(new Error(`Translation API error: ${res.statusCode} - ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse translation response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          makeRequest(url, attempt + 1).then(resolve).catch(reject);
        }, delay);
      } else {
        reject(new Error(`Translation request failed: ${error.message}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Request timeout, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        setTimeout(() => {
          makeRequest(url, attempt + 1).then(resolve).catch(reject);
        }, delay);
      } else {
        reject(new Error('Translation request timeout'));
      }
    });

    req.end();
  });
}

/**
 * Translate single text using MyMemory API
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (en, hi, ml, ta, te)
 * @param {string} sourceLanguage - Source language code (default: 'en')
 * @returns {Promise<Object>} Translation result
 */
export async function translateText(text, targetLanguage, sourceLanguage = 'en') {
  try {
    // Validate inputs
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    if (!isValidLanguage(targetLanguage)) {
      throw new Error(`Unsupported target language: ${targetLanguage}`);
    }

    if (!isValidLanguage(sourceLanguage)) {
      throw new Error(`Unsupported source language: ${sourceLanguage}`);
    }

    // If source and target are the same, return original text
    if (sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        cached: false
      };
    }

    // Build API URL
    const sourceLang = LANGUAGE_MAP[sourceLanguage];
    const targetLang = LANGUAGE_MAP[targetLanguage];
    const encodedText = encodeURIComponent(text);
    const apiUrl = `${TRANSLATION_API_URL}?q=${encodedText}&langpair=${sourceLang}|${targetLang}`;

    // Make API request
    const response = await makeRequest(apiUrl);

    // Check response
    if (response.responseStatus === 200 || response.responseData) {
      return {
        translatedText: response.responseData.translatedText,
        sourceLanguage,
        targetLanguage,
        cached: false,
        match: response.responseData.match || 0
      };
    } else {
      throw new Error(response.responseDetails || 'Translation failed');
    }
  } catch (error) {
    console.error('Translation error:', error.message);
    throw error;
  }
}

// In-memory cache to prevent repeated API calls for the same text
const translationCache = new Map();

/**
 * Translate multiple texts in batch
 * @param {Array<string>} texts - Array of texts to translate
 * @param {string} targetLanguage - Target language code
 * @param {string} sourceLanguage - Source language code (default: 'en')
 * @returns {Promise<Array<Object>>} Array of translation results
 */
export async function translateBatch(texts, targetLanguage, sourceLanguage = 'en') {
  try {
    // Validate inputs
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    if (!isValidLanguage(targetLanguage)) {
      throw new Error(`Unsupported target language: ${targetLanguage}`);
    }

    if (!isValidLanguage(sourceLanguage)) {
      throw new Error(`Unsupported source language: ${sourceLanguage}`);
    }

    // If source and target are the same, return original texts
    if (sourceLanguage === targetLanguage) {
      return texts.map(text => ({
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        cached: false
      }));
    }

    // Process translations in parallel with concurrency control
    // We use a small delay between chunks if needed, but for now let's go parallel
    const translationPromises = texts.map(async (text) => {
      // Check in-memory cache first
      const cacheKey = `${sourceLanguage}_${targetLanguage}_${text}`;
      if (translationCache.has(cacheKey)) {
        return {
          originalText: text,
          translatedText: translationCache.get(cacheKey),
          sourceLanguage,
          targetLanguage,
          cached: true
        };
      }

      try {
        const result = await translateText(text, targetLanguage, sourceLanguage);

        // Save to in-memory cache
        translationCache.set(cacheKey, result.translatedText);

        return {
          originalText: text,
          ...result
        };
      } catch (error) {
        console.error(`Failed to translate "${text}":`, error.message);
        return {
          originalText: text,
          translatedText: text, // Fallback to original
          sourceLanguage,
          targetLanguage,
          error: error.message,
          cached: false
        };
      }
    });

    const results = await Promise.all(translationPromises);
    return results;
  } catch (error) {
    console.error('Batch translation error:', error.message);
    throw error;
  }
}

/**
 * Detect language of text
 * Note: MyMemory doesn't have language detection, so we return a simple heuristic
 */
export async function detectLanguage(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    // Simple heuristic: check for Devanagari script (Hindi)
    const devanagariRegex = /[\u0900-\u097F]/;
    // Tamil script
    const tamilRegex = /[\u0B80-\u0BFF]/;
    // Telugu script
    const teluguRegex = /[\u0C00-\u0C7F]/;
    // Malayalam script
    const malayalamRegex = /[\u0D00-\u0D7F]/;

    if (devanagariRegex.test(text)) {
      return { language: 'hi', confidence: 0.8 };
    } else if (tamilRegex.test(text)) {
      return { language: 'ta', confidence: 0.8 };
    } else if (teluguRegex.test(text)) {
      return { language: 'te', confidence: 0.8 };
    } else if (malayalamRegex.test(text)) {
      return { language: 'ml', confidence: 0.8 };
    } else {
      return { language: 'en', confidence: 0.6 };
    }
  } catch (error) {
    console.error('Language detection error:', error.message);
    return {
      language: 'en',
      confidence: 0,
      error: error.message
    };
  }
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES.map(code => ({
    code,
    name: getLanguageName(code)
  }));
}

/**
 * Get language name from code
 */
function getLanguageName(code) {
  const names = {
    'en': 'English',
    'hi': 'Hindi',
    'ml': 'Malayalam',
    'ta': 'Tamil',
    'te': 'Telugu'
  };
  return names[code] || code;
}

export default {
  translateText,
  translateBatch,
  detectLanguage,
  getSupportedLanguages
};

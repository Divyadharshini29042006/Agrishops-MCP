// frontend/src/context/LanguageContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import * as translationService from '../services/translationService';

// Import all translation files
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';
import ml from '../locales/ml.json';
import hi from '../locales/hi.json';

const LanguageContext = createContext(undefined);

const translations = { en, ta, te, ml, hi };

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
];

export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);

  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const changeLanguage = useCallback((langCode) => {
    if (translations[langCode]) {
      setCurrentLanguage(langCode);
      setTranslationError(null);
    }
  }, []);

  /**
   * Get value from nested object using dot notation
   * e.g., "common.welcome" => translations.en.common.welcome
   */
  const getNestedValue = useCallback((obj, path) => {
    const keys = path.split('.');
    let value = obj;

    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }

    return value;
  }, []);

  /**
   * Main translation function using static JSON files
   * This is the primary method for translating UI text
   */
  const t = useCallback((key) => {
    let value = getNestedValue(translations[currentLanguage], key);

    // Fallback to English if translation not found
    if (!value) {
      value = getNestedValue(translations.en, key);
    }

    return value || key;
  }, [currentLanguage, getNestedValue]);

  /**
   * API-based translation for dynamic content
   * Use this for user-generated content or dynamic text
   */
  const translate = useCallback(async (text, targetLang = null) => {
    const target = targetLang || currentLanguage;

    // If target is English, return as-is
    if (target === 'en') {
      return text;
    }

    try {
      const translated = await translationService.translateText(text, target, 'en');
      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslationError(error.message);
      return text; // Return original on error
    }
  }, [currentLanguage]);

  /**
   * Batch translation function for dynamic content
   * Translates multiple texts at once for better performance
   */
  const translateBatch = useCallback(async (texts, targetLang = null) => {
    const target = targetLang || currentLanguage;

    // If target is English, return as-is
    if (target === 'en') {
      return texts;
    }

    try {
      setIsTranslating(true);
      const translated = await translationService.translateBatch(texts, target, 'en');
      setIsTranslating(false);
      return translated;
    } catch (error) {
      console.error('Batch translation failed:', error);
      setTranslationError(error.message);
      setIsTranslating(false);
      return texts; // Return originals on error
    }
  }, [currentLanguage]);

  /**
   * Translate raw text (for dynamic content only)
   * Use this when you have user-generated or dynamic content
   */
  const translateRaw = useCallback(async (text) => {
    if (currentLanguage === 'en') {
      return text;
    }

    return await translate(text);
  }, [currentLanguage, translate]);

  /**
   * Clear translation cache
   */
  const clearCache = useCallback(() => {
    translationService.clearAllCache();
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return translationService.getCacheStats();
  }, []);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      t,
      translate,
      translateRaw,
      translateBatch,
      languages,
      availableLanguages: languages,
      isTranslating,
      translationError,
      clearCache,
      getCacheStats
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export { LanguageContext };
// frontend/src/hooks/useTranslate.js
import { useState, useEffect } from 'react';
import { useLanguage } from './useLanguage';

/**
 * Hook to translate dynamic text (like database content)
 * @param {string} text - Text to translate
 * @returns {string} - Translated text
 */
export function useTranslate(text) {
    const { currentLanguage, translateRaw } = useLanguage();
    const [translated, setTranslated] = useState(text);

    useEffect(() => {
        // If English, return original
        if (currentLanguage === 'en' || !text) {
            setTranslated(text);
            return;
        }

        // Translate async
        let cancelled = false;

        translateRaw(text).then(result => {
            if (!cancelled) {
                setTranslated(result);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [text, currentLanguage, translateRaw]);

    return translated;
}

/**
 * Hook to translate array of texts
 * @param {Array<string>} texts - Array of texts to translate
 * @returns {Array<string>} - Array of translated texts
 */
export function useTranslateArray(texts) {
    const { currentLanguage, translateBatch } = useLanguage();
    const [translated, setTranslated] = useState(texts);

    useEffect(() => {
        // If English or empty, return original
        if (currentLanguage === 'en' || !texts || texts.length === 0) {
            setTranslated(texts);
            return;
        }

        // Translate async
        let cancelled = false;

        translateBatch(texts).then(results => {
            if (!cancelled) {
                setTranslated(results);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [texts, currentLanguage, translateBatch]);

    return translated;
}

export default useTranslate;

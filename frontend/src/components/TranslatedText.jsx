// frontend/src/components/TranslatedText.jsx
import { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';

/**
 * Component that automatically translates text based on current language
 * Use this for dynamic content from database
 */
const TranslatedText = ({ text, className = '', as: Component = 'span' }) => {
    const { currentLanguage, translateRaw } = useLanguage();
    const [translated, setTranslated] = useState(text);
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        // If English or no text, show original
        if (currentLanguage === 'en' || !text) {
            setTranslated(text);
            return;
        }

        // Translate
        setIsTranslating(true);
        let cancelled = false;

        translateRaw(text)
            .then(result => {
                if (!cancelled) {
                    setTranslated(result);
                    setIsTranslating(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setTranslated(text); // Fallback to original
                    setIsTranslating(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [text, currentLanguage, translateRaw]);

    return <Component className={className}>{translated}</Component>;
};

export default TranslatedText;

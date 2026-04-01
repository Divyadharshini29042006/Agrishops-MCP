// frontend/src/components/common/LanguageSwitcher.jsx
import { useState, useRef, useEffect } from 'react';
import { FiGlobe, FiCheck, FiLoader } from 'react-icons/fi';
import { useLanguage } from '../../hooks/useLanguage';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage, languages, isTranslating } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        disabled={isTranslating}
      >
        {isTranslating ? (
          <FiLoader className="text-xl text-gray-700 animate-spin" />
        ) : (
          <FiGlobe className="text-xl text-gray-700" />
        )}
        <span className="hidden md:inline text-sm font-medium text-gray-700">
          {currentLang?.name}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2 hover:bg-green-50 transition-colors ${currentLanguage === lang.code ? 'bg-green-50' : ''
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className={`text-sm ${currentLanguage === lang.code ? 'font-semibold text-green-600' : 'text-gray-700'
                  }`}>
                  {lang.name}
                </span>
              </div>
              {currentLanguage === lang.code && (
                <FiCheck className="text-green-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
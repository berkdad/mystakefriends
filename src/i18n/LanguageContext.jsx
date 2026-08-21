import React, { createContext, useContext } from 'react';
import { tr } from './translations';

// Provides { language, changeLanguage } from the App root.
export const LanguageContext = createContext({
  language: 'en',
  changeLanguage: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

// Small EN | ES pill toggle. The active language is filled, the other tap-able.
export function LanguageToggle({ className = '' }) {
  const { language, changeLanguage } = useLanguage();
  const btn = (code, label) => (
    <button
      onClick={() => changeLanguage(code)}
      className={`px-3 py-1 text-sm rounded-full transition-colors ${
        language === code
          ? 'bg-primary-500 text-white font-medium'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      aria-pressed={language === code}
    >
      {label}
    </button>
  );
  return (
    <div
      className={`inline-flex items-center gap-1 border border-gray-200 rounded-full p-1 bg-white ${className}`}
      title={tr('Language')}
    >
      {btn('en', 'English')}
      {btn('es', 'Español')}
    </div>
  );
}

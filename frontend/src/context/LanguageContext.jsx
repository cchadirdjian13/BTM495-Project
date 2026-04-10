import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { authAPI } from '../api/api';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Load initial language from localStorage or default to 'en'
  const savedLang = localStorage.getItem('app_language');
  const [language, setLanguage] = useState(savedLang || 'en');

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'fr' : 'en';
      localStorage.setItem('app_language', next);
      authAPI.updateLanguage(next).catch(() => {}); // Sync if logged in
      return next;
    });
  }, []);

  const setLang = useCallback((lang) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    authAPI.updateLanguage(lang).catch(() => {}); // Sync if logged in
  }, []);

  // Translation function
  const t = useCallback((key) => {
    if (!translations[language]) return key;
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

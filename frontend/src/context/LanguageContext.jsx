import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import i18n, { getStoredLanguage, setAppLanguage } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getStoredLanguage);

  useEffect(() => {
    const onChange = (lng) => setLanguage(lng === 'ps' ? 'ps' : 'en');
    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, []);

  const changeLanguage = useCallback((lang) => {
    setAppLanguage(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isRtl: language === 'ps' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

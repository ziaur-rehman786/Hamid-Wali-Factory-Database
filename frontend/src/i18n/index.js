import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ps from './locales/ps.json';

const STORAGE_KEY = 'hw_factory_lang';

export function getStoredLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'ps' ? 'ps' : 'en';
}

export function applyDocumentLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ps' ? 'rtl' : 'ltr';
}

const initialLang = typeof window !== 'undefined' ? getStoredLanguage() : 'en';
if (typeof window !== 'undefined') applyDocumentLanguage(initialLang);

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ps: { translation: ps } },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setAppLanguage(lang) {
  const next = lang === 'ps' ? 'ps' : 'en';
  localStorage.setItem(STORAGE_KEY, next);
  i18n.changeLanguage(next);
  applyDocumentLanguage(next);
  return next;
}

export default i18n;

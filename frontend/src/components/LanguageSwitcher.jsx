import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className="flex items-center rounded-lg border border-gold-500/30 overflow-hidden shrink-0" role="group" aria-label={t('language.label')}>
      <button
        type="button"
        onClick={() => changeLanguage('en')}
        className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
          language === 'en' ? 'bg-gold-500 text-primary-900' : 'text-gold-300 hover:bg-primary-800'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => changeLanguage('ps')}
        className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
          language === 'ps' ? 'bg-gold-500 text-primary-900' : 'text-gold-300 hover:bg-primary-800'
        }`}
      >
        پښتو
      </button>
    </div>
  );
}

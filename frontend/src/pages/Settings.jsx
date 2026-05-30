import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../services/api';
import { translateApiMessage } from '../utils/translateApi';
import FactoryLogo, { getLogoUrl } from '../components/FactoryLogo';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Settings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    factory_name: '',
    factory_phone: '',
    factory_email: '',
    factory_address: '',
    factory_logo: '',
    pairs_per_carton: '8',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSettings().then((res) => setSettings((s) => ({ ...s, ...res.data })));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(settings);
      toast.success(t('settings.saved'));
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('settings.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <div className="card space-y-3">
        <h2 className="font-semibold text-lg">{t('language.label')}</h2>
        <p className="text-sm text-gray-500">{t('language.headerHint')}</p>
        <LanguageSwitcher />
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('settings.currency')}</label>
          <input className="input-field bg-gray-100 dark:bg-slate-700" value={t('settings.afn')} readOnly />
          <p className="text-xs text-gray-400 mt-1">{t('settings.afnHint')}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('settings.pairsPerCarton')}</label>
          <input
            type="number"
            min="1"
            className="input-field max-w-xs"
            value={settings.pairs_per_carton || '8'}
            onChange={(e) => setSettings({ ...settings, pairs_per_carton: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">{t('settings.pairsPerCartonHint')}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('settings.factoryName')}</label>
          <input className="input-field" value={settings.factory_name} onChange={(e) => setSettings({ ...settings, factory_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('settings.phoneNumbers')}</label>
          <input className="input-field" value={settings.factory_phone} onChange={(e) => setSettings({ ...settings, factory_phone: e.target.value })} placeholder={t('settings.phonePlaceholder')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('common.email')}</label>
          <input
            type="email"
            className="input-field"
            value={settings.factory_email || ''}
            onChange={(e) => setSettings({ ...settings, factory_email: e.target.value })}
            placeholder={t('settings.emailPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('common.address')}</label>
          <textarea className="input-field" rows={3} value={settings.factory_address} onChange={(e) => setSettings({ ...settings, factory_address: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('settings.factoryLogo')}</label>
          <div className="flex items-center gap-4 mb-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <FactoryLogo src={getLogoUrl(settings)} size="lg" />
            <p className="text-sm text-gray-500">
              {t('settings.defaultLogo')}
            </p>
          </div>
          <input
            className="input-field"
            value={settings.factory_logo || '/logo.png'}
            onChange={(e) => setSettings({ ...settings, factory_logo: e.target.value })}
            placeholder={t('settings.logoPlaceholder')}
          />
          <p className="text-xs text-gray-400 mt-1">{t('settings.logoHint')}</p>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? t('common.saving') : t('settings.saveSettings')}
        </button>
      </form>
    </div>
  );
}

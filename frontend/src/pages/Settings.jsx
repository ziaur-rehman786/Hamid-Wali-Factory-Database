import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../services/api';
import FactoryLogo, { getLogoUrl } from '../components/FactoryLogo';

export default function Settings() {
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
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Factory Settings</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <input className="input-field bg-gray-100 dark:bg-slate-700" value="AFN (Afghan Afghani)" readOnly />
          <p className="text-xs text-gray-400 mt-1">All amounts in the system are stored and displayed in AFN</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pairs per Carton</label>
          <input
            type="number"
            min="1"
            className="input-field max-w-xs"
            value={settings.pairs_per_carton || '8'}
            onChange={(e) => setSettings({ ...settings, pairs_per_carton: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">Used when invoicing by cartons (default: 8 pairs per carton)</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Factory Name</label>
          <input className="input-field" value={settings.factory_name} onChange={(e) => setSettings({ ...settings, factory_name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone Numbers</label>
          <input className="input-field" value={settings.factory_phone} onChange={(e) => setSettings({ ...settings, factory_phone: e.target.value })} placeholder="+93-700-000000" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="input-field"
            value={settings.factory_email || ''}
            onChange={(e) => setSettings({ ...settings, factory_email: e.target.value })}
            placeholder="factory@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea className="input-field" rows={3} value={settings.factory_address} onChange={(e) => setSettings({ ...settings, factory_address: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Factory Logo</label>
          <div className="flex items-center gap-4 mb-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <FactoryLogo src={getLogoUrl(settings)} size="lg" />
            <p className="text-sm text-gray-500">
              Default logo: <code>/logo.png</code> (Hamid Wali Shoe Factory)
            </p>
          </div>
          <input
            className="input-field"
            value={settings.factory_logo || '/logo.png'}
            onChange={(e) => setSettings({ ...settings, factory_logo: e.target.value })}
            placeholder="/logo.png"
          />
          <p className="text-xs text-gray-400 mt-1">Change only if you upload a different logo to the server</p>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

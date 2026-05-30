import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { translateApiMessage } from '../utils/translateApi';
import FactoryLogo from '../components/FactoryLogo';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Login() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      toast.success(t('auth.welcomeBack'));
      navigate('/');
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('auth.loginFailed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 p-4 relative overflow-hidden">
      <div className="absolute top-4 end-4 z-20">
        <LanguageSwitcher />
      </div>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,#D4AF37_0%,transparent_50%)]" />
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_70%_80%,#D4AF37_0%,transparent_40%)]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 p-3 bg-white rounded-full shadow-gold w-fit ring-4 ring-gold-400/60">
            <FactoryLogo size="xl" className="w-28 h-28" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('app.factoryName')}</h1>
          <p className="text-gold-400 mt-2 font-medium">{t('app.tagline')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card border-gold-200/60 shadow-navy">
          <h2 className="text-xl font-semibold mb-6 text-primary-800 dark:text-gold-400">{t('auth.signIn')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary-800 dark:text-gray-200">{t('auth.username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-primary-800 dark:text-gray-200">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? t('common.signingIn') : t('auth.signIn')}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            {t('auth.hint')}
          </p>
        </form>
      </div>
    </div>
  );
}

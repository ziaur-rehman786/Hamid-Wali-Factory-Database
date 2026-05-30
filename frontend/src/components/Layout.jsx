import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Package, FileText, Users, BookOpen, BarChart3,
  Settings, LogOut, Menu, Moon, Sun, Database, Palette, Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FactoryLogo from './FactoryLogo';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/inventory', icon: Package, labelKey: 'nav.inventory' },
  { to: '/invoices', icon: FileText, labelKey: 'nav.invoices' },
  { to: '/invoices/new', icon: FileText, labelKey: 'nav.newInvoice' },
  { to: '/customers', icon: Users, labelKey: 'nav.customers' },
  { to: '/roznamcha', icon: BookOpen, labelKey: 'nav.roznamcha' },
  { to: '/salary', icon: Wallet, labelKey: 'nav.salary' },
  { to: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { to: '/master-data', icon: Palette, labelKey: 'nav.masterData' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const filteredNav = navItems.filter((item) => {
    if (item.to === '/settings' && !isAdmin) return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = user?.role === 'admin' ? t('roles.admin') : t('roles.staff');

  return (
    <div className="min-h-screen flex flex-col">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden top-[5.5rem]" onClick={() => setSidebarOpen(false)} />
      )}

      <header className="sticky top-0 z-50 shrink-0 flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 min-h-[5.5rem] bg-primary-950 border-b border-gold-500/25 shadow-sm">
        <button
          className="lg:hidden p-1.5 -ml-1 text-gold-300 hover:text-gold-200 shrink-0"
          onClick={() => setSidebarOpen(true)}
          aria-label={t('nav.openMenu')}
        >
          <Menu size={22} />
        </button>
        <FactoryLogo size="sidebar" className="ring-2 ring-gold-400/60 shrink-0 my-0.5" />
        <h1 className="font-bold text-xl sm:text-2xl text-gold-300 truncate min-w-0 flex-1 leading-tight">
          {t('app.factoryName')}
        </h1>
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-primary-800 text-gold-300 shrink-0"
          aria-label={t('nav.toggleTheme')}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside
          className={`fixed lg:static top-[5.5rem] lg:top-auto bottom-0 start-0 z-50 w-72 bg-primary-900 border-e border-gold-600/20 flex flex-col transform transition-transform lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full rtl:lg:translate-x-0'
          }`}
        >
          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            {filteredNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} className="shrink-0" />
                <span className="text-sm">{t(item.labelKey)}</span>
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/backup" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Database size={20} className="shrink-0" />
                <span className="text-sm">{t('nav.backup')}</span>
              </NavLink>
            )}
          </nav>

          <div className="p-3 border-t border-gold-500/20 shrink-0">
            <p className="text-xs text-gold-300/80 px-4 mb-2">{user?.full_name} ({roleLabel})</p>
            <button onClick={handleLogout} className="sidebar-link w-full !text-red-300 hover:!text-red-200">
              <LogOut size={20} className="shrink-0" />
              <span className="text-sm">{t('nav.logout')}</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0 bg-factory-cream dark:bg-primary-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

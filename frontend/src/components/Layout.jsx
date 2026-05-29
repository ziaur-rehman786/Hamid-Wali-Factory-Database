import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, FileText, Users, BookOpen, BarChart3,
  Settings, LogOut, Menu, Moon, Sun, Database, Palette, Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FactoryLogo from './FactoryLogo';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/invoices/new', icon: FileText, label: 'New Invoice' },
  { to: '/customers', icon: Users, label: 'Customers / Khata' },
  { to: '/roznamcha', icon: BookOpen, label: 'Roznamcha' },
  { to: '/salary', icon: Wallet, label: 'Employee Salary' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/master-data', icon: Palette, label: 'Designs & Colors' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const filteredNav = navItems.filter((item) => {
    if (item.to === '/settings' && !isAdmin) return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-primary-900 border-r border-gold-600/20 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-gold-500/20 bg-primary-950/50">
          <div className="flex items-center gap-4">
            <FactoryLogo size="sidebar" className="ring-2 ring-gold-400/70 shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-2xl leading-tight text-white">Hamid Wali</h1>
              <p className="text-lg text-gold-400 font-semibold mt-1">Shoe Factory</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/backup" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Database size={20} />
              <span className="text-sm">Backup</span>
            </NavLink>
          )}
        </nav>

        <div className="p-3 border-t border-gold-500/20">
          <p className="text-xs text-gold-300/80 px-4 mb-2">{user?.full_name} ({user?.role})</p>
          <button onClick={handleLogout} className="sidebar-link w-full !text-red-300 hover:!text-red-200">
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-primary-900 border-b border-gold-200/40 dark:border-gold-600/20 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button className="lg:hidden p-2 text-primary-900 dark:text-gold-300" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h2 className="font-semibold text-lg hidden sm:block text-primary-900 dark:text-gold-300">
            Hamid Wali Shoe Factory
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gold-50 dark:hover:bg-primary-800 text-primary-800 dark:text-gold-300"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

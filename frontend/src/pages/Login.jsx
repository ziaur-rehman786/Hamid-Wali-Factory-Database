import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FactoryLogo from '../components/FactoryLogo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,#D4AF37_0%,transparent_50%)]" />
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_70%_80%,#D4AF37_0%,transparent_40%)]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 p-3 bg-white rounded-full shadow-gold w-fit ring-4 ring-gold-400/60">
            <FactoryLogo size="xl" className="w-28 h-28" />
          </div>
          <h1 className="text-3xl font-bold text-white">Hamid Wali Shoe Factory</h1>
          <p className="text-gold-400 mt-2 font-medium">Inventory & Billing System</p>
        </div>

        <form onSubmit={handleSubmit} className="card border-gold-200/60 shadow-navy">
          <h2 className="text-xl font-semibold mb-6 text-primary-800 dark:text-gold-400">Sign In</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary-800 dark:text-gray-200">Username</label>
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
              <label className="block text-sm font-medium mb-1 text-primary-800 dark:text-gray-200">Password</label>
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Admin: admin / admin123 &nbsp;|&nbsp; Staff: staff / staff123
          </p>
        </form>
      </div>
    </div>
  );
}

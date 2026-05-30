import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCustomers, createCustomer } from '../services/api';
import { translateApiMessage } from '../utils/translateApi';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { formatCurrency } from '../utils/format';

export default function Customers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getCustomers({ search, page, limit: 20 });
      setCustomers(data.data);
      setPagination({ page: data.pagination.page, total: data.pagination.total, limit: 20 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCustomer(form);
      toast.success(t('customers.added'));
      setShowModal(false);
      setForm({ name: '', phone: '', address: '' });
      load();
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('common.failed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('customers.title')}</h1>
          <p className="text-gray-500">{t('customers.subtitle')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> {t('customers.addCustomer')}
        </button>
      </div>

      <div className="flex gap-3">
        <input className="input-field max-w-sm" placeholder={t('customers.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button onClick={() => load()} className="btn-primary"><Search size={16} /></button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="table-container card p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('common.name')}</th>
                  <th>{t('common.phone')}</th>
                  <th>{t('customers.totalCredit')}</th>
                  <th>{t('customers.totalPaid')}</th>
                  <th>{t('customers.remainingKhata')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{formatCurrency(c.total_credit)}</td>
                    <td>{formatCurrency(c.total_paid)}</td>
                    <td className={c.remaining_balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                      {formatCurrency(c.remaining_balance)}
                    </td>
                    <td>
                      <Link to={`/customers/${c.id}`} className="text-primary-800 dark:text-gold-400 hover:underline text-sm font-medium">{t('customers.viewKhata')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination {...pagination} onPageChange={load} />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
            <h3 className="font-semibold">{t('customers.addCustomer')}</h3>
            <input className="input-field" placeholder={t('common.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input-field" placeholder={t('common.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="input-field" placeholder={t('common.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">{t('common.save')}</button>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

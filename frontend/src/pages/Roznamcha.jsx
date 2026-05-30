import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRoznamcha, createRoznamcha, deleteRoznamcha } from '../services/api';
import { translateApiMessage } from '../utils/translateApi';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { formatCurrency, formatDate } from '../utils/format';

export default function Roznamcha() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({});
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date_from: '', date_to: '' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ entry_date: '', details: '', income: 0, expense: 0 });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getRoznamcha({ ...filters, page, limit: 50 });
      setEntries(data.data);
      setTotals(data.totals);
      setPagination({ page: data.pagination.page, total: data.pagination.total, limit: 50 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRoznamcha(form);
      toast.success(t('roznamcha.entryAdded'));
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('common.failed'));
    }
  };

  const handleDelete = async (entry) => {
    if (entry.entry_type !== 'manual') {
      toast.error(t('roznamcha.manualOnlyDelete'));
      return;
    }
    if (!confirm(t('roznamcha.deleteConfirm', { details: entry.details }))) return;
    try {
      await deleteRoznamcha(entry.id);
      toast.success(t('roznamcha.entryDeleted'));
      load(pagination.page);
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('roznamcha.cannotDelete'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('roznamcha.title')}</h1>
          <p className="text-gray-500">{t('roznamcha.subtitle')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> {t('roznamcha.addEntry')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">{t('roznamcha.totalIncome')}</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totals.total_income)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">{t('roznamcha.totalExpense')}</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totals.total_expense)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">{t('roznamcha.net')}</p>
          <p className="text-xl font-bold">{formatCurrency((totals.total_income || 0) - (totals.total_expense || 0))}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="date" className="input-field max-w-xs" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        <input type="date" className="input-field max-w-xs" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
        <button onClick={() => load()} className="btn-primary">{t('common.filter')}</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="table-container card p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>{t('common.details')}</th>
                  <th>{t('common.income')}</th>
                  <th>{t('common.expense')}</th>
                  <th>{t('common.balance')}</th>
                  <th>{t('common.type')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{formatDate(e.entry_date)}</td>
                    <td>{e.details}</td>
                    <td className="text-green-600">{e.income > 0 ? formatCurrency(e.income) : '-'}</td>
                    <td className="text-red-600">{e.expense > 0 ? formatCurrency(e.expense) : '-'}</td>
                    <td>{formatCurrency(e.balance)}</td>
                    <td><span className="text-xs bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded">{e.entry_type}</span></td>
                    <td>
                      {e.entry_type === 'manual' ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(e)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title={t('roznamcha.deleteEntry')}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
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
            <h3 className="font-semibold">{t('roznamcha.addRoznamcha')}</h3>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.date')}</label>
              <input type="date" className="input-field" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.details')}</label>
              <input className="input-field" placeholder={t('roznamcha.detailsPlaceholder')} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-green-700 dark:text-green-400">{t('roznamcha.incomeAfn')}</label>
              <p className="text-xs text-gray-500 mb-1">{t('roznamcha.incomeHint')}</p>
              <input type="number" min="0" className="input-field" placeholder="0" value={form.income} onChange={(e) => setForm({ ...form, income: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-red-700 dark:text-red-400">{t('roznamcha.expenseAfn')}</label>
              <p className="text-xs text-gray-500 mb-1">{t('roznamcha.expenseHint')}</p>
              <input type="number" min="0" className="input-field" placeholder="0" value={form.expense} onChange={(e) => setForm({ ...form, expense: e.target.value })} />
            </div>
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

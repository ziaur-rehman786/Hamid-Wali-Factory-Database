import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRoznamcha, createRoznamcha, deleteRoznamcha } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { formatCurrency, formatDate } from '../utils/format';

export default function Roznamcha() {
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
      toast.success('Entry added');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (entry) => {
    if (entry.entry_type !== 'manual') {
      toast.error('Only manual entries can be deleted. Delete the invoice or payment instead.');
      return;
    }
    if (!confirm(`Delete roznamcha entry "${entry.details}"?`)) return;
    try {
      await deleteRoznamcha(entry.id);
      toast.success('Entry deleted');
      load(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete this entry');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roznamcha (Daily Ledger)</h1>
          <p className="text-gray-500">Daily income and expense tracking. Manual entries can be deleted; invoice/payment entries are removed when you delete that bill or payment.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Entry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totals.total_income)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Expense</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totals.total_expense)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Net</p>
          <p className="text-xl font-bold">{formatCurrency((totals.total_income || 0) - (totals.total_expense || 0))}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="date" className="input-field max-w-xs" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        <input type="date" className="input-field max-w-xs" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
        <button onClick={() => load()} className="btn-primary">Filter</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="table-container card p-0">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Details</th><th>Income</th><th>Expense</th><th>Balance</th><th>Type</th><th>Actions</th></tr>
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
                          title="Delete entry"
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
            <h3 className="font-semibold">Add Roznamcha Entry</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" className="input-field" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Details</label>
              <input className="input-field" placeholder="e.g. Lunch, Rent, Cash sale..." value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-green-700 dark:text-green-400">Income (AFN)</label>
              <p className="text-xs text-gray-500 mb-1">Money received — leave 0 if none</p>
              <input type="number" min="0" className="input-field" placeholder="0" value={form.income} onChange={(e) => setForm({ ...form, income: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-red-700 dark:text-red-400">Expense (AFN)</label>
              <p className="text-xs text-gray-500 mb-1">Money paid out — leave 0 if none</p>
              <input type="number" min="0" className="input-field" placeholder="0" value={form.expense} onChange={(e) => setForm({ ...form, expense: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Save</button>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

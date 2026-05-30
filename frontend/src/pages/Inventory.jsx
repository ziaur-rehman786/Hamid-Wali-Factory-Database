import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInventory, getDesigns, getColors, getSizes, createInventory, updateInventory, addStock } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { translateApiMessage } from '../utils/translateApi';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { formatCurrency, formatNumber } from '../utils/format';

export default function Inventory() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', low_stock: false });
  const [showModal, setShowModal] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [form, setForm] = useState({ design_id: '', color_id: '', size_id: '', quantity: 0, cost_price: 0, sale_price: 0 });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getInventory({ ...filters, page, limit: 50, low_stock: filters.low_stock || undefined });
      setItems(data.data);
      setSummary(data.summary);
      setPagination({ page: data.pagination.page, total: data.pagination.total, limit: 50 });
    } catch (err) {
      toast.error(t('inventory.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    Promise.all([getDesigns(), getColors(), getSizes()]).then(([d, c, s]) => {
      setDesigns(d.data);
      setColors(c.data);
      setSizes(s.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInventory(form);
      toast.success(t('inventory.stockAdded'));
      setShowModal(false);
      load(pagination.page);
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('common.failed'));
    }
  };

  const handleAddStock = async (id) => {
    const qty = prompt(t('inventory.enterQtyPrompt'));
    if (!qty) return;
    try {
      await addStock(id, parseInt(qty));
      toast.success(t('inventory.stockUpdated'));
      load(pagination.page);
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('common.failed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
          <p className="text-gray-500">{t('inventory.totalPairs', { count: formatNumber(summary.total_qty) })}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> {t('inventory.addStockEntry')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            className="input-field pl-10"
            placeholder={t('inventory.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.low_stock}
            onChange={(e) => setFilters({ ...filters, low_stock: e.target.checked })}
          />
          {t('inventory.lowStockOnly')}
        </label>
        <button onClick={() => load()} className="btn-primary">{t('common.search')}</button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="table-container card p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('common.design')}</th>
                  <th>{t('common.color')}</th>
                  <th>{t('common.size')}</th>
                  <th>{t('inventory.qty')}</th>
                  {isAdmin && <th>{t('inventory.costAfn')}</th>}
                  <th>{t('inventory.salePriceAfn')}</th>
                  <th>{t('common.status')}</th>
                  {isAdmin && <th>{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.art_number}</td>
                    <td>{item.color_name}</td>
                    <td>{item.size_value}</td>
                    <td className={item.quantity <= item.low_stock_threshold ? 'text-red-600 font-bold' : ''}>
                      {item.quantity}
                      {item.quantity <= item.low_stock_threshold && (
                        <AlertTriangle size={14} className="inline ml-1" />
                      )}
                    </td>
                    {isAdmin && <td>{formatCurrency(item.cost_price)}</td>}
                    <td>{formatCurrency(item.sale_price)}</td>
                    <td>
                      {item.quantity <= item.low_stock_threshold ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{t('inventory.lowStock')}</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{t('inventory.inStock')}</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <button onClick={() => handleAddStock(item.id)} className="text-primary-800 dark:text-gold-400 text-sm hover:underline font-medium">
                          {t('inventory.addStock')}
                        </button>
                      </td>
                    )}
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
            <h3 className="font-semibold text-lg">{t('inventory.addStockEntry')}</h3>
            <select className="input-field" value={form.design_id} onChange={(e) => setForm({ ...form, design_id: e.target.value })} required>
              <option value="">{t('inventory.selectDesign')}</option>
              {designs.map((d) => <option key={d.id} value={d.id}>{d.art_number}</option>)}
            </select>
            <select className="input-field" value={form.color_id} onChange={(e) => setForm({ ...form, color_id: e.target.value })} required>
              <option value="">{t('inventory.selectColor')}</option>
              {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input-field" value={form.size_id} onChange={(e) => setForm({ ...form, size_id: e.target.value })} required>
              <option value="">{t('inventory.selectSize')}</option>
              {sizes.map((s) => <option key={s.id} value={s.id}>{s.size_value}</option>)}
            </select>
            <input type="number" className="input-field" placeholder={t('common.quantity')} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <input type="number" className="input-field" placeholder={t('inventory.costPrice')} value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} required />
            <input type="number" className="input-field" placeholder={t('inventory.salePriceAfn')} value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} required />
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

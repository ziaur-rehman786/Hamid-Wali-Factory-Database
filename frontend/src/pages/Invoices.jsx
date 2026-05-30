import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { getInvoices } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { formatCurrency, formatDate } from '../utils/format';

export default function Invoices() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ customer: '', invoice_number: '' });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getInvoices({ ...filters, page, limit: 20 });
      setInvoices(data.data);
      setPagination({ page: data.pagination.page, total: data.pagination.total, limit: 20 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('invoices.title')}</h1>
        <Link to="/invoices/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> {t('invoices.newInvoice')}
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input className="input-field max-w-xs" placeholder={t('invoices.customerName')} value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} />
        <input className="input-field max-w-xs" placeholder={t('invoices.invoiceNumber')} value={filters.invoice_number} onChange={(e) => setFilters({ ...filters, invoice_number: e.target.value })} />
        <button onClick={() => load()} className="btn-primary flex items-center gap-1"><Search size={16} /> {t('common.search')}</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="table-container card p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('invoices.invoiceNum')}</th>
                  <th>{t('common.date')}</th>
                  <th>{t('dashboard.customer')}</th>
                  <th>{t('common.total')}</th>
                  <th>{t('common.paid')}</th>
                  <th>{t('common.remaining')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-medium">{inv.invoice_number}</td>
                    <td>{formatDate(inv.invoice_date)}</td>
                    <td>{inv.customer_name}</td>
                    <td>{formatCurrency(inv.grand_total)}</td>
                    <td>{formatCurrency(inv.paid_amount)}</td>
                    <td className={inv.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatCurrency(inv.remaining_amount)}
                    </td>
                    <td>
                      <Link to={`/invoices/${inv.id}`} className="text-primary-800 dark:text-gold-400 hover:underline text-sm font-medium">{t('invoices.view')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination {...pagination} onPageChange={load} />
        </>
      )}
    </div>
  );
}

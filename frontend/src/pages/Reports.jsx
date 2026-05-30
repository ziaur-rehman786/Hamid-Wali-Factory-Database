import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getDailySales, getMonthlySales, getProfitReport, getStockReport,
  getCustomerBalances, getBestSelling, exportReport
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/format';

const COL_LABELS = {
  invoice_number: 'invoices.invoiceNum',
  customer_name: 'dashboard.customer',
  grand_total: 'common.total',
  paid_amount: 'common.paid',
  remaining_amount: 'common.remaining',
  invoice_date: 'common.date',
  total_profit: 'dashboard.totalProfit',
  total_loss: 'dashboard.totalLoss',
  art_number: 'masterData.artNumber',
  color: 'common.color',
  size: 'common.size',
  quantity: 'common.quantity',
  cost_price: 'inventory.costPrice',
  sale_price: 'inventory.salePriceAfn',
  name: 'common.name',
  phone: 'common.phone',
  total_credit: 'customers.totalCredit',
  total_paid: 'customers.totalPaid',
  remaining_balance: 'customers.remainingKhata',
};

export default function Reports() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = async () => {
    setLoading(true);
    try {
      let res;
      switch (tab) {
        case 'daily': res = await getDailySales({ date }); break;
        case 'monthly': res = await getMonthlySales({ month, year }); break;
        case 'profit': res = await getProfitReport(); break;
        case 'stock': res = await getStockReport(); break;
        case 'customers': res = await getCustomerBalances(); break;
        case 'bestselling': res = await getBestSelling({ limit: 15 }); break;
        default: break;
      }
      setData(res?.data);
    } catch (err) {
      toast.error(t('reports.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const handleExport = async (type) => {
    try {
      const res = await exportReport(type);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.xlsx`;
      a.click();
      toast.success(t('reports.downloaded'));
    } catch {
      toast.error(t('reports.exportFailed'));
    }
  };

  const tabs = [
    { id: 'daily', labelKey: 'reports.dailySales' },
    { id: 'monthly', labelKey: 'reports.monthlySales' },
    ...(isAdmin ? [{ id: 'profit', labelKey: 'reports.profitReport' }] : []),
    { id: 'stock', labelKey: 'reports.stockReport' },
    { id: 'customers', labelKey: 'reports.customerBalances' },
    { id: 'bestselling', labelKey: 'reports.bestSelling' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
        <div className="flex gap-2">
          {['stock', 'customers', 'invoices'].map((type) => (
            <button key={type} onClick={() => handleExport(type)} className="btn-secondary text-sm flex items-center gap-1">
              <Download size={14} /> {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === tabItem.id ? 'bg-gold-500 text-primary-900 font-semibold' : 'bg-primary-50 text-primary-800 dark:bg-primary-800 dark:text-gray-200'
            }`}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {(tab === 'daily' || tab === 'monthly') && (
        <div className="flex gap-3">
          {tab === 'daily' && (
            <input type="date" className="input-field max-w-xs" value={date} onChange={(e) => setDate(e.target.value)} />
          )}
          {tab === 'monthly' && (
            <>
              <select className="input-field max-w-xs" value={month} onChange={(e) => setMonth(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
              <input type="number" className="input-field max-w-xs" value={year} onChange={(e) => setYear(e.target.value)} />
            </>
          )}
          <button onClick={load} className="btn-primary">{t('common.load')}</button>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          {tab === 'daily' && data && (
            <>
              <p className="mb-4">{t('reports.dailySummary', { date: formatDate(data.date), invoices: data.summary?.count, total: formatCurrency(data.summary?.total) })}</p>
              <ReportTable rows={data.invoices} cols={['invoice_number', 'customer_name', 'grand_total', 'paid_amount', 'remaining_amount']} t={t} />
            </>
          )}
          {tab === 'monthly' && data && (
            <>
              <p className="mb-4">{t('reports.monthlySummary', { month: `${data.month}/${data.year}`, total: formatCurrency(data.summary?.total) })}</p>
              <ReportTable rows={data.invoices} cols={['invoice_date', 'invoice_number', 'customer_name', 'grand_total']} t={t} />
            </>
          )}
          {tab === 'profit' && data && isAdmin && (
            <>
              <p className="mb-4">{t('reports.profitSummary', { profit: formatCurrency(data.summary?.profit), loss: formatCurrency(data.summary?.loss) })}</p>
              <ReportTable rows={data.data} cols={['invoice_date', 'invoice_number', 'grand_total', 'total_profit', 'total_loss']} t={t} />
            </>
          )}
          {tab === 'stock' && data && (
            <>
              <p className="mb-4">{t('reports.stockSummary', { pairs: data.summary?.total_pairs, value: formatCurrency(data.summary?.total_value) })}</p>
              <ReportTable rows={data.data} cols={['art_number', 'color', 'size', 'quantity', 'cost_price', 'sale_price']} t={t} />
            </>
          )}
          {tab === 'customers' && data && (
            <>
              <p className="mb-4">{t('reports.customerSummary', { due: formatCurrency(data.summary?.total_due) })}</p>
              <ReportTable rows={data.data} cols={['name', 'phone', 'total_credit', 'total_paid', 'remaining_balance']} t={t} />
            </>
          )}
          {tab === 'bestselling' && data && (
            <ReportTable rows={data} cols={['art_number', 'name', 'total_sold', 'total_revenue']} t={t} />
          )}
        </div>
      )}
    </div>
  );
}

function ReportTable({ rows, cols, t }) {
  if (!rows?.length) return <p className="text-gray-500">{t('common.noData')}</p>;
  const colLabel = (c) => (COL_LABELS[c] ? t(COL_LABELS[c]) : c.replace(/_/g, ' '));
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>{cols.map((c) => <th key={c}>{colLabel(c)}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c}>
                  {['grand_total', 'paid_amount', 'remaining_amount', 'total_profit', 'total_loss', 'cost_price', 'sale_price', 'total_revenue', 'total_credit', 'total_paid', 'remaining_balance'].includes(c)
                    ? formatCurrency(row[c])
                    : c.includes('date') ? formatDate(row[c]) : row[c]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

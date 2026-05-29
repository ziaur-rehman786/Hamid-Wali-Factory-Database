import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getDailySales, getMonthlySales, getProfitReport, getStockReport,
  getCustomerBalances, getBestSelling, exportReport
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/format';

export default function Reports() {
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
      toast.error('Failed to load report');
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
      toast.success('Report downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const tabs = [
    { id: 'daily', label: 'Daily Sales' },
    { id: 'monthly', label: 'Monthly Sales' },
    ...(isAdmin ? [{ id: 'profit', label: 'Profit Report' }] : []),
    { id: 'stock', label: 'Stock Report' },
    { id: 'customers', label: 'Customer Balances' },
    { id: 'bestselling', label: 'Best Selling' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">
          {['stock', 'customers', 'invoices'].map((type) => (
            <button key={type} onClick={() => handleExport(type)} className="btn-secondary text-sm flex items-center gap-1">
              <Download size={14} /> {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-gold-500 text-primary-900 font-semibold' : 'bg-primary-50 text-primary-800 dark:bg-primary-800 dark:text-gray-200'
            }`}
          >
            {t.label}
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
          <button onClick={load} className="btn-primary">Load</button>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          {tab === 'daily' && data && (
            <>
              <p className="mb-4">Date: {formatDate(data.date)} | Invoices: {data.summary?.count} | Total: {formatCurrency(data.summary?.total)}</p>
              <ReportTable rows={data.invoices} cols={['invoice_number', 'customer_name', 'grand_total', 'paid_amount', 'remaining_amount']} />
            </>
          )}
          {tab === 'monthly' && data && (
            <>
              <p className="mb-4">Month: {data.month}/{data.year} | Total: {formatCurrency(data.summary?.total)}</p>
              <ReportTable rows={data.invoices} cols={['invoice_date', 'invoice_number', 'customer_name', 'grand_total']} />
            </>
          )}
          {tab === 'profit' && data && isAdmin && (
            <>
              <p className="mb-4">Profit: {formatCurrency(data.summary?.profit)} | Loss: {formatCurrency(data.summary?.loss)}</p>
              <ReportTable rows={data.data} cols={['invoice_date', 'invoice_number', 'grand_total', 'total_profit', 'total_loss']} />
            </>
          )}
          {tab === 'stock' && data && (
            <>
              <p className="mb-4">Total Pairs: {data.summary?.total_pairs} | Value: {formatCurrency(data.summary?.total_value)}</p>
              <ReportTable rows={data.data} cols={['art_number', 'color', 'size', 'quantity', 'cost_price', 'sale_price']} />
            </>
          )}
          {tab === 'customers' && data && (
            <>
              <p className="mb-4">Total Due: {formatCurrency(data.summary?.total_due)}</p>
              <ReportTable rows={data.data} cols={['name', 'phone', 'total_credit', 'total_paid', 'remaining_balance']} />
            </>
          )}
          {tab === 'bestselling' && data && (
            <ReportTable rows={data} cols={['art_number', 'name', 'total_sold', 'total_revenue']} />
          )}
        </div>
      )}
    </div>
  );
}

function ReportTable({ rows, cols }) {
  if (!rows?.length) return <p className="text-gray-500">No data found</p>;
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>{cols.map((c) => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr>
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

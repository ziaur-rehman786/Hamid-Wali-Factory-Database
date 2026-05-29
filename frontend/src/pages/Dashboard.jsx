import { useEffect, useState } from 'react';
import { Package, DollarSign, Users, AlertTriangle, TrendingUp, CreditCard } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatNumber, formatDate } from '../utils/format';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p>Failed to load dashboard</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-900 dark:text-gold-300">Dashboard</h1>
        <p className="text-primary-600 dark:text-gray-400">Overview of factory operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard title="Total Stock" value={`${formatNumber(data.totalStock)} pairs`} icon={Package} color="primary" />
        <StatCard title="Total Sales" value={formatCurrency(data.totalSales)} icon={DollarSign} color="green" />
        {isAdmin && (
          <>
            <StatCard title="Total Profit" value={formatCurrency(data.totalProfit)} icon={TrendingUp} color="green" />
            <StatCard title="Total Loss" value={formatCurrency(data.totalLoss)} icon={AlertTriangle} color="red" />
          </>
        )}
        <StatCard
          title="Pending Payments (Khata Due)"
          value={formatCurrency(data.pendingPayments)}
          subtitle="From open invoices only"
          icon={CreditCard}
          color="amber"
        />
        <StatCard title="Total Customers" value={data.totalCustomers} icon={Users} color="purple" />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(data.dailySales.total)}
          subtitle={`${data.dailySales.count} invoices`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(data.monthlySales.total)}
          subtitle={`${data.monthlySales.count} invoices`}
          icon={TrendingUp}
          color="primary"
        />
        {data.lowStockCount > 0 && (
          <StatCard title="Low Stock Items" value={data.lowStockCount} icon={AlertTriangle} color="red" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Daily Sales (30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.salesChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="total" stroke="#D4AF37" strokeWidth={2} dot={{ fill: '#001f3f' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Monthly Sales</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#001f3f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Recent Invoices</h3>
          <Link to="/invoices" className="text-gold-600 hover:text-gold-700 text-sm font-medium hover:underline">View All</Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {data.recentInvoices?.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link to={`/invoices/${inv.id}`} className="text-primary-800 dark:text-gold-400 hover:underline font-medium">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td>{inv.customer_name}</td>
                  <td>{formatDate(inv.invoice_date)}</td>
                  <td>{formatCurrency(inv.grand_total)}</td>
                  <td className={inv.remaining_amount > 0 ? 'text-red-600' : ''}>
                    {formatCurrency(inv.remaining_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

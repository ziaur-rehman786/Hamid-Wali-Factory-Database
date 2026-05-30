import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCustomer, addPayment } from '../services/api';
import { translateApiMessage } from '../utils/translateApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/format';

export default function CustomerDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState({ amount: '', notes: '' });
  const [showPayment, setShowPayment] = useState(false);

  const load = () => {
    getCustomer(id)
      .then((res) => setCustomer(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const khataLedger = useMemo(() => {
    if (!customer) return [];
    const entries = [];

    (customer.invoices || []).forEach((inv) => {
      entries.push({
        id: `inv-${inv.id}`,
        type: 'Invoice',
        details: inv.invoice_number,
        khataAdded: parseFloat(inv.remaining_amount) || 0,
        payment: parseFloat(inv.paid_amount) || 0,
        total: parseFloat(inv.grand_total) || 0,
        link: `/invoices/${inv.id}`,
      });
    });

    (customer.payments || []).forEach((p) => {
      if (p.invoice_id && p.notes === 'Payment with invoice') return;
      entries.push({
        id: `pay-${p.id}`,
        type: 'Payment',
        details: p.invoice_number ? t('customerDetail.paymentFor', { invoice: p.invoice_number }) : p.notes || t('customerDetail.paymentReceived'),
        khataAdded: 0,
        payment: parseFloat(p.amount) || 0,
        total: 0,
        link: null,
      });
    });

    return entries;
  }, [customer, t]);

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await addPayment(id, {
        amount: parseFloat(payment.amount),
        notes: payment.notes,
      });
      toast.success(t('customerDetail.paymentRecorded'));
      setShowPayment(false);
      setPayment({ amount: '', notes: '' });
      load();
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('common.failed'));
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!customer) return <p>{t('customerDetail.notFound')}</p>;

  const balance = parseFloat(customer.remaining_balance) || 0;

  const typeLabel = (type) => (type === 'Invoice' ? t('dashboard.invoice') : t('customerDetail.payment'));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-primary-900 dark:text-gold-300">{customer.name}</h1>
          <p className="text-gray-500">{customer.phone || '—'} {customer.address ? `| ${customer.address}` : ''}</p>
        </div>
        <button onClick={() => setShowPayment(true)} className="btn-primary">{t('customerDetail.addPayment')}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">{t('customerDetail.totalCredit')}</p>
          <p className="text-2xl font-bold">{formatCurrency(customer.total_credit)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">{t('customerDetail.totalPaid')}</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(customer.total_paid)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">{t('customerDetail.remainingKhata')}</p>
          <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {formatCurrency(customer.remaining_balance)}
          </p>
          {balance < 0 && (
            <p className="text-xs text-amber-600 mt-1">{t('customerDetail.overpayment')}</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">{t('customerDetail.khataLedger')}</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('common.type')}</th>
                <th>{t('common.details')}</th>
                <th>{t('customerDetail.invoiceTotal')}</th>
                <th>{t('customerDetail.khataAdded')}</th>
                <th>{t('customerDetail.payment')}</th>
              </tr>
            </thead>
            <tbody>
              {khataLedger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-6">{t('customerDetail.noEntries')}</td>
                </tr>
              ) : (
                khataLedger.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          row.type === 'Invoice'
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-gold-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        }`}
                      >
                        {typeLabel(row.type)}
                      </span>
                    </td>
                    <td>
                      {row.link ? (
                        <Link to={row.link} className="text-primary-800 dark:text-gold-400 font-medium hover:underline">
                          {row.details}
                        </Link>
                      ) : (
                        row.details
                      )}
                    </td>
                    <td>{row.type === 'Invoice' ? formatCurrency(row.total) : '—'}</td>
                    <td className={row.khataAdded > 0 ? 'text-red-600 font-medium' : ''}>
                      {row.khataAdded > 0 ? formatCurrency(row.khataAdded) : '—'}
                    </td>
                    <td className={row.payment > 0 ? 'text-green-600 font-medium' : ''}>
                      {row.payment > 0 ? formatCurrency(row.payment) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handlePayment} className="card w-full max-w-sm space-y-4">
            <h3 className="font-semibold">{t('customerDetail.recordPayment')}</h3>
            <p className="text-sm text-gray-500">
              {t('customerDetail.currentKhata')} <strong>{formatCurrency(customer.remaining_balance)}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">{t('customerDetail.amountAfn')}</label>
              <input
                type="number"
                min="0"
                className="input-field"
                placeholder="0"
                value={payment.amount}
                onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                required
              />
            </div>
            <input
              className="input-field"
              placeholder={t('customerDetail.notesOptional')}
              value={payment.notes}
              onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
            />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">{t('common.save')}</button>
              <button type="button" onClick={() => setShowPayment(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

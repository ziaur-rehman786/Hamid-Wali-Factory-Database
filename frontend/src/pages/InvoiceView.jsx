import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Printer, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInvoice, deleteInvoice } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/format';
import { downloadInvoicePDF, printInvoice } from '../utils/invoicePdf';
import FactoryLogo, { getLogoUrl } from '../components/FactoryLogo';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvoice(id)
      .then((res) => setInvoice(res.data))
      .catch(() => toast.error('Invoice not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete invoice and restore stock?')) return;
    try {
      await deleteInvoice(id);
      toast.success('Invoice deleted');
      navigate('/invoices');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!invoice) return <p>Invoice not found</p>;

  const factory = invoice.factory || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 no-print">
        <h1 className="text-2xl font-bold">Invoice {invoice.invoice_number}</h1>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                await downloadInvoicePDF(invoice);
              } catch {
                toast.error('PDF download failed');
              }
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={18} /> PDF
          </button>
          <button
            onClick={async () => {
              try {
                await printInvoice(invoice);
              } catch {
                toast.error('Print failed');
              }
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Printer size={18} /> Print
          </button>
          {isAdmin && (
            <button onClick={handleDelete} className="btn-danger flex items-center gap-2">
              <Trash2 size={18} /> Delete
            </button>
          )}
        </div>
      </div>

      <div id="invoice-print" className="card max-w-3xl mx-auto">
        <div className="text-center border-b-2 border-gold-500 pb-4 mb-6">
          <FactoryLogo src={getLogoUrl(factory)} size="invoice" className="w-24 h-24 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-primary-900">{factory.factory_name || 'Hamid Wali Shoe Factory'}</h2>
          <p className="text-sm text-gray-500">{factory.factory_address}</p>
          <p className="text-sm text-gray-500">Phone: {factory.factory_phone}</p>
          {factory.factory_email && (
            <p className="text-sm text-gray-500">Email: {factory.factory_email}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p><strong>Invoice:</strong> {invoice.invoice_number}</p>
            <p><strong>Date:</strong> {formatDate(invoice.invoice_date)}</p>
          </div>
          <div className="text-right">
            <p><strong>Customer:</strong> {invoice.customer_name}</p>
            {invoice.phone && <p><strong>Phone:</strong> {invoice.phone}</p>}
          </div>
        </div>

        <table className="data-table w-full mb-6">
          <thead>
            <tr>
              <th>Design</th>
              <th>Color</th>
              <th>Size</th>
              <th>Cartons</th>
              <th>Pairs</th>
              <th>Price (AFN)</th>
              <th>Total (AFN)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, i) => (
              <tr key={i}>
                <td>{item.art_number}</td>
                <td>{item.color_name}</td>
                <td>{item.size_value}</td>
                <td>{item.cartons != null && item.cartons > 0 ? item.cartons : '—'}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.sale_price)}</td>
                <td>{formatCurrency(item.item_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t pt-4 space-y-2 text-right">
          <p className="text-lg"><strong>Grand Total:</strong> {formatCurrency(invoice.grand_total)}</p>
          <p><strong>Paid Amount:</strong> {formatCurrency(invoice.paid_amount)}</p>
          <p className="text-xl text-red-600 font-bold">
            <strong>Remaining Amount:</strong> {formatCurrency(invoice.remaining_amount)}
          </p>
        </div>

        {isAdmin && (invoice.total_profit > 0 || invoice.total_loss > 0) && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg no-print text-sm">
            <p className="font-semibold text-gray-500 mb-2">Internal (Admin Only)</p>
            <p>Profit: {formatCurrency(invoice.total_profit)}</p>
            <p>Loss: {formatCurrency(invoice.total_loss)}</p>
          </div>
        )}

        <p className="text-center text-gray-400 text-sm mt-8">Thank you for your business!</p>
      </div>
    </div>
  );
}

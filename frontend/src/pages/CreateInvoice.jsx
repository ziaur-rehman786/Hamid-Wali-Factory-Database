import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCustomers, getDesigns, getColors, getSizes, getInventory, createInvoice, createCustomer, getSettings,
} from '../services/api';
import { formatCurrency } from '../utils/format';

const todayISO = () => new Date().toISOString().split('T')[0];

const emptyItem = () => ({
  design_id: '', color_id: '', size_id: '', cartons: '', quantity: 1, sale_price: 0, available: 0,
});

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [pairsPerCarton, setPairsPerCarton] = useState(8);
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(todayISO);
  const [paidAmount, setPaidAmount] = useState(0);
  const [items, setItems] = useState([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  useEffect(() => {
    Promise.all([
      getCustomers({ limit: 500 }),
      getDesigns(),
      getColors(),
      getSizes(),
      getSettings(),
    ]).then(([c, d, col, s, settings]) => {
      setCustomers(c.data.data);
      setDesigns(d.data);
      setColors(col.data);
      setSizes(s.data);
      setPairsPerCarton(parseInt(settings.data.pairs_per_carton || '8', 10) || 8);
    });
  }, []);

  const applyCartonsToQuantity = (item) => {
    const cartons = parseInt(item.cartons, 10);
    if (item.cartons !== '' && !Number.isNaN(cartons) && cartons > 0) {
      return { ...item, quantity: cartons * pairsPerCarton };
    }
    return item;
  };

  const updateItem = async (index, field, value) => {
    let updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'cartons') {
      updated[index] = applyCartonsToQuantity(updated[index]);
    }

    if (['design_id', 'color_id', 'size_id'].includes(field)) {
      const item = updated[index];
      if (item.design_id && item.color_id && item.size_id) {
        try {
          const { data } = await getInventory({
            design: designs.find((d) => d.id == item.design_id)?.art_number,
            color: colors.find((c) => c.id == item.color_id)?.name,
            size: sizes.find((s) => s.id == item.size_id)?.size_value,
            limit: 1,
          });
          const stock = data.data[0];
          if (stock) {
            updated[index].sale_price = parseFloat(stock.sale_price);
            updated[index].available = stock.quantity;
          }
        } catch {}
      }
    }
    setItems(updated);
  };

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (i) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));

  const grandTotal = items.reduce((sum, item) => sum + (item.sale_price * item.quantity || 0), 0);
  const remaining = grandTotal - paidAmount;

  const handleCreateCustomer = async () => {
    try {
      const { data } = await createCustomer(newCustomer);
      setCustomers([...customers, data]);
      setCustomerId(data.id);
      setShowNewCustomer(false);
      toast.success('Customer created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) return toast.error('Select a customer');

    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) {
        return toast.error('Enter pairs quantity (or use cartons to calculate pairs)');
      }
    }

    setLoading(true);
    try {
      const { data } = await createInvoice({
        customer_id: parseInt(customerId),
        invoice_date: invoiceDate,
        paid_amount: parseFloat(paidAmount) || 0,
        items: items.map(({ design_id, color_id, size_id, cartons, quantity, sale_price }) => {
          const cartonsNum = cartons !== '' && cartons != null ? parseInt(cartons, 10) : null;
          return {
            design_id: parseInt(design_id),
            color_id: parseInt(color_id),
            size_id: parseInt(size_id),
            cartons: cartonsNum > 0 ? cartonsNum : null,
            quantity: parseInt(quantity, 10),
            sale_price: parseFloat(sale_price),
          };
        }),
      });
      toast.success('Invoice created!');
      navigate(`/invoices/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold">Create New Invoice</h1>
      <p className="text-sm text-gray-500">
        1 carton = {pairsPerCarton} pairs. Leave <strong>Cartons</strong> empty when selling only a few pairs (e.g. 2 pairs).
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h3 className="font-semibold">Customer & Date</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Date</label>
            <input
              type="date"
              className="input-field max-w-xs"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <select className="input-field flex-1 min-w-[200px]" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.remaining_balance > 0 ? `(Due: ${formatCurrency(c.remaining_balance)})` : ''}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setShowNewCustomer(!showNewCustomer)} className="btn-secondary">
              + New Customer
            </button>
          </div>
          {showNewCustomer && (
            <div className="flex gap-2 flex-wrap p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <input className="input-field flex-1" placeholder="Name" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
              <input className="input-field flex-1" placeholder="Phone" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
              <button type="button" onClick={handleCreateCustomer} className="btn-primary">Add</button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Invoice Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary flex items-center gap-1 text-sm">
              <Plus size={16} /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const hasCartons = item.cartons !== '' && parseInt(item.cartons, 10) > 0;
              return (
                <div key={index} className="grid grid-cols-2 md:grid-cols-7 gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg items-end">
                  <div>
                    <label className="text-xs text-gray-500">Design</label>
                    <select className="input-field" value={item.design_id} onChange={(e) => updateItem(index, 'design_id', e.target.value)} required>
                      <option value="">Select</option>
                      {designs.map((d) => <option key={d.id} value={d.id}>{d.art_number}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Color</label>
                    <select className="input-field" value={item.color_id} onChange={(e) => updateItem(index, 'color_id', e.target.value)} required>
                      <option value="">Select</option>
                      {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Size</label>
                    <select className="input-field" value={item.size_id} onChange={(e) => updateItem(index, 'size_id', e.target.value)} required>
                      <option value="">Select</option>
                      {sizes.map((s) => <option key={s.id} value={s.id}>{s.size_value}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Cartons (optional)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      placeholder="—"
                      value={item.cartons}
                      onChange={(e) => updateItem(index, 'cartons', e.target.value)}
                    />
                    {hasCartons && (
                      <p className="text-[10px] text-primary-600 mt-0.5">= {item.quantity} pairs</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">
                      Pairs {item.available ? `(Avail: ${item.available})` : ''}
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      readOnly={hasCartons}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Sale Price (AFN)</label>
                    <input type="number" className="input-field" value={item.sale_price} onChange={(e) => updateItem(index, 'sale_price', e.target.value)} required />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{formatCurrency(item.sale_price * item.quantity)}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="text-red-500 p-1">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Grand Total</label>
              <p className="text-2xl font-bold text-primary-900 dark:text-gold-400">{formatCurrency(grandTotal)}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Paid Amount</label>
              <input type="number" className="input-field mt-1" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} min="0" />
            </div>
            <div>
              <label className="text-sm font-medium">Remaining (Khata)</label>
              <p className={`text-2xl font-bold mt-1 ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto px-8 py-3">
          {loading ? 'Creating...' : 'Create Invoice'}
        </button>
      </form>
    </div>
  );
}

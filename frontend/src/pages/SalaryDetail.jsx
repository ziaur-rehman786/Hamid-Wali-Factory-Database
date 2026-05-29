import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getSalary,
  createMonthlySalary,
  updateMonthlySalary,
  deleteMonthlySalary,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/format';

const emptyMonthForm = {
  month_year: '',
  salary_amount: '',
  advance_deducted: '',
  owed_settled: '',
  amount_paid: '',
  payment_status: 'not_paid',
  notes: '',
};

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function calcPreview(form) {
  const salaryAmount = num(form.salary_amount);
  const advanceDeducted = num(form.advance_deducted);
  const owedSettled = num(form.owed_settled);
  const netPayable = Math.max(0, salaryAmount - advanceDeducted);
  const totalDue = netPayable + owedSettled;
  const amountPaid =
    form.payment_status === 'paid'
      ? form.amount_paid !== '' && form.amount_paid != null
        ? num(form.amount_paid)
        : totalDue
      : null;
  const advanceGiven =
    amountPaid != null && form.payment_status === 'paid'
      ? Math.max(0, amountPaid - totalDue)
      : 0;
  const shortfall =
    amountPaid != null && form.payment_status === 'paid'
      ? Math.max(0, totalDue - amountPaid)
      : 0;
  return { netPayable, owedSettled, totalDue, amountPaid, advanceGiven, shortfall };
}

function suggestAmountPaid(form) {
  const p = calcPreview(form);
  if (form.payment_status !== 'paid') return form.amount_paid;
  return String(p.totalDue);
}

function toMonthForm(record, defaultSalary, advanceBalance = 0, owedBalance = 0) {
  if (!record) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const salary = defaultSalary ?? '';
    const advanceDeduct = advanceBalance > 0 ? Math.min(advanceBalance, num(salary)) : '';
    const owedSettle = owedBalance > 0 ? owedBalance : '';
    const net = Math.max(0, num(salary) - num(advanceDeduct));
    const total = net + num(owedSettle);
    return {
      ...emptyMonthForm,
      month_year: `${y}-${m}`,
      salary_amount: salary,
      advance_deducted: advanceDeduct === '' ? '' : String(advanceDeduct),
      owed_settled: owedSettle === '' ? '' : String(owedSettle),
      amount_paid: total > 0 ? String(total) : '',
      payment_status: 'not_paid',
    };
  }
  const mo = String(record.salary_month).padStart(2, '0');
  return {
    month_year: `${record.salary_year}-${mo}`,
    salary_amount: record.salary_amount ?? '',
    advance_deducted: record.advance_deducted ?? '',
    owed_settled: record.owed_settled ?? '',
    amount_paid: record.amount_paid != null ? record.amount_paid : '',
    payment_status: record.payment_status || 'not_paid',
    notes: record.notes || '',
  };
}

function statusBadge(status) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded ${
        status === 'paid'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
      }`}
    >
      {status === 'paid' ? 'Paid' : 'Not Paid'}
    </span>
  );
}

export default function SalaryDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState({ ...emptyMonthForm });

  const load = () => {
    setLoading(true);
    getSalary(id)
      .then((res) => setEmployee(res.data))
      .catch(() => toast.error('Failed to load employee'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const preview = useMemo(() => calcPreview(form), [form]);

  const openAddMonth = () => {
    setEditingRecord(null);
    setForm(
      toMonthForm(null, employee?.salary_amount, employee?.advance_balance || 0, employee?.owed_balance || 0)
    );
    setShowModal(true);
  };

  const openEditMonth = (record) => {
    setEditingRecord(record);
    setForm(toMonthForm(record));
    setShowModal(true);
  };

  const applyFullAdvanceDeduction = () => {
    const balance = employee?.advance_balance || 0;
    const salary = num(form.salary_amount);
    const deduct = Math.min(balance, salary);
    const next = {
      ...form,
      advance_deducted: deduct > 0 ? String(deduct) : '',
    };
    setForm({ ...next, amount_paid: suggestAmountPaid(next) });
  };

  const applyFullOwedSettlement = () => {
    const balance = employee?.owed_balance || 0;
    const next = { ...form, owed_settled: balance > 0 ? String(balance) : '' };
    setForm({ ...next, amount_paid: suggestAmountPaid(next) });
  };

  const updateForm = (patch) => {
    const next = { ...form, ...patch };
    if (patch.payment_status === 'paid' || patch.salary_amount !== undefined
      || patch.advance_deducted !== undefined || patch.owed_settled !== undefined) {
      if (next.payment_status === 'paid' && (next.amount_paid === '' || patch.advance_deducted !== undefined
        || patch.owed_settled !== undefined || patch.salary_amount !== undefined)) {
        next.amount_paid = suggestAmountPaid(next);
      }
    }
    setForm(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.month_year) {
      toast.error('Select a month');
      return;
    }
    const payload = {
      month_year: form.month_year,
      salary_amount: num(form.salary_amount),
      advance_deducted: num(form.advance_deducted),
      owed_settled: num(form.owed_settled),
      payment_status: form.payment_status,
      notes: form.notes || null,
    };
    if (form.payment_status === 'paid') {
      payload.amount_paid =
        form.amount_paid !== '' && form.amount_paid != null
          ? num(form.amount_paid)
          : preview.totalDue;
    }
    try {
      if (editingRecord) {
        await updateMonthlySalary(id, editingRecord.id, payload);
        toast.success('Month updated');
      } else {
        await createMonthlySalary(id, payload);
        toast.success('Month added');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDeleteMonth = async (record) => {
    if (!confirm(`Delete salary record for ${record.month_label}?`)) return;
    try {
      await deleteMonthlySalary(id, record.id);
      toast.success('Month deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!employee) return <p>Employee not found</p>;

  const records = employee.monthly_records || [];
  const advanceBalance = employee.advance_balance || 0;
  const owedBalance = employee.owed_balance || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <Link to="/salary" className="text-sm text-primary-800 dark:text-gold-400 hover:underline flex items-center gap-1 mb-2">
            <ArrowLeft size={16} /> Back to employees
          </Link>
          <h1 className="text-2xl font-bold">{employee.name}</h1>
          <p className="text-gray-500">
            {employee.employee_number || `ID #${employee.id}`} · Default salary {formatCurrency(employee.salary_amount)}/month
          </p>
        </div>
        <button onClick={openAddMonth} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={18} /> Add Month
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {advanceBalance > 0 && (
          <div className="card border-amber-300 dark:border-amber-600/50 bg-amber-50 dark:bg-amber-950/30">
            <p className="font-semibold text-amber-900 dark:text-amber-200">Extra paid earlier (deduct from salary)</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{formatCurrency(advanceBalance)}</p>
            <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-1">
              They received more than salary before — subtract from a future month.
            </p>
          </div>
        )}
        {owedBalance > 0 && (
          <div className="card border-blue-300 dark:border-blue-600/50 bg-blue-50 dark:bg-blue-950/30">
            <p className="font-semibold text-blue-900 dark:text-blue-200">Still owed to employee</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{formatCurrency(owedBalance)}</p>
            <p className="text-sm text-blue-800/80 dark:text-blue-300/80 mt-1">
              Paid less than due before — add to a future month when you pay them back.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Months recorded</p>
          <p className="text-xl font-bold">{records.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Advance to recover</p>
          <p className={`text-xl font-bold ${advanceBalance > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {formatCurrency(advanceBalance)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Balance still owed</p>
          <p className={`text-xl font-bold ${owedBalance > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            {formatCurrency(owedBalance)}
          </p>
        </div>
      </div>

      <div className="card text-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div><span className="text-gray-500">Address:</span> {employee.address || '—'}</div>
        <div><span className="text-gray-500">Father:</span> {employee.father_name || '—'}</div>
        <div><span className="text-gray-500">Tazkira:</span> {employee.tazkira_no || '—'}</div>
        <div><span className="text-gray-500">Residence:</span> {employee.residence || '—'}</div>
        <div><span className="text-gray-500">Started:</span> {employee.start_date ? formatDate(employee.start_date) : '—'}</div>
        <div><span className="text-gray-500">Ended:</span> {employee.end_date ? formatDate(employee.end_date) : '—'}</div>
      </div>

      <div className="table-container card p-0 overflow-x-auto">
        <table className="data-table min-w-[1000px]">
          <thead>
            <tr>
              <th>Month</th>
              <th>Salary</th>
              <th>Advance −</th>
              <th>Prev. balance +</th>
              <th>Total due</th>
              <th>Cash paid</th>
              <th>Extra / Still owed</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-gray-500 py-8">
                  No monthly records yet. Click &quot;Add Month&quot; to get started.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.month_label}</td>
                  <td>{formatCurrency(r.salary_amount)}</td>
                  <td className={r.advance_deducted > 0 ? 'text-amber-600' : ''}>
                    {r.advance_deducted > 0 ? formatCurrency(r.advance_deducted) : '—'}
                  </td>
                  <td className={r.owed_settled > 0 ? 'text-blue-600' : ''}>
                    {r.owed_settled > 0 ? formatCurrency(r.owed_settled) : '—'}
                  </td>
                  <td className="font-medium">{formatCurrency(r.total_due)}</td>
                  <td>{r.amount_paid != null ? formatCurrency(r.amount_paid) : '—'}</td>
                  <td>
                    {r.advance_given > 0 && (
                      <span className="text-amber-600 text-sm">+{formatCurrency(r.advance_given)} extra</span>
                    )}
                    {r.shortfall > 0 && (
                      <span className="text-blue-600 text-sm block">−{formatCurrency(r.shortfall)} owed</span>
                    )}
                    {r.advance_given === 0 && r.shortfall === 0 && '—'}
                  </td>
                  <td>{statusBadge(r.payment_status)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openEditMonth(r)} className="text-primary-800 dark:text-gold-400 p-1" title="Edit">
                        <Pencil size={16} />
                      </button>
                      {isAdmin && (
                        <button type="button" onClick={() => handleDeleteMonth(r)} className="text-red-600 p-1" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="card w-full max-w-lg space-y-4 my-4">
            <h3 className="font-semibold text-lg">
              {editingRecord ? `Edit — ${editingRecord.month_label}` : 'Add Monthly Salary'}
            </h3>

            {!editingRecord && (advanceBalance > 0 || owedBalance > 0) && (
              <div className="space-y-2 text-sm">
                {advanceBalance > 0 && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 p-3">
                    <p className="font-medium text-amber-900 dark:text-amber-200">
                      Recover advance: {formatCurrency(advanceBalance)}
                    </p>
                    <button type="button" onClick={applyFullAdvanceDeduction} className="mt-1 text-primary-800 dark:text-gold-400 hover:underline">
                      Deduct full advance from this month
                    </button>
                  </div>
                )}
                {owedBalance > 0 && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-700/50 p-3">
                    <p className="font-medium text-blue-900 dark:text-blue-200">
                      Pay previous balance: {formatCurrency(owedBalance)}
                    </p>
                    <button type="button" onClick={applyFullOwedSettlement} className="mt-1 text-primary-800 dark:text-gold-400 hover:underline">
                      Add full previous balance to this month
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Month *</label>
              <input
                type="month"
                className="input-field"
                value={form.month_year}
                onChange={(e) => updateForm({ month_year: e.target.value })}
                required
                disabled={!!editingRecord}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Monthly salary (AFN)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={form.salary_amount}
                onChange={(e) => updateForm({ salary_amount: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deduct earlier advance (AFN)</label>
              <p className="text-xs text-gray-500 mb-1">If they were paid extra before (e.g. 5,000)</p>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                placeholder="0"
                value={form.advance_deducted}
                onChange={(e) => updateForm({ advance_deducted: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pay previous balance (AFN)</label>
              <p className="text-xs text-gray-500 mb-1">If they were paid less before (e.g. still owe 3,000)</p>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                placeholder="0"
                value={form.owed_settled}
                onChange={(e) => updateForm({ owed_settled: e.target.value })}
              />
            </div>

            <div className="rounded-lg bg-gray-50 dark:bg-primary-800/50 p-3 text-sm space-y-1">
              <p>
                <span className="text-gray-500">This month&apos;s salary:</span>{' '}
                <strong>{formatCurrency(preview.netPayable)}</strong>
              </p>
              {preview.owedSettled > 0 && (
                <p>
                  <span className="text-gray-500">+ Previous balance:</span>{' '}
                  <strong className="text-blue-600">{formatCurrency(preview.owedSettled)}</strong>
                </p>
              )}
              <p>
                <span className="text-gray-500">Total to pay:</span>{' '}
                <strong>{formatCurrency(preview.totalDue)}</strong>
              </p>
              {preview.advanceGiven > 0 && (
                <p className="text-amber-700 dark:text-amber-300">
                  Will record extra advance: <strong>{formatCurrency(preview.advanceGiven)}</strong>
                </p>
              )}
              {preview.shortfall > 0 && (
                <p className="text-blue-700 dark:text-blue-300">
                  Will still owe employee: <strong>{formatCurrency(preview.shortfall)}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="input-field"
                value={form.payment_status}
                onChange={(e) => updateForm({ payment_status: e.target.value })}
              >
                <option value="paid">Paid</option>
                <option value="not_paid">Not Paid</option>
              </select>
            </div>

            {form.payment_status === 'paid' && (
              <div>
                <label className="block text-sm font-medium mb-1">Cash paid this month (AFN)</label>
                <p className="text-xs text-gray-500 mb-1">
                  Usually same as total to pay ({formatCurrency(preview.totalDue)}). Enter less if partial pay, or more if urgent extra.
                </p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder={String(preview.totalDue)}
                  value={form.amount_paid}
                  onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <input
                className="input-field"
                placeholder="e.g. Urgent family expense..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">
                {editingRecord ? 'Save Changes' : 'Add Month'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

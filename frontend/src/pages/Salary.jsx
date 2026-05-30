import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSalaries, createSalary, updateSalary, deleteSalary } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { translateApiMessage } from '../utils/translateApi';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { formatCurrency, formatDate } from '../utils/format';

const emptyForm = {
  employee_number: '',
  name: '',
  address: '',
  father_name: '',
  tazkira_no: '',
  residence: '',
  start_date: '',
  end_date: '',
  salary_amount: '',
};

function toForm(emp) {
  if (!emp) return { ...emptyForm };
  return {
    employee_number: emp.employee_number || '',
    name: emp.name || '',
    address: emp.address || '',
    father_name: emp.father_name || '',
    tazkira_no: emp.tazkira_no || '',
    residence: emp.residence || '',
    start_date: emp.start_date ? emp.start_date.slice(0, 10) : '',
    end_date: emp.end_date ? emp.end_date.slice(0, 10) : '',
    salary_amount: emp.salary_amount ?? '',
  };
}

function statusBadge(status, t) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded ${
        status === 'paid'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
      }`}
    >
      {status === 'paid' ? t('common.paid') : t('salary.notPaid')}
    </span>
  );
}

export default function Salary() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getSalaries({ search, page, limit: 50 });
      setEmployees(data.data);
      setPagination({ page: data.pagination.page, total: data.pagination.total, limit: 50 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm(toForm(emp));
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('salary.nameRequiredToast'));
      return;
    }
    const payload = {
      ...form,
      salary_amount: parseFloat(form.salary_amount) || 0,
      end_date: form.end_date || null,
      start_date: form.start_date || null,
    };
    try {
      if (editing) {
        await updateSalary(editing.id, payload);
        toast.success(t('salary.employeeUpdated'));
      } else {
        await createSalary(payload);
        toast.success(t('salary.employeeAdded'));
      }
      setShowModal(false);
      load(pagination.page);
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('salary.saveFailed'));
    }
  };

  const handleDelete = async (emp) => {
    if (!confirm(t('salary.removeConfirm', { name: emp.name }))) return;
    try {
      await deleteSalary(emp.id);
      toast.success(t('salary.employeeRemoved'));
      load(pagination.page);
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('salary.deleteFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('salary.title')}</h1>
          <p className="text-gray-500">
            {t('salary.subtitle')}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus size={18} /> {t('salary.addEmployee')}
        </button>
      </div>

      <div className="flex gap-3">
        <input
          className="input-field max-w-sm"
          placeholder={t('salary.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <button onClick={() => load()} className="btn-primary">
          <Search size={16} />
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="table-container card p-0 overflow-x-auto">
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th>{t('salary.idNum')}</th>
                  <th>{t('common.name')}</th>
                  <th>{t('salary.defaultSalary')}</th>
                  <th>{t('salary.startDate')}</th>
                  <th>{t('salary.monthsRecorded')}</th>
                  <th>{t('salary.advanceRecover')}</th>
                  <th>{t('salary.stillOwed')}</th>
                  <th>{t('salary.latestStatus')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-gray-500 py-8">
                      {t('salary.noEmployees')}
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="font-mono text-sm">{emp.employee_number || `#${emp.id}`}</td>
                      <td className="font-medium">{emp.name}</td>
                      <td>{formatCurrency(emp.salary_amount)}</td>
                      <td>{emp.start_date ? formatDate(emp.start_date) : '—'}</td>
                      <td>{emp.month_count || 0}</td>
                      <td className={emp.advance_balance > 0 ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                        {formatCurrency(emp.advance_balance || 0)}
                      </td>
                      <td className={emp.owed_balance > 0 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
                        {formatCurrency(emp.owed_balance || 0)}
                      </td>
                      <td>{statusBadge(emp.latest_status, t)}</td>
                      <td>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/salary/${emp.id}`}
                            className="text-primary-800 dark:text-gold-400 hover:underline text-sm font-medium flex items-center gap-1"
                          >
                            <Calendar size={14} /> {t('salary.monthlySalary')}
                          </Link>
                          <button
                            type="button"
                            onClick={() => openEdit(emp)}
                            className="text-primary-800 dark:text-gold-400 hover:opacity-80 p-1"
                            title={t('salary.editProfile')}
                          >
                            <Pencil size={16} />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(emp)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title={t('common.remove')}
                            >
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
          <Pagination {...pagination} onPageChange={load} />
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="card w-full max-w-2xl space-y-4 my-4">
            <h3 className="font-semibold text-lg">
              {editing ? t('salary.editEmployee') : t('salary.addEmployee')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('salary.profileHint')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('salary.idNum')}</label>
                <input
                  className="input-field"
                  placeholder={t('salary.empIdPlaceholder')}
                  value={form.employee_number}
                  onChange={(e) => setForm({ ...form, employee_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('salary.nameRequired')}</label>
                <input
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">{t('common.address')}</label>
                <input
                  className="input-field"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('salary.fatherName')}</label>
                <input
                  className="input-field"
                  value={form.father_name}
                  onChange={(e) => setForm({ ...form, father_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('salary.tazkira')}</label>
                <input
                  className="input-field"
                  value={form.tazkira_no}
                  onChange={(e) => setForm({ ...form, tazkira_no: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('salary.residence')}</label>
                <input
                  className="input-field"
                  value={form.residence}
                  onChange={(e) => setForm({ ...form, residence: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('salary.defaultSalaryAfn')}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={form.salary_amount}
                  onChange={(e) => setForm({ ...form, salary_amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('salary.startDate')}</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('salary.endingDate')}</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary flex-1">
                {editing ? t('salary.saveChanges') : t('salary.addEmployee')}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

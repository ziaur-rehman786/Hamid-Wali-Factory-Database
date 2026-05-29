import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getDesigns, createDesign, deleteDesign,
  getColors, createColor, deleteColor,
  getSizes, createSize, deleteSize,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MasterData() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('designs');
  const [designs, setDesigns] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    const [d, c, s] = await Promise.all([getDesigns(), getColors(), getSizes()]);
    setDesigns(d.data);
    setColors(c.data);
    setSizes(s.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error('Admin only');
    try {
      if (tab === 'designs') await createDesign({ art_number: form.art_number, name: form.name });
      if (tab === 'colors') await createColor({ name: form.name });
      if (tab === 'sizes') await createSize({ size_value: form.size_value });
      toast.success('Added');
      setForm({});
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this item?')) return;
    try {
      if (tab === 'designs') await deleteDesign(id);
      if (tab === 'colors') await deleteColor(id);
      if (tab === 'sizes') await deleteSize(id);
      toast.success('Removed');
      load();
    } catch (err) {
      toast.error('Failed');
    }
  };

  const items = tab === 'designs' ? designs : tab === 'colors' ? colors : sizes;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Designs, Colors & Sizes</h1>

      <div className="flex gap-2">
        {['designs', 'colors', 'sizes'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg capitalize ${tab === t ? 'bg-gold-500 text-primary-900 font-semibold' : 'bg-primary-50 text-primary-800 dark:bg-primary-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {isAdmin && (
        <form onSubmit={handleAdd} className="card flex flex-wrap gap-3 items-end">
          {tab === 'designs' && (
            <>
              <input className="input-field max-w-xs" placeholder="Art Number (e.g. Art No A-19)" value={form.art_number || ''} onChange={(e) => setForm({ ...form, art_number: e.target.value })} required />
              <input className="input-field max-w-xs" placeholder="Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </>
          )}
          {tab === 'colors' && (
            <input className="input-field max-w-xs" placeholder="Color name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          )}
          {tab === 'sizes' && (
            <input className="input-field max-w-xs" placeholder="Size (e.g. 43)" value={form.size_value || ''} onChange={(e) => setForm({ ...form, size_value: e.target.value })} required />
          )}
          <button type="submit" className="btn-primary flex items-center gap-1"><Plus size={16} /> Add</button>
        </form>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="table-container card p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {tab === 'designs' && <><th>Art Number</th><th>Name</th></>}
                {tab === 'colors' && <th>Color</th>}
                {tab === 'sizes' && <th>Size</th>}
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  {tab === 'designs' && <><td className="font-medium">{item.art_number}</td><td>{item.name}</td></>}
                  {tab === 'colors' && <td>{item.name}</td>}
                  {tab === 'sizes' && <td>{item.size_value}</td>}
                  {isAdmin && (
                    <td>
                      <button onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 size={16} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

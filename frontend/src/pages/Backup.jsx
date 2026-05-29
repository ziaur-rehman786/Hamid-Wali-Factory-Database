import { useEffect, useState } from 'react';
import { Database, Download, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { createBackup, listBackups, restoreBackup, getBackupStatus } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Backup() {
  const [backups, setBackups] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    Promise.all([listBackups(), getBackupStatus()])
      .then(([b, s]) => {
        setBackups(b.data);
        setStatus(s.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await createBackup();
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Backup failed. Install PostgreSQL tools (pg_dump).');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (filename) => {
    if (!confirm(`Restore database from ${filename}? This will overwrite current data.`)) return;
    try {
      await restoreBackup(filename);
      toast.success('Database restored');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restore failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Backup & Restore</h1>
          <p className="text-gray-500">Manage database backups</p>
        </div>
        <button onClick={handleCreate} disabled={creating} className="btn-primary flex items-center gap-2">
          <Database size={18} /> {creating ? 'Creating...' : 'Create Backup'}
        </button>
      </div>

      <div className={`card ${status?.toolsAvailable ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200'}`}>
        <p className="text-sm font-medium">
          {status?.toolsAvailable ? '✓ Backup tools ready' : '⚠ Backup tools not detected'}
        </p>
        <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
          {status?.toolsAvailable
            ? `Using: ${status.pgBin} — files saved to backend/backups/`
            : 'Install PostgreSQL or set PG_BIN in backend/.env (e.g. C:\\Program Files\\PostgreSQL\\16\\bin)'}
        </p>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="table-container card p-0">
          <table className="data-table">
            <thead>
              <tr><th>Filename</th><th>Size</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-gray-500 py-8">No backups yet</td></tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.name}>
                    <td>{b.name}</td>
                    <td>{(b.size / 1024).toFixed(1)} KB</td>
                    <td>{new Date(b.created).toLocaleString()}</td>
                    <td className="flex gap-2">
                      <button onClick={() => handleRestore(b.name)} className="text-amber-600 flex items-center gap-1 text-sm">
                        <RotateCcw size={14} /> Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

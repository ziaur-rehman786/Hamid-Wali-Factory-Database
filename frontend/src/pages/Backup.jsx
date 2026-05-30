import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { createBackup, listBackups, restoreBackup, getBackupStatus } from '../services/api';
import { translateApiMessage } from '../utils/translateApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Backup() {
  const { t } = useTranslation();
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
      toast.success(translateApiMessage(data.message, t));
      load();
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('backup.backupFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (filename) => {
    if (!confirm(t('backup.restoreConfirm', { filename }))) return;
    try {
      await restoreBackup(filename);
      toast.success(t('backup.restored'));
    } catch (err) {
      toast.error(translateApiMessage(err.response?.data?.message, t) || t('backup.restoreFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('backup.title')}</h1>
          <p className="text-gray-500">{t('backup.subtitle')}</p>
        </div>
        <button onClick={handleCreate} disabled={creating} className="btn-primary flex items-center gap-2">
          <Database size={18} /> {creating ? t('backup.creating') : t('backup.createBackup')}
        </button>
      </div>

      <div className={`card ${status?.toolsAvailable ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200'}`}>
        <p className="text-sm font-medium">
          {status?.toolsAvailable ? t('backup.toolsReady') : t('backup.toolsMissing')}
        </p>
        <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
          {status?.toolsAvailable
            ? t('backup.usingPath', { path: status.pgBin })
            : t('backup.installPg')}
        </p>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="table-container card p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('backup.filename')}</th>
                <th>{t('backup.size')}</th>
                <th>{t('backup.created')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-gray-500 py-8">{t('backup.noBackups')}</td></tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.name}>
                    <td>{b.name}</td>
                    <td>{(b.size / 1024).toFixed(1)} KB</td>
                    <td>{new Date(b.created).toLocaleString()}</td>
                    <td className="flex gap-2">
                      <button onClick={() => handleRestore(b.name)} className="text-amber-600 flex items-center gap-1 text-sm">
                        <RotateCcw size={14} /> {t('backup.restore')}
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

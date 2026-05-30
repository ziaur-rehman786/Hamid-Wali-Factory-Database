import { useTranslation } from 'react-i18next';

export default function Pagination({ page, total, limit, onPageChange }) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500">
        {t('common.pageOf', { page, totalPages, total })}
      </p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn-secondary text-sm disabled:opacity-50"
        >
          {t('common.previous')}
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn-secondary text-sm disabled:opacity-50"
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}

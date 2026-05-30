/** Server-side messages — locale from Accept-Language: en | ps */
const messages = {
  en: {
    invalidCredentials: 'Invalid credentials',
    unauthorized: 'Unauthorized',
    adminOnly: 'Admin only',
    notFound: 'Not found',
    invoiceNotFound: 'Invoice not found',
    invoiceCreated: 'Invoice created successfully',
    invoiceDeleted: 'Invoice deleted and stock restored',
    adminOnlyDelete: 'Only admin can delete invoices',
    customerItemsRequired: 'Customer and items are required',
    deleted: 'Deleted successfully',
    cannotDeleteReferenced: 'Cannot delete - referenced by invoices',
    duplicateStock: 'This design/color/size combination already exists',
    backupCreated: 'Backup created',
    backupFailed: 'Backup failed',
    restoreSuccess: 'Database restored successfully',
    restoreFailed: 'Restore failed',
    backupNotFound: 'Backup file not found',
    psqlNotFound: 'psql not found. Set PG_BIN in backend/.env',
    settingsSaved: 'Settings saved',
    internalError: 'Internal server error',
    apiNotFound: 'API route not found',
  },
  ps: {
    invalidCredentials: 'ناسم ننوتل',
    unauthorized: 'اجازه نشته',
    adminOnly: 'یوازې اډمین',
    notFound: 'و نه موندل شو',
    invoiceNotFound: 'بل و نه موندل شو',
    invoiceCreated: 'بل په بریالیتوب جوړ شو',
    invoiceDeleted: 'بل ړنګ شو او ذخیره بیرته راګرځېدله',
    adminOnlyDelete: 'یوازې اډمین بل ړنګولای شي',
    customerItemsRequired: 'پیرودونکی او توکي اړین دي',
    deleted: 'په بریالیتوب ړنګ شو',
    cannotDeleteReferenced: 'نشي ړنګېدای — په بلونو کې کارېږي',
    duplicateStock: 'دا ډیزاین/رنګ/سایز مخکې شته',
    backupCreated: 'بیک اپ جوړ شو',
    backupFailed: 'بیک اپ ناکام شو',
    restoreSuccess: 'ډیټابیس بیرته راګرځېد',
    restoreFailed: 'بیرته راګرځول ناکام شو',
    backupNotFound: 'بیک اپ فایل و نه موندل شو',
    psqlNotFound: 'psql و نه موندل شو. PG_BIN په backend/.env کې',
    settingsSaved: 'تنظیمات خوندي شول',
    internalError: 'داخلي ستونزه',
    apiNotFound: 'API لاره و نه موندل شوه',
  },
};

export function getLocale(req) {
  const header = (req.headers['accept-language'] || '').toLowerCase();
  return header.startsWith('ps') ? 'ps' : 'en';
}

export function msg(req, key) {
  const locale = getLocale(req);
  return messages[locale][key] || messages.en[key] || key;
}

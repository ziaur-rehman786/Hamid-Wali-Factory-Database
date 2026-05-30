/** Map known English API messages to i18n keys */
const API_MESSAGE_MAP = {
  'Invoice not found': 'api.invoiceNotFound',
  'Invoice created successfully': 'api.invoiceCreated',
  'Invoice deleted and stock restored': 'api.invoiceDeleted',
  'Only admin can delete invoices': 'api.adminOnlyDelete',
  'Customer and items are required': 'api.customerItemsRequired',
  'Not found': 'api.notFound',
  'Deleted successfully': 'api.deleted',
  'Cannot delete - referenced by invoices': 'api.cannotDeleteReferenced',
  'This design/color/size combination already exists': 'api.duplicateStock',
  'Admin only': 'api.adminOnly',
  'Backup created': 'api.backupCreated',
  'Backup failed': 'api.backupFailed',
  'Database restored successfully': 'api.restoreSuccess',
  'Restore failed': 'api.restoreFailed',
  'Backup file not found': 'api.backupNotFound',
  'psql not found. Set PG_BIN in backend/.env': 'api.psqlNotFound',
  'Settings saved': 'api.settingsSaved',
  'Settings updated': 'api.settingsSaved',
  'Invalid credentials': 'api.invalidCredentials',
  'Unauthorized': 'api.unauthorized',
};

export function translateApiMessage(message, t) {
  if (!message || typeof message !== 'string') return t('common.failed');
  const key = API_MESSAGE_MAP[message.trim()];
  return key ? t(key) : message;
}

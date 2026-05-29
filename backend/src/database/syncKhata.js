import { syncCustomerKhata } from '../utils/syncCustomerKhata.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Syncing all customer khata balances from invoices & payments...\n');

syncCustomerKhata()
  .then(() => {
    console.log('Done. Dashboard Pending Payments should match open invoices now.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
  });

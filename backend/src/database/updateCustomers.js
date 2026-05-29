import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const CUSTOMERS = [
  { name: 'Khalid Mandi', phone: '', address: '' },
  { name: 'Molvi Darwesh Ustaad e Qasmiya', phone: '', address: '' },
  { name: 'Molvi Haroon Factory', phone: '', address: '' },
  { name: 'Shafiullah Factory', phone: '', address: '' },
  { name: 'Wali Jan Factory', phone: '', address: '' },
];

const OLD_DUMMY_NAMES = [
  'Ahmad Traders',
  'Karachi Footwear',
  'Lahore Shoes Mart',
  'Islamabad Retail',
  'Quetta Wholesale',
];

async function updateCustomers() {
  try {
    console.log('Updating customers...\n');

    for (const name of OLD_DUMMY_NAMES) {
      await query(
        `UPDATE customers SET is_active = false, updated_at = NOW() WHERE name = $1`,
        [name]
      );
    }
    console.log('Deactivated old sample customers.');

    for (const c of CUSTOMERS) {
      const exists = await query('SELECT id FROM customers WHERE name = $1', [c.name]);
      if (!exists.rows.length) {
        await query(
          'INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3)',
          [c.name, c.phone, c.address]
        );
        console.log(`  Added: ${c.name}`);
      } else {
        await query(
          'UPDATE customers SET is_active = true, updated_at = NOW() WHERE name = $1',
          [c.name]
        );
        console.log(`  Active: ${c.name}`);
      }
    }

    const active = await query(
      'SELECT name FROM customers WHERE is_active = true ORDER BY name'
    );
    console.log('\nActive customers:');
    active.rows.forEach((r) => console.log(`  - ${r.name}`));
    console.log('\nDone.');
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

updateCustomers();

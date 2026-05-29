import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../database/migrations/add_cartons_to_invoice_items.sql'),
    'utf8'
  );
  await query(sql);
  await query(
    `INSERT INTO factory_settings (setting_key, setting_value) VALUES ('pairs_per_carton', '8')
     ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`
  );
  console.log('Cartons column added. pairs_per_carton = 8');
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

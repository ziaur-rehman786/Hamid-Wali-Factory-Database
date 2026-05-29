import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const DESIGNS = Array.from({ length: 18 }, (_, i) => ({
  art_number: `Art No A-${i + 1}`,
  name: `Design A-${i + 1}`,
}));

const COLORS = ['Black', 'Brown', 'Grey', 'Khaki'];
const SIZES = ['39', '40', '41', '42'];

async function seed() {
  try {
    console.log('Seeding database...\n');

    const adminHash = await bcrypt.hash('admin123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);

    await query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ('admin', $1, 'Factory Admin', 'admin'),
              ('staff', $2, 'Factory Staff', 'staff')
       ON CONFLICT (username) DO NOTHING`,
      [adminHash, staffHash]
    );

    for (const d of DESIGNS) {
      await query(
        `INSERT INTO product_designs (art_number, name) VALUES ($1, $2)
         ON CONFLICT (art_number) DO NOTHING`,
        [d.art_number, d.name]
      );
    }

    for (const c of COLORS) {
      await query(
        `INSERT INTO colors (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [c]
      );
    }

    for (const s of SIZES) {
      await query(
        `INSERT INTO sizes (size_value) VALUES ($1) ON CONFLICT (size_value) DO NOTHING`,
        [s]
      );
    }

    const designs = (await query('SELECT id FROM product_designs ORDER BY id')).rows;
    const colors = (await query('SELECT id FROM colors ORDER BY id')).rows;
    const sizes = (await query('SELECT id FROM sizes ORDER BY id')).rows;

    const totalCombinations = designs.length * colors.length * sizes.length;
    const baseQty = Math.floor(17080 / totalCombinations);
    let remainder = 17080 - baseQty * totalCombinations;

    const costPrices = [800, 850, 900, 950, 1000];
    const salePrices = [1200, 1300, 1400, 1500, 1600];

    let comboIndex = 0;
    for (const design of designs) {
      for (const color of colors) {
        for (const size of sizes) {
          let qty = baseQty;
          if (remainder > 0) {
            qty += 1;
            remainder -= 1;
          }
          const cost = costPrices[comboIndex % costPrices.length];
          const sale = salePrices[comboIndex % salePrices.length];
          comboIndex++;

          await query(
            `INSERT INTO inventory (design_id, color_id, size_id, quantity, cost_price, sale_price, low_stock_threshold)
             VALUES ($1, $2, $3, $4, $5, $6, 10)
             ON CONFLICT (design_id, color_id, size_id)
             DO UPDATE SET quantity = EXCLUDED.quantity, cost_price = EXCLUDED.cost_price, sale_price = EXCLUDED.sale_price`,
            [design.id, color.id, size.id, qty, cost, sale]
          );
        }
      }
    }

    const stockTotal = (await query('SELECT COALESCE(SUM(quantity), 0) as total FROM inventory')).rows[0].total;
    console.log(`Total stock seeded: ${stockTotal} pairs`);

    const customers = [
      { name: 'Khalid Mandi', phone: '', address: '' },
      { name: 'Molvi Darwesh Ustaad e Qasmiya', phone: '', address: '' },
      { name: 'Molvi Haroon Factory', phone: '', address: '' },
      { name: 'Shafiullah Factory', phone: '', address: '' },
      { name: 'Wali Jan Factory', phone: '', address: '' },
    ];

    for (const c of customers) {
      const exists = await query('SELECT id FROM customers WHERE name = $1', [c.name]);
      if (!exists.rows.length) {
        await query('INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3)', [
          c.name,
          c.phone,
          c.address,
        ]);
      }
    }

    const settings = [
      ['factory_name', 'Hamid Wali Shoe Factory'],
      ['factory_phone', '+92-300-1234567, +92-333-7654321'],
      ['factory_email', 'info@hamidwalishoefactory.com'],
      ['factory_address', 'Industrial Area, Peshawar, Khyber Pakhtunkhwa, Pakistan'],
      ['factory_logo', '/logo.png?v=2'],
      ['currency_code', 'AFN'],
      ['pairs_per_carton', '8'],
      ['invoice_prefix', 'HW'],
      ['low_stock_alert', '10'],
    ];

    for (const [key, value] of settings) {
      await query(
        `INSERT INTO factory_settings (setting_key, setting_value) VALUES ($1, $2)
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`,
        [key, value]
      );
    }

    await query(`
      CREATE TABLE IF NOT EXISTS employee_salaries (
        id SERIAL PRIMARY KEY,
        employee_number VARCHAR(20),
        name VARCHAR(150) NOT NULL,
        address TEXT,
        father_name VARCHAR(150),
        tazkira_no VARCHAR(50),
        residence VARCHAR(150),
        start_date DATE,
        end_date DATE,
        salary_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS salary_monthly_records (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employee_salaries(id) ON DELETE CASCADE,
        salary_year INTEGER NOT NULL,
        salary_month INTEGER NOT NULL CHECK (salary_month BETWEEN 1 AND 12),
        salary_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
        amount_paid DECIMAL(14, 2),
        advance_deducted DECIMAL(14, 2) NOT NULL DEFAULT 0,
        payment_status VARCHAR(20) NOT NULL DEFAULT 'not_paid' CHECK (payment_status IN ('paid', 'not_paid')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, salary_year, salary_month)
      )
    `);

    await query(`ALTER TABLE salary_monthly_records ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(14, 2)`);
    await query(
      `ALTER TABLE salary_monthly_records ADD COLUMN IF NOT EXISTS advance_deducted DECIMAL(14, 2) NOT NULL DEFAULT 0`
    );
    await query(
      `ALTER TABLE salary_monthly_records ADD COLUMN IF NOT EXISTS owed_settled DECIMAL(14, 2) NOT NULL DEFAULT 0`
    );

    const employees = [
      {
        employee_number: 'EMP-001',
        name: 'Zia Ur Rehman',
        start_date: '2026-05-19',
        salary_amount: 12000,
        first_month: { year: 2026, month: 5 },
      },
      {
        employee_number: 'EMP-002',
        name: 'Ateeq',
        start_date: '2026-05-01',
        salary_amount: 0,
        first_month: { year: 2026, month: 5 },
      },
    ];

    for (const emp of employees) {
      let employeeId;
      const exists = await query('SELECT id FROM employee_salaries WHERE name = $1 AND is_active = true', [
        emp.name,
      ]);
      if (!exists.rows.length) {
        const inserted = await query(
          `INSERT INTO employee_salaries (
            employee_number, name, address, father_name, tazkira_no, residence,
            start_date, end_date, salary_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
          [
            emp.employee_number,
            emp.name,
            emp.address || null,
            emp.father_name || null,
            emp.tazkira_no || null,
            emp.residence || null,
            emp.start_date,
            emp.end_date || null,
            emp.salary_amount,
          ]
        );
        employeeId = inserted.rows[0].id;
      } else {
        employeeId = exists.rows[0].id;
      }

      const monthExists = await query(
        'SELECT id FROM salary_monthly_records WHERE employee_id = $1 AND salary_year = $2 AND salary_month = $3',
        [employeeId, emp.first_month.year, emp.first_month.month]
      );
      if (!monthExists.rows.length) {
        await query(
          `INSERT INTO salary_monthly_records (employee_id, salary_year, salary_month, salary_amount, payment_status)
           VALUES ($1, $2, $3, $4, 'not_paid')`,
          [employeeId, emp.first_month.year, emp.first_month.month, emp.salary_amount]
        );
      }
    }

    // Migrate legacy single-row payment_status into first month if monthly table was empty
    const legacyEmployees = await query(
      `SELECT id, start_date, salary_amount FROM employee_salaries WHERE is_active = true`
    );
    for (const row of legacyEmployees.rows) {
      const hasMonth = await query(
        'SELECT 1 FROM salary_monthly_records WHERE employee_id = $1 LIMIT 1',
        [row.id]
      );
      if (hasMonth.rows.length) continue;
      const d = row.start_date ? new Date(row.start_date) : new Date();
      await query(
        `INSERT INTO salary_monthly_records (employee_id, salary_year, salary_month, salary_amount, payment_status)
         VALUES ($1, $2, $3, $4, 'not_paid') ON CONFLICT DO NOTHING`,
        [row.id, d.getFullYear(), d.getMonth() + 1, row.salary_amount || 0]
      );
    }

    const rozCount = (await query('SELECT COUNT(*) FROM roznamcha')).rows[0].count;
    if (parseInt(rozCount) === 0) {
      await query(
        `INSERT INTO roznamcha (entry_date, details, income, expense, balance)
         VALUES (CURRENT_DATE, 'Opening Balance', 0, 0, 0)`
      );
    }

    console.log('\nSeed completed!');
    console.log('App Login - Admin: admin / admin123');
    console.log('App Login - Staff: staff / staff123');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

seed();

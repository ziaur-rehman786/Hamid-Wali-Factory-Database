import { query } from '../config/database.js';
import { syncCustomerKhata } from '../utils/syncCustomerKhata.js';

export const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT c.* FROM customers c WHERE c.is_active = true';
    const params = [];
    let idx = 1;

    if (search) {
      sql += ` AND (name ILIKE $${idx} OR phone ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) sub`, params);
    const total = parseInt(countResult.rows[0].count);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` ORDER BY name LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);
    res.json({ data: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (!customer.rows.length) return res.status(404).json({ message: 'Customer not found' });

    const invoices = await query(
      `SELECT id, invoice_number, invoice_date, grand_total, paid_amount, remaining_amount, created_at
       FROM invoices WHERE customer_id = $1 ORDER BY invoice_date DESC`,
      [req.params.id]
    );

    const payments = await query(
      `SELECT p.*, inv.invoice_number
       FROM payments p
       LEFT JOIN invoices inv ON p.invoice_id = inv.id
       WHERE p.customer_id = $1 ORDER BY p.payment_date DESC`,
      [req.params.id]
    );

    res.json({
      ...customer.rows[0],
      invoices: invoices.rows,
      payments: payments.rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;
    const result = await query(
      `INSERT INTO customers (name, phone, address, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, phone, address, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { name, phone, address, notes, is_active } = req.body;
    const result = await query(
      `UPDATE customers SET name = COALESCE($1, name), phone = COALESCE($2, phone),
        address = COALESCE($3, address), notes = COALESCE($4, notes),
        is_active = COALESCE($5, is_active), updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, phone, address, notes, is_active, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    await query('UPDATE customers SET is_active = false, updated_at = NOW() WHERE id = $1', [
      req.params.id,
    ]);
    res.json({ message: 'Customer deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addPayment = async (req, res) => {
  const client = await (await import('../config/database.js')).getClient();
  try {
    const { amount, payment_date, payment_method, notes, invoice_id } = req.body;
    const customerId = req.params.id;

    const customer = await query('SELECT remaining_balance FROM customers WHERE id = $1', [customerId]);
    const remaining = parseFloat(customer.rows[0]?.remaining_balance || 0);
    const payAmount = parseFloat(amount);

    if (!invoice_id && payAmount > remaining) {
      return res.status(400).json({
        message: `Payment cannot exceed khata balance (${remaining} AFN). Create an invoice first or lower the amount.`,
      });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO payments (customer_id, invoice_id, amount, payment_date, payment_method, notes, created_by)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6, $7) RETURNING *`,
      [customerId, invoice_id, amount, payment_date, payment_method || 'cash', notes, req.user.id]
    );

    await client.query(
      `UPDATE customers SET total_paid = total_paid + $1, remaining_balance = remaining_balance - $1, updated_at = NOW()
       WHERE id = $2`,
      [amount, customerId]
    );

    if (invoice_id) {
      await client.query(
        `UPDATE invoices SET paid_amount = paid_amount + $1, remaining_amount = remaining_amount - $1, updated_at = NOW()
         WHERE id = $2`,
        [amount, invoice_id]
      );
    }

    await client.query(
      `INSERT INTO roznamcha (entry_date, details, income, expense, entry_type, reference_id, created_by)
       VALUES (COALESCE($1, CURRENT_DATE), $2, $3, 0, 'payment', $4, $5)`,
      [payment_date, `Payment from customer #${customerId}`, amount, result.rows[0].id, req.user.id]
    );

    await client.query('COMMIT');
    await syncCustomerKhata(customerId);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

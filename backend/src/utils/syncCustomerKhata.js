import { query, getClient } from '../config/database.js';

/** Recalculate customer khata from actual invoices & payments (fixes wrong balances). */
export async function syncCustomerKhata(customerId = null) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    let customerIds = [];
    if (customerId) {
      customerIds = [customerId];
    } else {
      const res = await client.query('SELECT id FROM customers WHERE is_active = true');
      customerIds = res.rows.map((r) => r.id);
    }

    for (const id of customerIds) {
      const inv = await client.query(
        `SELECT COALESCE(SUM(grand_total), 0) as credit,
                COALESCE(SUM(remaining_amount), 0) as remaining
         FROM invoices WHERE customer_id = $1`,
        [id]
      );
      const pay = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE customer_id = $1`,
        [id]
      );

      await client.query(
        `UPDATE customers SET
          total_credit = $1,
          total_paid = $2,
          remaining_balance = $3,
          updated_at = NOW()
         WHERE id = $4`,
        [
          parseFloat(inv.rows[0].credit),
          parseFloat(pay.rows[0].paid),
          parseFloat(inv.rows[0].remaining),
          id,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

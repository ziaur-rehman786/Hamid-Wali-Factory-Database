import { query, getClient } from '../config/database.js';
import { generateInvoiceNumber, stripProfitFields } from '../utils/helpers.js';
import { syncCustomerKhata } from '../utils/syncCustomerKhata.js';
import { msg } from '../i18n/messages.js';

export const getInvoices = async (req, res) => {
  try {
    const { customer, invoice_number, date_from, date_to, page = 1, limit = 20 } = req.query;
    let sql = `
      SELECT inv.*, c.name as customer_name, c.phone as customer_phone
      FROM invoices inv
      JOIN customers c ON inv.customer_id = c.id WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (customer) {
      sql += ` AND c.name ILIKE $${idx}`;
      params.push(`%${customer}%`);
      idx++;
    }
    if (invoice_number) {
      sql += ` AND inv.invoice_number ILIKE $${idx}`;
      params.push(`%${invoice_number}%`);
      idx++;
    }
    if (date_from) {
      sql += ` AND inv.invoice_date >= $${idx}`;
      params.push(date_from);
      idx++;
    }
    if (date_to) {
      sql += ` AND inv.invoice_date <= $${idx}`;
      params.push(date_to);
      idx++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) sub`, params);
    const total = parseInt(countResult.rows[0].count);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` ORDER BY inv.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);
    res.json({
      data: stripProfitFields(result.rows, req.hideProfit),
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const inv = await query(
      `SELECT inv.*, c.name as customer_name, c.phone, c.address
       FROM invoices inv JOIN customers c ON inv.customer_id = c.id
       WHERE inv.id = $1`,
      [req.params.id]
    );
    if (!inv.rows.length) return res.status(404).json({ message: msg(req, 'invoiceNotFound') });

    const items = await query(
      `SELECT ii.*, pd.art_number, c.name as color_name, s.size_value
       FROM invoice_items ii
       JOIN product_designs pd ON ii.design_id = pd.id
       JOIN colors c ON ii.color_id = c.id
       JOIN sizes s ON ii.size_id = s.id
       WHERE ii.invoice_id = $1`,
      [req.params.id]
    );

    const settings = await query('SELECT setting_key, setting_value FROM factory_settings');
    const factory = {};
    settings.rows.forEach((s) => (factory[s.setting_key] = s.setting_value));

    const invoice = { ...inv.rows[0], items: items.rows, factory };
    res.json(stripProfitFields(invoice, req.hideProfit));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createInvoice = async (req, res) => {
  const client = await getClient();
  try {
    const { customer_id, items, paid_amount = 0, invoice_date, notes } = req.body;

    if (!customer_id || !items?.length) {
      return res.status(400).json({ message: msg(req, 'customerItemsRequired') });
    }

    await client.query('BEGIN');

    const invoiceNumber = await generateInvoiceNumber((text, params) =>
      client.query(text, params)
    );

    let grandTotal = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    const processedItems = [];

    for (const item of items) {
      const invResult = await client.query(
        `SELECT i.*, pd.art_number FROM inventory i
         JOIN product_designs pd ON i.design_id = pd.id
         WHERE i.design_id = $1 AND i.color_id = $2 AND i.size_id = $3`,
        [item.design_id, item.color_id, item.size_id]
      );

      if (!invResult.rows.length) {
        throw new Error(`Stock not found for selected product`);
      }

      const stock = invResult.rows[0];
      if (stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${stock.art_number}. Available: ${stock.quantity}`);
      }

      const salePrice = item.sale_price ?? stock.sale_price;
      const costPrice = stock.cost_price;
      const itemTotal = salePrice * item.quantity;
      const diff = (salePrice - costPrice) * item.quantity;
      const profit = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      grandTotal += itemTotal;
      totalProfit += profit;
      totalLoss += loss;

      processedItems.push({
        ...item,
        inventory_id: stock.id,
        sale_price: salePrice,
        cost_price: costPrice,
        item_total: itemTotal,
        profit,
        loss,
      });

      await client.query(
        'UPDATE inventory SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2',
        [item.quantity, stock.id]
      );

      await client.query(
        `INSERT INTO stock_movements (inventory_id, movement_type, quantity, reference_type, created_by, notes)
         VALUES ($1, 'sale', $2, 'invoice', $3, 'Invoice sale')`,
        [stock.id, item.quantity, req.user.id]
      );
    }

    const remaining = grandTotal - paid_amount;

    const invResult = await client.query(
      `INSERT INTO invoices (invoice_number, customer_id, invoice_date, grand_total, paid_amount, remaining_amount, total_profit, total_loss, notes, created_by)
       VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        invoiceNumber,
        customer_id,
        invoice_date,
        grandTotal,
        paid_amount,
        remaining,
        totalProfit,
        totalLoss,
        notes,
        req.user.id,
      ]
    );

    const invoice = invResult.rows[0];

    for (const item of processedItems) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, inventory_id, design_id, color_id, size_id, quantity, cartons, sale_price, cost_price, item_total, profit, loss)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          invoice.id,
          item.inventory_id,
          item.design_id,
          item.color_id,
          item.size_id,
          item.quantity,
          item.cartons ?? null,
          item.sale_price,
          item.cost_price,
          item.item_total,
          item.profit,
          item.loss,
        ]
      );
    }

    await client.query(
      `UPDATE customers SET
        total_credit = total_credit + $1,
        remaining_balance = remaining_balance + $2,
        updated_at = NOW()
       WHERE id = $3`,
      [grandTotal, remaining, customer_id]
    );

    if (paid_amount > 0) {
      await client.query(
        `INSERT INTO payments (customer_id, invoice_id, amount, payment_date, notes, created_by)
         VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), 'Payment with invoice', $5)`,
        [customer_id, invoice.id, paid_amount, invoice_date, req.user.id]
      );
      await client.query(
        `UPDATE customers SET total_paid = total_paid + $1, remaining_balance = remaining_balance - $1, updated_at = NOW() WHERE id = $2`,
        [paid_amount, customer_id]
      );
    }

    await client.query(
      `INSERT INTO roznamcha (entry_date, details, income, expense, entry_type, reference_id, created_by)
       VALUES (COALESCE($1, CURRENT_DATE), $2, $3, 0, 'invoice', $4, $5)`,
      [invoice_date, `Invoice ${invoiceNumber}`, paid_amount, invoice.id, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...invoice, message: msg(req, 'invoiceCreated') });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
};

export const deleteInvoice = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: msg(req, 'adminOnlyDelete') });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const inv = await client.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (!inv.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: msg(req, 'invoiceNotFound') });
    }
    const invoice = inv.rows[0];

    const items = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [
      req.params.id,
    ]);

    for (const item of items.rows) {
      if (item.inventory_id) {
        await client.query(
          'UPDATE inventory SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2',
          [item.quantity, item.inventory_id]
        );
        await client.query(
          `INSERT INTO stock_movements (inventory_id, movement_type, quantity, reference_type, reference_id, created_by, notes)
           VALUES ($1, 'restore', $2, 'invoice_delete', $3, $4, 'Invoice deleted - stock restored')`,
          [item.inventory_id, item.quantity, req.params.id, req.user.id]
        );
      }
    }

    const customerId = invoice.customer_id;

    await client.query('DELETE FROM payments WHERE invoice_id = $1', [req.params.id]);
    await client.query('DELETE FROM roznamcha WHERE reference_id = $1 AND entry_type = $2', [
      req.params.id,
      'invoice',
    ]);
    await client.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);

    await client.query('COMMIT');
    await syncCustomerKhata(customerId);
    res.json({ message: msg(req, 'invoiceDeleted') });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};

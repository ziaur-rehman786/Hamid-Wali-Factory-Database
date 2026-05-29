import ExcelJS from 'exceljs';
import { query } from '../config/database.js';
import { formatCurrencyLabel } from '../utils/currency.js';

export const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    const result = await query(
      `SELECT inv.*, c.name as customer_name
       FROM invoices inv JOIN customers c ON inv.customer_id = c.id
       WHERE inv.invoice_date = $1 ORDER BY inv.created_at`,
      [targetDate]
    );
    const summary = await query(
      `SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total,
              COALESCE(SUM(paid_amount), 0) as paid,
              COALESCE(SUM(remaining_amount), 0) as remaining
       FROM invoices WHERE invoice_date = $1`,
      [targetDate]
    );
    res.json({ date: targetDate, invoices: result.rows, summary: summary.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMonthlySales = async (req, res) => {
  try {
    const { month, year } = req.query;
    const y = year || new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;

    const result = await query(
      `SELECT inv.invoice_date, inv.invoice_number, c.name as customer_name,
              inv.grand_total, inv.paid_amount, inv.remaining_amount
       FROM invoices inv JOIN customers c ON inv.customer_id = c.id
       WHERE EXTRACT(YEAR FROM inv.invoice_date) = $1 AND EXTRACT(MONTH FROM inv.invoice_date) = $2
       ORDER BY inv.invoice_date`,
      [y, m]
    );

    const summary = await query(
      `SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
       FROM invoices
       WHERE EXTRACT(YEAR FROM invoice_date) = $1 AND EXTRACT(MONTH FROM invoice_date) = $2`,
      [y, m]
    );

    res.json({ month: m, year: y, invoices: result.rows, summary: summary.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProfitReport = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  try {
    const { date_from, date_to } = req.query;
    let sql = `SELECT invoice_date, invoice_number, grand_total, total_profit, total_loss,
                      (total_profit - total_loss) as net_profit
               FROM invoices WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (date_from) {
      sql += ` AND invoice_date >= $${idx++}`;
      params.push(date_from);
    }
    if (date_to) {
      sql += ` AND invoice_date <= $${idx++}`;
      params.push(date_to);
    }
    sql += ' ORDER BY invoice_date DESC';

    const result = await query(sql, params);
    let summarySql = `SELECT COALESCE(SUM(total_profit), 0) as profit, COALESCE(SUM(total_loss), 0) as loss,
                             COALESCE(SUM(grand_total), 0) as sales FROM invoices WHERE 1=1`;
    const summaryParams = [];
    let sIdx = 1;
    if (date_from) {
      summarySql += ` AND invoice_date >= $${sIdx++}`;
      summaryParams.push(date_from);
    }
    if (date_to) {
      summarySql += ` AND invoice_date <= $${sIdx++}`;
      summaryParams.push(date_to);
    }
    const summary = await query(summarySql, summaryParams);

    res.json({ data: result.rows, summary: summary.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStockReport = async (req, res) => {
  try {
    const result = await query(
      `SELECT pd.art_number, c.name as color, s.size_value as size,
              i.quantity, i.cost_price, i.sale_price,
              (i.quantity * i.cost_price) as stock_value
       FROM inventory i
       JOIN product_designs pd ON i.design_id = pd.id
       JOIN colors c ON i.color_id = c.id
       JOIN sizes s ON i.size_id = s.id
       ORDER BY pd.art_number, c.name, s.size_value`
    );
    const summary = await query(
      'SELECT SUM(quantity) as total_pairs, SUM(quantity * cost_price) as total_value FROM inventory'
    );
    res.json({ data: result.rows, summary: summary.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCustomerBalances = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, phone, total_credit, total_paid, remaining_balance
       FROM customers WHERE is_active = true AND remaining_balance > 0
       ORDER BY remaining_balance DESC`
    );
    const summary = await query(
      'SELECT COALESCE(SUM(remaining_balance), 0) as total_due FROM customers WHERE is_active = true'
    );
    res.json({ data: result.rows, summary: summary.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBestSellingDesigns = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const result = await query(
      `SELECT pd.art_number, pd.name, SUM(ii.quantity) as total_sold,
              SUM(ii.item_total) as total_revenue
       FROM invoice_items ii
       JOIN product_designs pd ON ii.design_id = pd.id
       GROUP BY pd.id, pd.art_number, pd.name
       ORDER BY total_sold DESC LIMIT $1`,
      [parseInt(limit)]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const exportExcel = async (req, res) => {
  try {
    const { type } = req.params;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    if (type === 'stock') {
      const data = await query(
        `SELECT pd.art_number as "Design", c.name as "Color", s.size_value as "Size",
                i.quantity as "Quantity", i.cost_price as "${formatCurrencyLabel('Cost Price')}",
                i.sale_price as "${formatCurrencyLabel('Sale Price')}"
         FROM inventory i
         JOIN product_designs pd ON i.design_id = pd.id
         JOIN colors c ON i.color_id = c.id
         JOIN sizes s ON i.size_id = s.id
         ORDER BY pd.art_number`
      );
      if (data.rows.length) {
        sheet.columns = Object.keys(data.rows[0]).map((k) => ({ header: k, key: k, width: 15 }));
        data.rows.forEach((row) => sheet.addRow(row));
      }
    } else if (type === 'customers') {
      const data = await query(
        `SELECT name as "Name", phone as "Phone", total_credit as "${formatCurrencyLabel('Credit')}", total_paid as "${formatCurrencyLabel('Paid')}", remaining_balance as "${formatCurrencyLabel('Balance')}" FROM customers WHERE is_active = true`
      );
      if (data.rows.length) {
        sheet.columns = Object.keys(data.rows[0]).map((k) => ({ header: k, key: k, width: 15 }));
        data.rows.forEach((row) => sheet.addRow(row));
      }
    } else if (type === 'invoices') {
      const data = await query(
        `SELECT inv.invoice_number as "Invoice", inv.invoice_date as "Date",
                c.name as "Customer", inv.grand_total as "${formatCurrencyLabel('Total')}",
                inv.paid_amount as "${formatCurrencyLabel('Paid')}", inv.remaining_amount as "${formatCurrencyLabel('Remaining')}"
         FROM invoices inv JOIN customers c ON inv.customer_id = c.id
         ORDER BY inv.invoice_date DESC LIMIT 500`
      );
      if (data.rows.length) {
        sheet.columns = Object.keys(data.rows[0]).map((k) => ({ header: k, key: k, width: 15 }));
        data.rows.forEach((row) => sheet.addRow(row));
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

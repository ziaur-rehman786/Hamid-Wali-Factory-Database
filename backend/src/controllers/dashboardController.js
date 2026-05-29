import { query } from '../config/database.js';

export const getDashboard = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';

    const [
      stock,
      sales,
      customers,
      pending,
      dailySales,
      monthlySales,
      profitLoss,
      lowStock,
      recentInvoices,
    ] = await Promise.all([
      query('SELECT COALESCE(SUM(quantity), 0) as total FROM inventory'),
      query('SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices'),
      query('SELECT COUNT(*) as total FROM customers WHERE is_active = true'),
      query('SELECT COALESCE(SUM(remaining_amount), 0) as total FROM invoices'),
      query(
        `SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
         FROM invoices WHERE invoice_date = CURRENT_DATE`
      ),
      query(
        `SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
         FROM invoices WHERE DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)`
      ),
      isAdmin
        ? query(
            `SELECT COALESCE(SUM(total_profit), 0) as profit, COALESCE(SUM(total_loss), 0) as loss
             FROM invoices`
          )
        : Promise.resolve({ rows: [{ profit: 0, loss: 0 }] }),
      query(
        `SELECT COUNT(*) as count FROM inventory i
         JOIN product_designs pd ON i.design_id = pd.id
         JOIN colors c ON i.color_id = c.id
         JOIN sizes s ON i.size_id = s.id
         WHERE i.quantity <= i.low_stock_threshold`
      ),
      query(
        `SELECT inv.*, c.name as customer_name
         FROM invoices inv
         JOIN customers c ON inv.customer_id = c.id
         ORDER BY inv.created_at DESC LIMIT 5`
      ),
    ]);

    const salesChart = await query(
      `SELECT invoice_date::text as date, SUM(grand_total) as total, COUNT(*) as count
       FROM invoices
       WHERE invoice_date >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY invoice_date ORDER BY invoice_date`
    );

    const monthlyChart = await query(
      `SELECT TO_CHAR(invoice_date, 'YYYY-MM') as month, SUM(grand_total) as total
       FROM invoices
       WHERE invoice_date >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
       ORDER BY month`
    );

    const response = {
      totalStock: parseInt(stock.rows[0].total),
      totalSales: parseFloat(sales.rows[0].total),
      totalCustomers: parseInt(customers.rows[0].total),
      pendingPayments: Math.max(0, parseFloat(pending.rows[0].total)),
      dailySales: {
        total: parseFloat(dailySales.rows[0].total),
        count: parseInt(dailySales.rows[0].count),
      },
      monthlySales: {
        total: parseFloat(monthlySales.rows[0].total),
        count: parseInt(monthlySales.rows[0].count),
      },
      lowStockCount: parseInt(lowStock.rows[0].count),
      recentInvoices: recentInvoices.rows,
      salesChart: salesChart.rows,
      monthlyChart: monthlyChart.rows,
    };

    if (isAdmin) {
      response.totalProfit = parseFloat(profitLoss.rows[0].profit);
      response.totalLoss = parseFloat(profitLoss.rows[0].loss);
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

import { query } from '../config/database.js';

export const getEntries = async (req, res) => {
  try {
    const { date_from, date_to, page = 1, limit = 50 } = req.query;
    let sql = 'SELECT * FROM roznamcha WHERE 1=1';
    const params = [];
    let idx = 1;

    if (date_from) {
      sql += ` AND entry_date >= $${idx}`;
      params.push(date_from);
      idx++;
    }
    if (date_to) {
      sql += ` AND entry_date <= $${idx}`;
      params.push(date_to);
      idx++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) sub`, params);
    const total = parseInt(countResult.rows[0].count);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` ORDER BY entry_date DESC, id DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    let totalsSql = `SELECT COALESCE(SUM(income), 0) as total_income, COALESCE(SUM(expense), 0) as total_expense
                     FROM roznamcha WHERE 1=1`;
    const totalsParams = [];
    let tIdx = 1;
    if (date_from) {
      totalsSql += ` AND entry_date >= $${tIdx}`;
      totalsParams.push(date_from);
      tIdx++;
    }
    if (date_to) {
      totalsSql += ` AND entry_date <= $${tIdx}`;
      totalsParams.push(date_to);
    }

    const totals = await query(totalsSql, totalsParams);

    res.json({
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
      totals: totals.rows[0],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createEntry = async (req, res) => {
  try {
    const { entry_date, details, income = 0, expense = 0 } = req.body;

    const lastBalance = await query(
      'SELECT balance FROM roznamcha ORDER BY entry_date DESC, id DESC LIMIT 1'
    );
    const prevBalance = lastBalance.rows.length ? parseFloat(lastBalance.rows[0].balance) : 0;
    const balance = prevBalance + parseFloat(income) - parseFloat(expense);

    const result = await query(
      `INSERT INTO roznamcha (entry_date, details, income, expense, balance, entry_type, created_by)
       VALUES (COALESCE($1, CURRENT_DATE), $2, $3, $4, $5, 'manual', $6) RETURNING *`,
      [entry_date, details, income, expense, balance, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEntry = async (req, res) => {
  try {
    const { entry_date, details, income, expense } = req.body;
    const result = await query(
      `UPDATE roznamcha SET entry_date = COALESCE($1, entry_date), details = COALESCE($2, details),
        income = COALESCE($3, income), expense = COALESCE($4, expense)
       WHERE id = $5 AND entry_type = 'manual' RETURNING *`,
      [entry_date, details, income, expense, req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Entry not found or cannot edit system entries' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEntry = async (req, res) => {
  try {
    const result = await query(
      "DELETE FROM roznamcha WHERE id = $1 AND entry_type = 'manual' RETURNING id",
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Entry not found or cannot delete system entries' });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMonthlyTotals = async (req, res) => {
  try {
    const result = await query(
      `SELECT TO_CHAR(entry_date, 'YYYY-MM') as month,
              SUM(income) as total_income,
              SUM(expense) as total_expense,
              COUNT(*) as entries
       FROM roznamcha
       GROUP BY TO_CHAR(entry_date, 'YYYY-MM')
       ORDER BY month DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

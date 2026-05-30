import { query, getClient } from '../config/database.js';
import { msg } from '../i18n/messages.js';

const inventorySelect = `
  SELECT i.*, pd.art_number, pd.name as design_name,
         c.name as color_name, s.size_value
  FROM inventory i
  JOIN product_designs pd ON i.design_id = pd.id
  JOIN colors c ON i.color_id = c.id
  JOIN sizes s ON i.size_id = s.id
`;

export const getInventory = async (req, res) => {
  try {
    const { design, color, size, low_stock, search, page = 1, limit = 50 } = req.query;
    let sql = `${inventorySelect} WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (design) {
      sql += ` AND (pd.art_number ILIKE $${idx} OR pd.name ILIKE $${idx})`;
      params.push(`%${design}%`);
      idx++;
    }
    if (color) {
      sql += ` AND c.name ILIKE $${idx}`;
      params.push(`%${color}%`);
      idx++;
    }
    if (size) {
      sql += ` AND s.size_value = $${idx}`;
      params.push(size);
      idx++;
    }
    if (low_stock === 'true') {
      sql += ' AND i.quantity <= i.low_stock_threshold';
    }
    if (search) {
      sql += ` AND (pd.art_number ILIKE $${idx} OR c.name ILIKE $${idx} OR s.size_value ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM (${sql}) sub`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` ORDER BY pd.art_number, c.name, s.size_value LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);
    const summary = await query(
      'SELECT COALESCE(SUM(quantity), 0) as total_qty, COALESCE(SUM(quantity * cost_price), 0) as stock_value FROM inventory'
    );

    res.json({
      data: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
      summary: summary.rows[0],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getInventoryItem = async (req, res) => {
  try {
    const result = await query(`${inventorySelect} WHERE i.id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: msg(req, 'notFound') });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createInventory = async (req, res) => {
  try {
    const { design_id, color_id, size_id, quantity, cost_price, sale_price, low_stock_threshold } =
      req.body;

    const result = await query(
      `INSERT INTO inventory (design_id, color_id, size_id, quantity, cost_price, sale_price, low_stock_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [design_id, color_id, size_id, quantity, cost_price, sale_price, low_stock_threshold || 10]
    );

    await query(
      `INSERT INTO stock_movements (inventory_id, movement_type, quantity, reference_type, created_by, notes)
       VALUES ($1, 'add', $2, 'manual', $3, 'Initial stock entry')`,
      [result.rows[0].id, quantity, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: msg(req, 'duplicateStock') });
    res.status(500).json({ message: err.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { quantity, cost_price, sale_price, low_stock_threshold } = req.body;
    const old = await query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
    if (!old.rows.length) return res.status(404).json({ message: msg(req, 'notFound') });

    const result = await query(
      `UPDATE inventory SET
        quantity = COALESCE($1, quantity),
        cost_price = COALESCE($2, cost_price),
        sale_price = COALESCE($3, sale_price),
        low_stock_threshold = COALESCE($4, low_stock_threshold),
        updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [quantity, cost_price, sale_price, low_stock_threshold, req.params.id]
    );

    if (quantity !== undefined && quantity !== old.rows[0].quantity) {
      const diff = quantity - old.rows[0].quantity;
      await query(
        `INSERT INTO stock_movements (inventory_id, movement_type, quantity, reference_type, created_by, notes)
         VALUES ($1, $2, $3, 'manual', $4, 'Stock adjustment')`,
        [req.params.id, diff > 0 ? 'add' : 'remove', Math.abs(diff), req.user.id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    await query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
    res.json({ message: msg(req, 'deleted') });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ message: msg(req, 'cannotDeleteReferenced') });
    res.status(500).json({ message: err.message });
  }
};

export const addStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    const result = await query(
      `UPDATE inventory SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [quantity, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: msg(req, 'notFound') });

    await query(
      `INSERT INTO stock_movements (inventory_id, movement_type, quantity, reference_type, created_by, notes)
       VALUES ($1, 'add', $2, 'manual', $3, 'Stock added')`,
      [req.params.id, quantity, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

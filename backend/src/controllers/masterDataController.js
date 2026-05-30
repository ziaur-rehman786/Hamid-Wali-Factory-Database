import { query } from '../config/database.js';
import { msg } from '../i18n/messages.js';

// Designs
export const getDesigns = async (req, res) => {
  const result = await query('SELECT * FROM product_designs WHERE is_active = true ORDER BY art_number');
  res.json(result.rows);
};

export const createDesign = async (req, res) => {
  try {
    const { art_number, name, description } = req.body;
    const result = await query(
      'INSERT INTO product_designs (art_number, name, description) VALUES ($1, $2, $3) RETURNING *',
      [art_number, name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Art number already exists' });
    res.status(500).json({ message: err.message });
  }
};

export const updateDesign = async (req, res) => {
  const { art_number, name, description, is_active } = req.body;
  const result = await query(
    `UPDATE product_designs SET art_number = COALESCE($1, art_number), name = COALESCE($2, name),
      description = COALESCE($3, description), is_active = COALESCE($4, is_active), updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [art_number, name, description, is_active, req.params.id]
  );
  res.json(result.rows[0]);
};

export const deleteDesign = async (req, res) => {
  await query('UPDATE product_designs SET is_active = false WHERE id = $1', [req.params.id]);
  res.json({ message: 'Design deactivated' });
};

// Colors
export const getColors = async (req, res) => {
  const result = await query('SELECT * FROM colors WHERE is_active = true ORDER BY name');
  res.json(result.rows);
};

export const createColor = async (req, res) => {
  try {
    const result = await query('INSERT INTO colors (name, hex_code) VALUES ($1, $2) RETURNING *', [
      req.body.name,
      req.body.hex_code,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Color already exists' });
    res.status(500).json({ message: err.message });
  }
};

export const updateColor = async (req, res) => {
  const result = await query(
    'UPDATE colors SET name = COALESCE($1, name), hex_code = COALESCE($2, hex_code), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING *',
    [req.body.name, req.body.hex_code, req.body.is_active, req.params.id]
  );
  res.json(result.rows[0]);
};

export const deleteColor = async (req, res) => {
  await query('UPDATE colors SET is_active = false WHERE id = $1', [req.params.id]);
  res.json({ message: 'Color deactivated' });
};

// Sizes
export const getSizes = async (req, res) => {
  const result = await query('SELECT * FROM sizes WHERE is_active = true ORDER BY id');
  res.json(result.rows);
};

export const createSize = async (req, res) => {
  try {
    const result = await query('INSERT INTO sizes (size_value) VALUES ($1) RETURNING *', [
      req.body.size_value,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Size already exists' });
    res.status(500).json({ message: err.message });
  }
};

export const updateSize = async (req, res) => {
  const result = await query(
    'UPDATE sizes SET size_value = COALESCE($1, size_value), is_active = COALESCE($2, is_active) WHERE id = $3 RETURNING *',
    [req.body.size_value, req.body.is_active, req.params.id]
  );
  res.json(result.rows[0]);
};

export const deleteSize = async (req, res) => {
  await query('UPDATE sizes SET is_active = false WHERE id = $1', [req.params.id]);
  res.json({ message: 'Size deactivated' });
};

// Settings
export const getSettings = async (req, res) => {
  const result = await query('SELECT * FROM factory_settings ORDER BY setting_key');
  const settings = {};
  result.rows.forEach((r) => (settings[r.setting_key] = r.setting_value));
  if (!settings.factory_logo) settings.factory_logo = '/logo.png?v=2';
  if (!settings.currency_code) settings.currency_code = 'AFN';
  if (!settings.pairs_per_carton) settings.pairs_per_carton = '8';
  res.json(settings);
};

export const updateSettings = async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await query(
        `INSERT INTO factory_settings (setting_key, setting_value) VALUES ($1, $2)
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
        [key, value]
      );
    }
    res.json({ message: msg(req, 'settingsSaved') });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

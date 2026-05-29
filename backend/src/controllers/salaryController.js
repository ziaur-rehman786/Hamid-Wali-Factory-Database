import { query } from '../config/database.js';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseMonthYear(body) {
  let year = parseInt(body.salary_year, 10);
  let month = parseInt(body.salary_month, 10);
  if (body.month_year) {
    const [y, m] = body.month_year.split('-');
    year = parseInt(y, 10);
    month = parseInt(m, 10);
  }
  return { year, month };
}

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function sortRecordsChronological(records) {
  return [...records].sort((a, b) => {
    if (a.salary_year !== b.salary_year) return a.salary_year - b.salary_year;
    return a.salary_month - b.salary_month;
  });
}

/** Enrich a monthly row with net payable, advance, shortfall, etc. */
export function enrichMonthlyRecord(row) {
  const salaryAmount = num(row.salary_amount);
  const advanceDeducted = num(row.advance_deducted);
  const owedSettled = num(row.owed_settled);
  const netPayable = Math.max(0, salaryAmount - advanceDeducted);
  const totalDue = netPayable + owedSettled;

  let amountPaid = row.amount_paid != null && row.amount_paid !== '' ? num(row.amount_paid) : null;
  if (amountPaid === null && row.payment_status === 'paid') {
    amountPaid = totalDue;
  }

  const isPaid = row.payment_status === 'paid';
  const advanceGiven =
    isPaid && amountPaid != null ? Math.max(0, amountPaid - totalDue) : 0;
  const shortfall =
    isPaid && amountPaid != null ? Math.max(0, totalDue - amountPaid) : 0;

  return {
    ...row,
    month_label: `${MONTH_NAMES[row.salary_month]} ${row.salary_year}`,
    net_payable: netPayable,
    owed_settled: owedSettled,
    total_due: totalDue,
    amount_paid: amountPaid,
    advance_given: advanceGiven,
    shortfall,
  };
}

/** Extra paid earlier — recover by deducting from future months. */
export function computeAdvanceBalance(records) {
  let balance = 0;
  for (const row of sortRecordsChronological(records)) {
    const enriched = enrichMonthlyRecord(row);
    balance += enriched.advance_given;
    balance -= num(row.advance_deducted);
    balance = Math.max(0, balance);
  }
  return balance;
}

/** Still owed to employee from paying less than due in past months. */
export function computeOwedBalance(records) {
  let balance = 0;
  for (const row of sortRecordsChronological(records)) {
    const enriched = enrichMonthlyRecord(row);
    balance += enriched.shortfall;
    balance -= num(row.owed_settled);
    balance = Math.max(0, balance);
  }
  return balance;
}

function parseMonthlyPayload(body, defaultSalary) {
  const salaryAmount =
    body.salary_amount !== undefined && body.salary_amount !== ''
      ? num(body.salary_amount)
      : num(defaultSalary);

  const advanceDeducted = num(body.advance_deducted);
  const owedSettled = num(body.owed_settled);
  const netPayable = Math.max(0, salaryAmount - advanceDeducted);
  const totalDue = netPayable + owedSettled;

  if (advanceDeducted > salaryAmount) {
    throw new Error('Advance deduction cannot be greater than monthly salary');
  }

  const status = body.payment_status === 'paid' ? 'paid' : 'not_paid';

  let amountPaid = null;
  if (status === 'paid') {
    amountPaid =
      body.amount_paid !== undefined && body.amount_paid !== ''
        ? num(body.amount_paid)
        : totalDue;
    if (amountPaid < 0) throw new Error('Cash paid cannot be negative');
  }

  return {
    salaryAmount,
    advanceDeducted,
    owedSettled,
    netPayable,
    totalDue,
    amountPaid,
    status,
    notes: body.notes || null,
  };
}

async function getRecordsExcept(employeeId, excludeRecordId = null) {
  let sql = 'SELECT * FROM salary_monthly_records WHERE employee_id = $1';
  const params = [employeeId];
  if (excludeRecordId) {
    sql += ' AND id != $2';
    params.push(excludeRecordId);
  }
  const months = await query(sql, params);
  return months.rows;
}

async function validateAdvanceDeduction(employeeId, advanceDeducted, excludeRecordId = null) {
  const rows = await getRecordsExcept(employeeId, excludeRecordId);
  const balance = computeAdvanceBalance(rows);
  if (advanceDeducted > balance + 0.001) {
    throw new Error(
      `Advance deduction (${advanceDeducted}) exceeds outstanding advance (${balance.toFixed(0)} AFN)`
    );
  }
}

async function validateOwedSettlement(employeeId, owedSettled, excludeRecordId = null) {
  const rows = await getRecordsExcept(employeeId, excludeRecordId);
  const balance = computeOwedBalance(rows);
  if (owedSettled > balance + 0.001) {
    throw new Error(
      `Previous balance payment (${owedSettled}) exceeds amount still owed (${balance.toFixed(0)} AFN)`
    );
  }
}

export const getSalaries = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    let sql = `
      SELECT e.*,
        (SELECT COUNT(*) FROM salary_monthly_records m WHERE m.employee_id = e.id) AS month_count,
        (SELECT m.payment_status FROM salary_monthly_records m
         WHERE m.employee_id = e.id
         ORDER BY m.salary_year DESC, m.salary_month DESC LIMIT 1) AS latest_status
      FROM employee_salaries e WHERE e.is_active = true`;
    const params = [];
    let idx = 1;

    if (search) {
      sql += ` AND (e.name ILIKE $${idx} OR e.employee_number ILIKE $${idx} OR e.tazkira_no ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) sub`, params);
    const total = parseInt(countResult.rows[0].count);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` ORDER BY e.id LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    const data = await Promise.all(
      result.rows.map(async (emp) => {
        const months = await query(
          'SELECT * FROM salary_monthly_records WHERE employee_id = $1',
          [emp.id]
        );
        return {
          ...emp,
          advance_balance: computeAdvanceBalance(months.rows),
          owed_balance: computeOwedBalance(months.rows),
        };
      })
    );

    res.json({ data, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSalary = async (req, res) => {
  try {
    const employee = await query('SELECT * FROM employee_salaries WHERE id = $1 AND is_active = true', [
      req.params.id,
    ]);
    if (!employee.rows.length) return res.status(404).json({ message: 'Employee not found' });

    const months = await query(
      `SELECT * FROM salary_monthly_records
       WHERE employee_id = $1 ORDER BY salary_year DESC, salary_month DESC`,
      [req.params.id]
    );

    const monthlyRecords = months.rows.map(enrichMonthlyRecord);

    res.json({
      ...employee.rows[0],
      advance_balance: computeAdvanceBalance(months.rows),
      owed_balance: computeOwedBalance(months.rows),
      monthly_records: monthlyRecords,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createSalary = async (req, res) => {
  try {
    const {
      employee_number,
      name,
      address,
      father_name,
      tazkira_no,
      residence,
      start_date,
      end_date,
      salary_amount,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const result = await query(
      `INSERT INTO employee_salaries (
        employee_number, name, address, father_name, tazkira_no, residence,
        start_date, end_date, salary_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        employee_number || null,
        name.trim(),
        address || null,
        father_name || null,
        tazkira_no || null,
        residence || null,
        start_date || null,
        end_date || null,
        parseFloat(salary_amount) || 0,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSalary = async (req, res) => {
  try {
    const {
      employee_number,
      name,
      address,
      father_name,
      tazkira_no,
      residence,
      start_date,
      end_date,
      salary_amount,
    } = req.body;

    const result = await query(
      `UPDATE employee_salaries SET
        employee_number = COALESCE($1, employee_number),
        name = COALESCE($2, name),
        address = COALESCE($3, address),
        father_name = COALESCE($4, father_name),
        tazkira_no = COALESCE($5, tazkira_no),
        residence = COALESCE($6, residence),
        start_date = COALESCE($7, start_date),
        end_date = $8,
        salary_amount = COALESCE($9, salary_amount),
        updated_at = NOW()
       WHERE id = $10 AND is_active = true RETURNING *`,
      [
        employee_number,
        name,
        address,
        father_name,
        tazkira_no,
        residence,
        start_date,
        end_date === '' ? null : end_date,
        salary_amount !== undefined ? parseFloat(salary_amount) : null,
        req.params.id,
      ]
    );

    if (!result.rows.length) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSalary = async (req, res) => {
  try {
    const result = await query(
      `UPDATE employee_salaries SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createMonthlyRecord = async (req, res) => {
  try {
    const employee = await query('SELECT id, salary_amount FROM employee_salaries WHERE id = $1 AND is_active = true', [
      req.params.id,
    ]);
    if (!employee.rows.length) return res.status(404).json({ message: 'Employee not found' });

    const { year, month } = parseMonthYear(req.body);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ message: 'Valid month and year are required' });
    }

    const parsed = parseMonthlyPayload(req.body, employee.rows[0].salary_amount);
    await validateAdvanceDeduction(req.params.id, parsed.advanceDeducted);
    await validateOwedSettlement(req.params.id, parsed.owedSettled);

    const result = await query(
      `INSERT INTO salary_monthly_records (
        employee_id, salary_year, salary_month, salary_amount, amount_paid,
        advance_deducted, owed_settled, payment_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.params.id,
        year,
        month,
        parsed.salaryAmount,
        parsed.amountPaid,
        parsed.advanceDeducted,
        parsed.owedSettled,
        parsed.status,
        parsed.notes,
      ]
    );

    res.status(201).json(enrichMonthlyRecord(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Salary for this month already exists. Edit the existing record instead.' });
    }
    res.status(400).json({ message: err.message });
  }
};

export const updateMonthlyRecord = async (req, res) => {
  try {
    const existing = await query(
      'SELECT * FROM salary_monthly_records WHERE id = $1 AND employee_id = $2',
      [req.params.recordId, req.params.id]
    );
    if (!existing.rows.length) return res.status(404).json({ message: 'Monthly record not found' });

    const employee = await query('SELECT salary_amount FROM employee_salaries WHERE id = $1', [req.params.id]);
    const { year, month } = parseMonthYear(req.body);

    const merged = {
      salary_amount: req.body.salary_amount ?? existing.rows[0].salary_amount,
      advance_deducted: req.body.advance_deducted ?? existing.rows[0].advance_deducted,
      owed_settled: req.body.owed_settled ?? existing.rows[0].owed_settled,
      amount_paid: req.body.amount_paid !== undefined ? req.body.amount_paid : existing.rows[0].amount_paid,
      payment_status: req.body.payment_status ?? existing.rows[0].payment_status,
      notes: req.body.notes !== undefined ? req.body.notes : existing.rows[0].notes,
    };

    const parsed = parseMonthlyPayload(merged, employee.rows[0].salary_amount);
    await validateAdvanceDeduction(req.params.id, parsed.advanceDeducted, req.params.recordId);
    await validateOwedSettlement(req.params.id, parsed.owedSettled, req.params.recordId);

    const status =
      req.body.payment_status === 'paid' || req.body.payment_status === 'not_paid'
        ? req.body.payment_status
        : undefined;

    const result = await query(
      `UPDATE salary_monthly_records SET
        salary_year = COALESCE($1, salary_year),
        salary_month = COALESCE($2, salary_month),
        salary_amount = $3,
        amount_paid = $4,
        advance_deducted = $5,
        owed_settled = $6,
        payment_status = COALESCE($7, payment_status),
        notes = COALESCE($8, notes),
        updated_at = NOW()
       WHERE id = $9 AND employee_id = $10 RETURNING *`,
      [
        year || null,
        month || null,
        parsed.salaryAmount,
        parsed.amountPaid,
        parsed.advanceDeducted,
        parsed.owedSettled,
        status,
        parsed.notes,
        req.params.recordId,
        req.params.id,
      ]
    );

    res.json(enrichMonthlyRecord(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Another record already exists for that month' });
    }
    res.status(400).json({ message: err.message });
  }
};

export const deleteMonthlyRecord = async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM salary_monthly_records WHERE id = $1 AND employee_id = $2 RETURNING id',
      [req.params.recordId, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Monthly record not found' });
    res.json({ message: 'Monthly record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

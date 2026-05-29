export const generateInvoiceNumber = async (query) => {
  const prefix = 'HW';
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT invoice_number FROM invoices 
     WHERE invoice_number LIKE $1 
     ORDER BY id DESC LIMIT 1`,
    [`${prefix}-${year}-%`]
  );

  let nextNum = 1;
  if (result.rows.length > 0) {
    const parts = result.rows[0].invoice_number.split('-');
    nextNum = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}-${year}-${String(nextNum).padStart(5, '0')}`;
};

export const stripProfitFields = (data, hideProfit) => {
  if (!hideProfit) return data;
  if (Array.isArray(data)) {
    return data.map((item) => stripProfitFields(item, hideProfit));
  }
  if (typeof data === 'object' && data !== null) {
    const cleaned = { ...data };
    delete cleaned.total_profit;
    delete cleaned.total_loss;
    delete cleaned.profit;
    delete cleaned.loss;
    delete cleaned.cost_price;
    if (cleaned.items) {
      cleaned.items = cleaned.items.map(({ cost_price, profit, loss, ...rest }) => rest);
    }
    return cleaned;
  }
  return data;
};

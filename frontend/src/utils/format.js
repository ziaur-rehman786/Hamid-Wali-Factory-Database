/** Afghan Afghani — used across the entire application */
export const CURRENCY_CODE = 'AFN';

export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${CURRENCY_CODE}`;
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatNumber = (n) => parseInt(n || 0).toLocaleString();

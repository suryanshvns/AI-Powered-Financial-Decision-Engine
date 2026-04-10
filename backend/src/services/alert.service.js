import { toAmount } from './feature.service.js';
import { addUtcDays } from '../utils/dateRange.js';

const sumExpenseByCategoryInRange = (transactions, startStr, endStr) => {
  const map = {};
  for (const row of transactions) {
    if (row.type !== 'expense') continue;
    const d =
      typeof row.date === 'string' ? row.date.slice(0, 10) : String(row.date).slice(0, 10);
    if (startStr && d < startStr) continue;
    if (endStr && d > endStr) continue;
    const c = row.category || 'unknown';
    map[c] = (map[c] || 0) + toAmount(row);
  }
  return map;
};

const buildAlerts = (features, transactions) => {
  const alerts = [];
  const {
    total_expense,
    total_income,
    savings_ratio_raw,
    as_of_date: asOf,
  } = features;

  if (total_income > 0 && total_expense > total_income) {
    alerts.push({
      type: 'overspending',
      severity: 'high',
      message: 'Spending has exceeded income in this period',
    });
  }

  if (
    savings_ratio_raw != null &&
    Number.isFinite(savings_ratio_raw) &&
    total_income > 0 &&
    savings_ratio_raw < 0.1
  ) {
    alerts.push({
      type: 'low_savings',
      severity: 'medium',
      message: 'Savings rate is below 10% of income',
    });
  }

  if (!asOf || !transactions?.length) {
    return alerts;
  }

  const end7 = asOf;
  const start7 = addUtcDays(asOf, -6);
  const start30 = addUtcDays(asOf, -29);

  const sum7 = sumExpenseByCategoryInRange(transactions, start7, end7);
  const sum30 = sumExpenseByCategoryInRange(transactions, start30, end7);

  for (const cat of Object.keys(sum7)) {
    const w7 = sum7[cat] || 0;
    const w30 = sum30[cat] || 0;
    const daily30 = w30 / 30;
    const expected7 = daily30 * 7;
    if (expected7 <= 0 || w7 <= 0) continue;
    if (w7 >= expected7 * 2 && w7 >= total_expense * 0.15) {
      alerts.push({
        type: 'anomaly_detected',
        severity: 'medium',
        message: `Unusual spike in ${cat} spending vs your 30-day pattern`,
      });
    }
  }

  return alerts;
};

export { buildAlerts };

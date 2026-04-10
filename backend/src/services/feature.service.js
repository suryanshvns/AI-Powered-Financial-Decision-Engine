import { parseIsoDate, formatUtcDate } from '../utils/dateRange.js';

const toAmount = (row) => {
  const n = Number(row.amount);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round(n * 100) / 100;

const sumExpenseInWindow = (transactions, endDateStr, windowDays) => {
  const end = parseIsoDate(endDateStr);
  if (!end || !windowDays || windowDays < 1) return 0;
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (windowDays - 1));
  const startStr = formatUtcDate(start);
  let sum = 0;
  for (const row of transactions) {
    if (row.type !== 'expense') continue;
    const ds = typeof row.date === 'string' ? row.date.slice(0, 10) : row.date;
    if (ds >= startStr && ds <= endDateStr) sum += toAmount(row);
  }
  return sum;
};

const totalIncomeExpense = (transactions) => {
  let total_income = 0;
  let total_expense = 0;
  const category_breakdown = {};

  for (const row of transactions) {
    const amt = toAmount(row);
    const cat = row.category ?? 'unknown';
    if (!category_breakdown[cat]) {
      category_breakdown[cat] = { income: 0, expense: 0, total: 0 };
    }
    if (row.type === 'income') {
      total_income += amt;
      category_breakdown[cat].income += amt;
    } else {
      total_expense += amt;
      category_breakdown[cat].expense += amt;
    }
    category_breakdown[cat].total =
      category_breakdown[cat].income + category_breakdown[cat].expense;
  }

  return { total_income, total_expense, category_breakdown };
};

const computeFeatures = (transactions, options = {}) => {
  const { priorPeriodTransactions = [], asOfDate: asOfOverride } = options;

  const { total_income, total_expense, category_breakdown } =
    totalIncomeExpense(transactions);

  const net_balance = total_income - total_expense;
  const savings_ratio = total_income > 0 ? net_balance / total_income : null;

  let asOfDate = asOfOverride;
  if (!asOfDate && transactions.length > 0) {
    let maxD = '';
    for (const row of transactions) {
      const ds = typeof row.date === 'string' ? row.date.slice(0, 10) : row.date;
      if (ds > maxD) maxD = ds;
    }
    asOfDate = maxD;
  }
  if (!asOfDate) {
    asOfDate = formatUtcDate(new Date());
  }

  const expenseSum7 = sumExpenseInWindow(transactions, asOfDate, 7);
  const expenseSum30 = sumExpenseInWindow(transactions, asOfDate, 30);
  const rolling_avg_spend_7d = round2(expenseSum7 / 7);
  const rolling_avg_spend_30d = round2(expenseSum30 / 30);

  let expense_growth_rate = null;
  if (priorPeriodTransactions && priorPeriodTransactions.length > 0) {
    const prev = totalIncomeExpense(priorPeriodTransactions).total_expense;
    if (prev > 0) {
      expense_growth_rate = round2(
        ((total_expense - prev) / prev) * 100,
      );
    }
  }

  const category_breakdown_enriched = {};
  for (const [cat, v] of Object.entries(category_breakdown)) {
    const pct_of_expense =
      total_expense > 0 ? round2((v.expense / total_expense) * 100) : 0;
    const pct_of_income =
      total_income > 0 ? round2((v.expense / total_income) * 100) : 0;
    category_breakdown_enriched[cat] = {
      ...v,
      pct_of_expense,
      pct_of_income,
    };
  }

  const transaction_count = transactions.length;
  const sumAbs = transactions.reduce((s, row) => s + Math.abs(toAmount(row)), 0);
  const avg_transaction_value =
    transaction_count > 0 ? round2(sumAbs / transaction_count) : 0;

  return {
    total_income,
    total_expense,
    net_balance,
    savings_ratio: savings_ratio === null ? null : round2(savings_ratio),
    savings_ratio_raw: savings_ratio,
    rolling_avg_spend_7d,
    rolling_avg_spend_30d,
    expense_growth_rate,
    category_breakdown: category_breakdown_enriched,
    transaction_count,
    avg_transaction_value,
    as_of_date: asOfDate,
  };
};

const applyTransactionAdjustments = (transactions, adjustments = {}) => {
  if (!adjustments || typeof adjustments !== 'object') {
    return transactions.map((row) => ({ ...row }));
  }

  const reduceAll =
    adjustments.reduce_expense_percent != null
      ? Number(adjustments.reduce_expense_percent)
      : null;
  const increaseIncome =
    adjustments.increase_income_percent != null
      ? Number(adjustments.increase_income_percent)
      : null;
  const byCategory =
    adjustments.category_adjustments &&
    typeof adjustments.category_adjustments === 'object' &&
    !Array.isArray(adjustments.category_adjustments)
      ? adjustments.category_adjustments
      : null;

  return transactions.map((row) => {
    const out = { ...row };
    const amt = toAmount(out);

    if (out.type === 'expense') {
      let factor = 1;
      if (byCategory && byCategory[out.category] != null) {
        const p = Number(byCategory[out.category]);
        if (Number.isFinite(p)) factor *= 1 - p / 100;
      } else if (reduceAll != null && Number.isFinite(reduceAll)) {
        factor *= 1 - reduceAll / 100;
      }
      out.amount = round2(amt * factor);
    } else if (out.type === 'income' && increaseIncome != null && Number.isFinite(increaseIncome)) {
      out.amount = round2(amt * (1 + increaseIncome / 100));
    }

    return out;
  });
};

export { toAmount, computeFeatures, applyTransactionAdjustments };

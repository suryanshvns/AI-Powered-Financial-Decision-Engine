const CURRENCY = '₹';

const buildFuturePrediction = (features) => {
  const income = Number(features.total_income) || 0;
  const expense = Number(features.total_expense) || 0;
  const growth = features.expense_growth_rate;
  const net = Number(features.net_balance);

  if (income === 0 && expense === 0) {
    return {
      headline:
        'Add more transactions to project how savings and spending may evolve.',
      horizon_months: null,
      trajectory: 'insufficient_data',
    };
  }

  if (expense > income && income > 0) {
    const gap = expense - income;
    return {
      headline: `You may run out of breathing room in roughly 3–6 months if outflows stay about ${CURRENCY}${Math.round(gap)} above income each period—tighten discretionary spend or lift income soon.`,
      horizon_months: 6,
      trajectory: 'runway_risk',
    };
  }

  if (growth != null && growth > 10 && net >= 0) {
    return {
      headline: `Expenses rose ~${Math.round(growth)}% vs the prior window. If that trend holds, your surplus could fade within about 6 months.`,
      horizon_months: 6,
      trajectory: 'expense_rising',
    };
  }

  if (net > 0 && income > 0) {
    const pct = Math.round((net / income) * 100);
    return {
      headline: `You are retaining about ${pct}% of income after expenses—savings trajectory looks stable if spending stays in this range.`,
      horizon_months: null,
      trajectory: 'stable_surplus',
    };
  }

  if (net <= 0 && income === 0) {
    return {
      headline:
        'Income in this window looks incomplete—log regular inflows so we can estimate savings a few months ahead.',
      horizon_months: null,
      trajectory: 'income_sparse',
    };
  }

  return {
    headline:
      'Small, steady trims to variable categories usually improve your 6‑month outlook more than one-off cuts.',
    horizon_months: 6,
    trajectory: 'neutral',
  };
};

export { buildFuturePrediction };

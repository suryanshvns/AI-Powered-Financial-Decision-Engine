const CURRENCY = '₹';

const getTopExpenseCategory = (category_breakdown) => {
  let best = null;
  let max = 0;
  for (const [name, v] of Object.entries(category_breakdown || {})) {
    const exp = Number(v.expense) || 0;
    if (exp > max) {
      max = exp;
      best = name;
    }
  }
  if (!best || max <= 0) return null;
  const pct = category_breakdown[best].pct_of_income;
  return { category: best, pct_of_income: pct, expense: max };
};

const generateInsights = (features, opts = {}) => {
  const insights = [];
  const { category_breakdown, expense_growth_rate, total_expense, total_income } =
    features;
  const subCat = opts.subscriptionCategoryHint || 'Subscriptions';

  const top = getTopExpenseCategory(category_breakdown);
  if (top && top.pct_of_income != null && total_income > 0) {
    insights.push(
      `You spend ${Math.round(top.pct_of_income)}% of income on ${top.category}`,
    );
  }

  if (
    expense_growth_rate != null &&
    Number.isFinite(expense_growth_rate) &&
    total_expense > 0
  ) {
    const dir = expense_growth_rate >= 0 ? 'increased' : 'decreased';
    insights.push(
      `Expenses ${dir} ${Math.abs(Math.round(expense_growth_rate))}% vs the prior period`,
    );
  }

  if (category_breakdown && category_breakdown[subCat]) {
    const subExp = Number(category_breakdown[subCat].expense) || 0;
    if (subExp > 0) {
      const hypothetical = Math.round(subExp * 0.25);
      if (hypothetical > 0) {
        insights.push(
          `You can save ${CURRENCY}${hypothetical} by reducing ${subCat} by ~25%`,
        );
      }
    }
  } else {
    const generic = Math.round((total_expense || 0) * 0.08);
    if (generic > 0) {
      insights.push(
        `You can save ${CURRENCY}${generic} by trimming discretionary spend by ~8%`,
      );
    }
  }

  if (features.savings_ratio_raw != null && features.savings_ratio_raw > 0.25) {
    insights.push('Your savings rate is healthy relative to income');
  }

  return insights;
};

const pickMainIssueText = (features, alerts, reasons) => {
  if (Array.isArray(alerts) && alerts.length > 0) {
    return String(alerts[0].message ?? 'Review spending alerts');
  }
  if (Array.isArray(reasons) && reasons.length > 0) {
    return String(reasons[0]);
  }
  const top = getTopExpenseCategory(features.category_breakdown);
  if (top && top.pct_of_income != null && features.total_income > 0 && top.pct_of_income >= 32) {
    return `You spend a large share of income on ${top.category} (~${Math.round(top.pct_of_income)}%).`;
  }
  if (
    features.expense_growth_rate != null &&
    features.expense_growth_rate > 12
  ) {
    return `Expenses jumped about ${Math.round(features.expense_growth_rate)}% compared to the prior period.`;
  }
  return 'No single red flag—keep tracking to stay ahead of drift.';
};

const pickSuggestionText = (features, insights) => {
  if (Array.isArray(insights) && insights.length > 0) {
    const actionable = insights.find(
      (s) => typeof s === 'string' && (s.includes('save') || s.includes('trim') || s.includes('reducing')),
    );
    if (actionable) return actionable;
    return String(insights[0]);
  }
  const generic = Math.round((features.total_expense || 0) * 0.07);
  if (generic > 0) {
    return `Try shaving about ${CURRENCY}${generic}/month from discretionary categories for a quick win.`;
  }
  return 'Log income and expenses regularly so suggestions stay specific.';
};

const buildExplanation = (features, alerts, reasons, scoreComponents) => {
  const factors = [];
  const income = Number(features.total_income) || 0;
  const expense = Number(features.total_expense) || 0;
  const sr =
    features.savings_ratio_raw !== undefined
      ? features.savings_ratio_raw
      : features.savings_ratio;

  if (income > 0) {
    factors.push({
      label: 'Savings rate',
      detail:
        sr != null && Number.isFinite(sr)
          ? `You kept about ${Math.round(sr * 100)}% of income after expenses in this window.`
          : 'Savings rate could not be computed reliably.',
      impact: sr != null && sr >= 0.15 ? 'positive' : 'negative',
    });
  }

  if (income > 0) {
    const er = expense / income;
    factors.push({
      label: 'Expense load',
      detail: `Expenses were about ${Math.round(er * 100)}% of income.`,
      impact: er <= 0.75 ? 'positive' : er <= 0.95 ? 'neutral' : 'negative',
    });
  }

  if (scoreComponents) {
    factors.push({
      label: 'Model & rules blend',
      detail:
        'Your score blends savings cushion, expense pressure, and ML/rule risk signals.',
      impact: 'neutral',
    });
  }

  if (Array.isArray(alerts) && alerts.length > 0) {
    factors.push({
      label: 'Alerts',
      detail: String(alerts[0].message ?? ''),
      impact: String(alerts[0].severity) === 'high' ? 'negative' : 'neutral',
    });
  }

  if (Array.isArray(reasons) && reasons.length > 0) {
    factors.push({
      label: 'Rules',
      detail: reasons.join(' · '),
      impact: 'neutral',
    });
  }

  return { factors };
};

export {
  getTopExpenseCategory,
  generateInsights,
  pickMainIssueText,
  pickSuggestionText,
  buildExplanation,
};

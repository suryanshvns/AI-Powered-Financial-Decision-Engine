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

export { getTopExpenseCategory, generateInsights };

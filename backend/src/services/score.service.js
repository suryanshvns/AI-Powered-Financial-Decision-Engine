const extractMlRisk01 = (modelData) => {
  if (!modelData || typeof modelData !== 'object') return null;
  const raw =
    modelData.risk_score ??
    modelData.risk ??
    modelData.default_risk ??
    modelData.score;
  if (raw === undefined || raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n > 1) return Math.min(1, Math.max(0, n / 100));
  return Math.min(1, Math.max(0, n));
};

const savingsDimension = (features) => {
  const income = Number(features.total_income) || 0;
  if (income <= 0) return 50;
  const sr =
    features.savings_ratio_raw !== undefined
      ? features.savings_ratio_raw
      : features.savings_ratio;
  if (sr == null || !Number.isFinite(sr)) return 50;
  return Math.round(Math.max(0, Math.min(100, 50 + sr * 100)));
};

const expenseStressDimension = (features) => {
  const income = Number(features.total_income) || 0;
  const expense = Number(features.total_expense) || 0;
  if (income <= 0) {
    return expense > 0 ? 20 : 55;
  }
  const ratio = expense / income;
  if (ratio <= 0.5) return 95;
  if (ratio <= 0.7) return 85;
  if (ratio <= 0.85) return 70;
  if (ratio <= 1) return 50;
  return Math.max(0, Math.round(40 - (ratio - 1) * 80));
};

const mlDimension = (risk01) => {
  if (risk01 == null || !Number.isFinite(risk01)) return 60;
  return Math.round((1 - risk01) * 100);
};

const combineScore = (savings, expenseStress, mlPart) =>
  Math.round(
    Math.max(0, Math.min(100, 0.38 * savings + 0.37 * expenseStress + 0.25 * mlPart)),
  );

const statusFromHealthScore = (score) => {
  if (score >= 75) return 'LOW';
  if (score >= 55) return 'MODERATE';
  if (score >= 35) return 'HIGH';
  return 'CRITICAL';
};

const computeHealthScore = (features, ruleRiskScore, modelData) => {
  const mlRisk = extractMlRisk01(modelData);
  const rule01 =
    ruleRiskScore != null && Number.isFinite(Number(ruleRiskScore))
      ? Number(ruleRiskScore)
      : 0.35;
  const blendedMl =
    mlRisk != null ? 0.55 * rule01 + 0.45 * mlRisk : rule01;
  const savings = savingsDimension(features);
  const expenseStress = expenseStressDimension(features);
  const mlPart = mlDimension(blendedMl);
  const score = combineScore(savings, expenseStress, mlPart);
  return {
    score,
    status: statusFromHealthScore(score),
    components: {
      savings_contribution: savings,
      expense_stress_contribution: expenseStress,
      risk_model_contribution: mlPart,
    },
  };
};

export {
  extractMlRisk01,
  computeHealthScore,
  statusFromHealthScore,
};

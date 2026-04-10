const computeRiskScore = (riskLevel, features, reasonCount) => {
  const n = Number(reasonCount) || 0;
  if (riskLevel === 'HIGH') {
    if (n >= 2) return 0.95;
    if (features.total_expense > features.total_income) return 0.82;
    return 0.68;
  }
  if (riskLevel === 'MEDIUM') {
    return 0.52;
  }
  const sr =
    features.savings_ratio_raw !== undefined
      ? features.savings_ratio_raw
      : features.savings_ratio;
  if (sr == null) return 0.2;
  return Math.max(0, Math.min(1, 0.5 - sr * 0.5));
};

export { computeRiskScore };

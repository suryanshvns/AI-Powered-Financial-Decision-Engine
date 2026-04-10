import * as dashboardService from './dashboard.service.js';

const riskScoreTo01 = (score) => {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0.35;
  if (n > 1.5) return Math.min(1, Math.max(0, n / 100));
  return Math.min(1, Math.max(0, n));
};

const statusFromRiskLevel = (level) => {
  const s = String(level ?? '').toUpperCase();
  if (s.includes('HIGH') || s.includes('CRITICAL')) return 'Needs attention';
  if (s.includes('MEDIUM') || s.includes('MODERATE')) return 'Moderate';
  if (s.includes('LOW')) return 'Strong';
  return 'Moderate';
};

const buildMainIssue = (alerts, reasons) => {
  if (Array.isArray(alerts) && alerts.length > 0) {
    const a = alerts[0];
    const sev = String(a.severity ?? 'medium').toLowerCase();
    const severity =
      sev === 'high' || sev === 'critical' ? 'risk' : sev === 'low' ? 'good' : 'warning';
    const type = String(a.type ?? '').toLowerCase();
    const title =
      type.includes('overspend') || type.includes('income')
        ? 'Spending pressure'
        : type.includes('saving')
          ? 'Savings rate'
          : 'Something to watch';
    return {
      title,
      detail: String(a.message ?? ''),
      severity,
    };
  }
  if (Array.isArray(reasons) && reasons.length > 0) {
    return {
      title: 'Risk signal',
      detail: String(reasons[0]),
      severity: 'warning',
    };
  }
  return {
    title: "You're on track",
    detail: 'No urgent issues flagged for this period.',
    severity: 'good',
  };
};

const getSummaryForUser = async (userId, rangeKey) => {
  const dash = await dashboardService.getDashboardForUser(userId, rangeKey);
  const pred = dash.prediction ?? {};
  const risk01 = riskScoreTo01(pred.score);
  const healthScore = Math.round((1 - risk01) * 100);
  const healthStatus = statusFromRiskLevel(pred.risk_level ?? pred.risk);
  const alerts = dash.summary?.alerts ?? [];
  const reasons = Array.isArray(pred.reasons) ? pred.reasons : [];
  const mainIssue = buildMainIssue(alerts, reasons);
  const insights = Array.isArray(dash.insights) ? dash.insights : [];
  const suggestedAction = insights.length
    ? String(insights[0])
    : 'Review your cash flow weekly and trim one discretionary category.';
  const lift = Math.max(6, Math.round((100 - healthScore) * 0.2));
  const projectedHealthScore = Math.min(100, healthScore + lift);
  const simulationPreview = {
    projected_health_score: projectedHealthScore,
    message: `If you follow this plan, your score could reach around ${projectedHealthScore}.`,
  };

  return {
    health_score: healthScore,
    health_status: healthStatus,
    main_issue: mainIssue,
    suggested_action: suggestedAction,
    simulation_preview: simulationPreview,
  };
};

export { getSummaryForUser };

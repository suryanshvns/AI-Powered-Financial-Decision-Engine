import * as dashboardService from './dashboard.service.js';
import * as scoreService from './score.service.js';
import * as predictionService from './prediction.service.js';
import * as insightService from './insight.service.js';

const getSummaryForUser = async (userId, rangeKey) => {
  const dash = await dashboardService.getDashboardForUser(userId, rangeKey);
  const features = dash.features ?? {};
  const pred = dash.prediction ?? {};
  const alerts = dash.summary?.alerts ?? [];
  const reasons = Array.isArray(pred.reasons) ? pred.reasons : [];
  const insights = Array.isArray(dash.insights) ? dash.insights : [];

  const { score, status, components } = scoreService.computeHealthScore(
    features,
    pred.score,
    pred.model,
  );

  const predPack = predictionService.buildFuturePrediction(features);
  const main_issue = insightService.pickMainIssueText(features, alerts, reasons);
  const suggestion = insightService.pickSuggestionText(features, insights);
  const explanation = insightService.buildExplanation(
    features,
    alerts,
    reasons,
    components,
  );

  return {
    health_score: score,
    status,
    main_issue,
    suggestion,
    explanation,
    future_prediction: predPack.headline,
  };
};

export { getSummaryForUser };

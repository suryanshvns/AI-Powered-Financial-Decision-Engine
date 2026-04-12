import config from '../config/index.js';
import * as transactionService from './transactionService.js';
import * as featureService from './feature.service.js';
import * as predictService from './predict.service.js';
import * as insightService from './insight.service.js';
import * as alertService from './alert.service.js';
import {
  cacheGetJson,
  cacheSetJson,
  dashboardCacheKey,
} from './cache.service.js';

const getDashboardForUser = async (userId, rangeKey) => {
  const key = dashboardCacheKey(userId, rangeKey);
  const cached = await cacheGetJson(key);
  if (cached) return cached;

  const { current, prior, windowStart, windowEnd, range } =
    await transactionService.listByUserIdForRange(userId, rangeKey);

  const features = featureService.computeFeatures(current, {
    priorPeriodTransactions: prior,
  });

  const prediction = await predictService.getPredictionForUser(
    userId,
    rangeKey,
    { current, prior },
  );

  const insights = insightService.generateInsights(features);
  const alerts = alertService.buildAlerts(features, current);

  const summary = {
    total_income: features.total_income,
    total_expense: features.total_expense,
    net_balance: features.net_balance,
    savings_ratio: features.savings_ratio,
    rolling_avg_spend_7d: features.rolling_avg_spend_7d,
    rolling_avg_spend_30d: features.rolling_avg_spend_30d,
    expense_growth_rate: features.expense_growth_rate,
    transaction_count: features.transaction_count,
    window: {
      range: range || 'all',
      start: windowStart,
      end: windowEnd,
    },
    alerts,
  };

  const payload = {
    summary,
    prediction: {
      risk_level: prediction.risk_level,
      risk: prediction.risk,
      score: prediction.score,
      reasons: prediction.reasons,
      model: prediction.model,
      ...(prediction.modelError ? { modelError: prediction.modelError } : {}),
      ...(prediction.modelSkipped ? { modelSkipped: true } : {}),
    },
    insights,
    features,
    category_breakdown: features.category_breakdown,
    transactions: current,
  };

  await cacheSetJson(key, payload, config.cacheTtlSeconds.dashboard);
  return payload;
};

export { getDashboardForUser };

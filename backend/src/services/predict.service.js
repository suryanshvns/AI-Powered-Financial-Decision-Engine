import config from '../config/index.js';
import * as transactionService from './transactionService.js';
import * as featureService from './feature.service.js';
import * as ruleService from './rule.service.js';
import * as modelClient from './modelClient.js';
import * as scoringService from './scoring.service.js';
import {
  cacheGetJson,
  cacheSetJson,
  predictCacheKey,
} from './cache.service.js';

const getPredictionForUser = async (userId, rangeKey, reuse = null) => {
  const key = predictCacheKey(userId, rangeKey);
  const cached = await cacheGetJson(key);
  if (cached) return cached;

  let current;
  let prior;
  if (reuse?.current) {
    current = reuse.current;
    prior = reuse.prior ?? [];
  } else {
    const bundle = await transactionService.listByUserIdForRange(
      userId,
      rangeKey,
    );
    current = bundle.current;
    prior = bundle.prior;
  }
  const features = featureService.computeFeatures(current, {
    priorPeriodTransactions: prior,
  });
  const { risk_level, reasons } = await ruleService.evaluateRulesForUser(
    userId,
    features,
  );
  const score = Math.round(
    scoringService.computeRiskScore(risk_level, features, reasons.length) *
      1000,
  ) / 1000;

  const model = await modelClient.predictWithModel(current);

  const data = {
    userId,
    range: rangeKey || 'all',
    risk: risk_level,
    risk_level,
    score,
    reasons,
    features,
    model: model.ok ? model.data : null,
    ...(model.ok || model.skipped ? {} : { modelError: model.error }),
    ...(model.skipped ? { modelSkipped: true } : {}),
  };

  await cacheSetJson(key, data, config.cacheTtlSeconds.predict);
  return data;
};

export { getPredictionForUser };

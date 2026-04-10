import { badRequest } from '../errors/httpErrors.js';
import * as transactionService from './transactionService.js';
import * as featureService from './feature.service.js';
import * as ruleService from './rule.service.js';
import * as modelClient from './modelClient.js';
import * as scoringService from './scoring.service.js';

const validatePercent = (name, value, required = false) => {
  if (value === undefined || value === null) {
    if (required) throw badRequest(`${name} is required`, { field: name });
    return null;
  }
  const p = Number(value);
  if (!Number.isFinite(p) || p < 0 || p > 100) {
    throw badRequest(`${name} must be between 0 and 100`, { field: name });
  }
  return p;
};

const normalizeAdjustments = (adjustments) => {
  if (adjustments === undefined || adjustments === null) {
    return {
      reduce_expense_percent: null,
      increase_income_percent: null,
      category_adjustments: null,
    };
  }
  if (typeof adjustments !== 'object' || Array.isArray(adjustments)) {
    throw badRequest('adjustments must be an object', { field: 'adjustments' });
  }

  const reduce = validatePercent(
    'adjustments.reduce_expense_percent',
    adjustments.reduce_expense_percent,
    false,
  );
  const increase = validatePercent(
    'adjustments.increase_income_percent',
    adjustments.increase_income_percent,
    false,
  );

  let category_adjustments = null;
  if (adjustments.category_adjustments != null) {
    if (
      typeof adjustments.category_adjustments !== 'object' ||
      Array.isArray(adjustments.category_adjustments)
    ) {
      throw badRequest('category_adjustments must be an object', {
        field: 'adjustments.category_adjustments',
      });
    }
    category_adjustments = {};
    for (const [k, v] of Object.entries(adjustments.category_adjustments)) {
      const p = validatePercent(`category_adjustments.${k}`, v, true);
      category_adjustments[k] = p;
    }
  }

  if (
    reduce == null &&
    increase == null &&
    (category_adjustments == null ||
      Object.keys(category_adjustments).length === 0)
  ) {
    return {
      reduce_expense_percent: null,
      increase_income_percent: null,
      category_adjustments: null,
    };
  }

  return {
    reduce_expense_percent: reduce,
    increase_income_percent: increase,
    category_adjustments: category_adjustments,
  };
};

const assessBundle = async (userId, transactions) => {
  const features = featureService.computeFeatures(transactions, {
    priorPeriodTransactions: [],
  });
  const { risk_level, reasons } = await ruleService.evaluateRulesForUser(
    userId,
    features,
  );
  const score = Math.round(
    scoringService.computeRiskScore(risk_level, features, reasons.length) *
      1000,
  ) / 1000;
  const model = await modelClient.predictWithModel(transactions);
  return {
    features,
    risk_level,
    risk: risk_level,
    reasons,
    score,
    model: model.ok ? model.data : null,
    ...(model.ok || model.skipped ? {} : { modelError: model.error }),
    ...(model.skipped ? { modelSkipped: true } : {}),
  };
};

const runSimulation = async (body) => {
  if (body === undefined || body === null || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }

  const { user_id, adjustments } = body;
  if (user_id === undefined || user_id === null) {
    throw badRequest('user_id is required', { field: 'user_id' });
  }

  const userId = Number(user_id);
  if (!Number.isInteger(userId) || userId < 1) {
    throw badRequest('Invalid user_id', { field: 'user_id' });
  }

  const normalized = normalizeAdjustments(adjustments);

  const original = await transactionService.listByUserId(userId);
  const adjusted = featureService.applyTransactionAdjustments(
    original,
    {
      reduce_expense_percent: normalized.reduce_expense_percent,
      increase_income_percent: normalized.increase_income_percent,
      category_adjustments: normalized.category_adjustments,
    },
  );

  const before = await assessBundle(userId, original);
  const after = await assessBundle(userId, adjusted);

  return {
    userId,
    adjustments_applied: {
      reduce_expense_percent: normalized.reduce_expense_percent,
      increase_income_percent: normalized.increase_income_percent,
      category_adjustments: normalized.category_adjustments,
    },
    comparison: {
      before: {
        features: before.features,
        risk_level: before.risk_level,
        score: before.score,
        reasons: before.reasons,
        model: before.model,
        ...(before.modelError ? { modelError: before.modelError } : {}),
        ...(before.modelSkipped ? { modelSkipped: true } : {}),
      },
      after: {
        features: after.features,
        risk_level: after.risk_level,
        score: after.score,
        reasons: after.reasons,
        model: after.model,
        ...(after.modelError ? { modelError: after.modelError } : {}),
        ...(after.modelSkipped ? { modelSkipped: true } : {}),
      },
    },
  };
};

export { runSimulation };

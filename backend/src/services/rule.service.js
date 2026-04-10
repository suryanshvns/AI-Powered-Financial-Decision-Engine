import { query } from '../db/index.js';
import { badRequest } from '../errors/httpErrors.js';
import * as transactionService from './transactionService.js';
import { bustUserCaches } from './cache.service.js';

const RANK = { LOW: 1, MEDIUM: 2, HIGH: 3 };

const DEFAULT_RULES = [
  {
    id: 'expense_over_income',
    metric: 'expense_gt_income',
    risk_level: 'HIGH',
    reason: 'Total expenses exceed total income',
  },
  {
    id: 'low_savings',
    metric: 'savings_ratio_lt',
    value: 0.2,
    risk_level: 'MEDIUM',
    reason: 'Savings ratio is below 20%',
  },
  {
    id: 'high_expense_ratio',
    metric: 'expense_to_income_gt',
    value: 0.95,
    risk_level: 'HIGH',
    reason: 'Expenses exceed 95% of income',
  },
];

const metricMatches = (rule, features) => {
  switch (rule.metric) {
    case 'expense_gt_income':
      return features.total_expense > features.total_income;
    case 'savings_ratio_lt': {
      const thr = Number(rule.value);
      const sr =
        features.savings_ratio_raw !== undefined
          ? features.savings_ratio_raw
          : features.savings_ratio;
      return sr != null && Number.isFinite(sr) && sr < thr;
    }
    case 'expense_to_income_gt': {
      const thr = Number(rule.value);
      if (!(features.total_income > 0)) {
        return features.total_expense > 0;
      }
      return features.total_expense / features.total_income > thr;
    }
    case 'net_balance_lt': {
      const thr = Number(rule.value);
      return features.net_balance < thr;
    }
    default:
      return false;
  }
};

const mergeRisk = (current, next) => {
  if (!current) return next;
  if (!next) return current;
  return RANK[next] > RANK[current] ? next : current;
};

const evaluateRules = (rules, features) => {
  const list = Array.isArray(rules) ? rules : [];
  let risk_level = 'LOW';
  const reasons = [];

  for (const rule of list) {
    if (rule && rule.enabled === false) continue;
    if (!metricMatches(rule, features)) continue;
    const level = rule.risk_level || 'MEDIUM';
    risk_level = mergeRisk(risk_level, level);
    const msg = rule.reason || rule.reason_template || rule.id || 'Rule matched';
    if (msg && !reasons.includes(msg)) reasons.push(msg);
  }

  return { risk_level, reasons };
};

const getRulesForUser = async (userId) => {
  const result = await query(
    `SELECT rules FROM user_rules WHERE user_id = $1`,
    [userId],
  );
  if (result.rowCount === 0) return DEFAULT_RULES;
  const raw = result.rows[0].rules;
  if (Array.isArray(raw) && raw.length > 0) return raw;
  return DEFAULT_RULES;
};

const getEffectiveRulesForUser = async (userId) => {
  await transactionService.assertUserExists(userId);
  return getRulesForUser(userId);
};

const setRulesForUser = async (userId, rules) => {
  if (!Array.isArray(rules)) {
    throw badRequest('rules must be an array', { field: 'rules' });
  }
  await transactionService.assertUserExists(userId);
  await query(
    `
    INSERT INTO user_rules (user_id, rules, updated_at)
    VALUES ($1, $2::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      rules = EXCLUDED.rules,
      updated_at = NOW()
    `,
    [userId, JSON.stringify(rules)],
  );
  await bustUserCaches(userId);
  return getRulesForUser(userId);
};

const evaluateRulesForUser = async (userId, features) => {
  const rules = await getRulesForUser(userId);
  return evaluateRules(rules, features);
};

export {
  DEFAULT_RULES,
  evaluateRules,
  getRulesForUser,
  getEffectiveRulesForUser,
  setRulesForUser,
  evaluateRulesForUser,
};

import { asyncHandler } from '../utils/asyncHandler.js';
import { parseUserIdParam } from '../utils/parseUserId.js';
import * as ruleService from '../services/rule.service.js';

const getByUserId = asyncHandler(async (req, res) => {
  const userId = parseUserIdParam(req.params.userId);
  const rules = await ruleService.getEffectiveRulesForUser(userId);
  res.status(200).json({ success: true, data: { userId, rules } });
});

const putByUserId = asyncHandler(async (req, res) => {
  const userId = parseUserIdParam(req.params.userId);
  const body = req.body ?? {};
  const rules = await ruleService.setRulesForUser(userId, body.rules);
  res.status(200).json({ success: true, data: { userId, rules } });
});

export { getByUserId, putByUserId };

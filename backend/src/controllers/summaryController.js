import { asyncHandler } from '../utils/asyncHandler.js';
import { parseUserIdParam } from '../utils/parseUserId.js';
import { normalizeRangeParam } from '../utils/dateRange.js';
import * as summaryService from '../services/summary.service.js';

const getByUserId = asyncHandler(async (req, res) => {
  const userId = parseUserIdParam(req.params.userId);
  const rangeKey = normalizeRangeParam(req.query.range);
  const data = await summaryService.getSummaryForUser(userId, rangeKey);
  res.status(200).json({ success: true, data });
});

export { getByUserId };

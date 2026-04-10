import { asyncHandler } from '../utils/asyncHandler.js';
import { parseUserIdParam } from '../utils/parseUserId.js';
import { normalizeRangeParam } from '../utils/dateRange.js';
import * as dashboardService from '../services/dashboard.service.js';

const getByUserId = asyncHandler(async (req, res) => {
  const userId = parseUserIdParam(req.params.userId);
  const rangeKey = normalizeRangeParam(req.query.range);
  const data = await dashboardService.getDashboardForUser(userId, rangeKey);
  res.status(200).json({ success: true, data });
});

export { getByUserId };

import { asyncHandler } from '../utils/asyncHandler.js';
import { parseUserIdParam } from '../utils/parseUserId.js';
import { normalizeRangeParam } from '../utils/dateRange.js';
import * as transactionService from '../services/transactionService.js';

const create = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createTransaction(req.body ?? {});
  res.status(201).json({ success: true, data: { transaction } });
});

const getByUserId = asyncHandler(async (req, res) => {
  const userId = parseUserIdParam(req.params.userId);
  const rangeKey = normalizeRangeParam(req.query.range);
  const { current, range, windowStart, windowEnd } =
    await transactionService.listByUserIdForRange(userId, rangeKey);
  res.status(200).json({
    success: true,
    data: {
      userId,
      range: range || 'all',
      window: { start: windowStart, end: windowEnd },
      transactions: current,
    },
  });
});

export { create, getByUserId };

import { asyncHandler } from '../utils/asyncHandler.js';
import * as healthService from '../services/healthService.js';

const getHealth = asyncHandler(async (req, res) => {
  const dbOk = await healthService.checkDatabase();
  const statusCode = dbOk ? 200 : 503;
  res.status(statusCode).json({
    success: dbOk,
    data: {
      status: dbOk ? 'ok' : 'degraded',
      database: dbOk ? 'connected' : 'unreachable',
      timestamp: new Date().toISOString(),
    },
  });
});

export { getHealth };

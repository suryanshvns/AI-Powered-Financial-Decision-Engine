import config from '../config/index.js';
import { errorCodeForStatus } from '../errors/errorCodes.js';
import { isHttpError } from '../errors/httpErrors.js';
import { logger } from '../utils/logger.js';

const safeMessage = (err, statusCode) => {
  if (isHttpError(err)) {
    if (err.expose) return err.message;
    if (!config.isProduction) return err.message;
    return statusCode === 500
      ? 'An unexpected error occurred'
      : err.message;
  }
  if (!config.isProduction && err.message) return err.message;
  return 'An unexpected error occurred';
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const statusCode = isHttpError(err)
    ? err.status
    : err.statusCode && Number.isInteger(err.statusCode)
      ? err.statusCode
      : 500;

  if (statusCode >= 500) {
    logger.error({ err, statusCode }, err.message || 'Server error');
  }

  const message = safeMessage(err, statusCode);
  const code = errorCodeForStatus(statusCode);
  const payload = {
    success: false,
    error: {
      code,
      message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    },
  };

  if (!config.isProduction && err.stack) {
    payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

export { errorHandler };

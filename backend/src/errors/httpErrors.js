import createError, { isHttpError } from 'http-errors';

const badRequest = (message, details) => {
  if (details === undefined) return createError(400, message);
  return createError(400, message, { details });
};

const unauthorized = (message = 'Unauthorized') => createError(401, message);

const forbidden = (message = 'Forbidden') => createError(403, message);

const notFound = (message = 'Resource not found') => createError(404, message);

const conflict = (message, details) => {
  if (details === undefined) return createError(409, message);
  return createError(409, message, { details });
};

const unprocessableEntity = (message, details) => {
  if (details === undefined) return createError(422, message);
  return createError(422, message, { details });
};

const internal = (message = 'An unexpected error occurred') =>
  createError(500, message);

export {
  createError,
  isHttpError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  internal,
};

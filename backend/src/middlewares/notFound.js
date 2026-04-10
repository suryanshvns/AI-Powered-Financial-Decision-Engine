import { createError } from '../errors/httpErrors.js';

const notFound = (req, res, next) => {
  next(
    createError(
      404,
      `No route for ${req.method} ${req.originalUrl}`,
      { expose: true },
    ),
  );
};

export { notFound };

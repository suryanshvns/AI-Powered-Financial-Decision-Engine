import { badRequest } from '../errors/httpErrors.js';

const parseUserIdParam = (param) => {
  const id = Number.parseInt(param, 10);
  if (!Number.isInteger(id) || id < 1) {
    throw badRequest('Invalid user id', {
      field: 'userId',
      reason: 'must be a positive integer',
    });
  }
  return id;
};

export { parseUserIdParam };

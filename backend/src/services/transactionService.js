import { query } from '../db/index.js';
import { badRequest, notFound } from '../errors/httpErrors.js';
import { bustUserCaches } from './cache.service.js';
import {
  getUtcInclusiveWindow,
  addUtcDays,
} from '../utils/dateRange.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_FIELDS = [
  ['user_id', (v) => v != null],
  ['date', (v) => v != null && v !== ''],
  ['amount', (v) => v != null],
  ['category', (v) => v != null && v !== ''],
  ['merchant', (v) => v != null && v !== ''],
  ['type', (v) => v != null && v !== ''],
];

const mapRow = (row) => ({
  ...row,
  amount: row.amount != null ? Number(row.amount) : row.amount,
});

const assertUserExists = async (userId) => {
  const result = await query('SELECT 1 FROM users WHERE id = $1', [userId]);
  if (result.rowCount === 0) {
    throw notFound('User not found');
  }
};

const createTransaction = async (input) => {
  const body = input ?? {};
  const missing = [];
  for (const [name, isPresent] of REQUIRED_FIELDS) {
    if (!isPresent(body[name])) missing.push(name);
  }
  if (missing.length > 0) {
    throw badRequest('Missing required fields', { fields: missing });
  }

  const { user_id, date, amount, category, merchant, type } = body;

  const uid = Number(user_id);
  if (!Number.isInteger(uid) || uid < 1) {
    throw badRequest('Invalid user_id', { field: 'user_id' });
  }

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    throw badRequest('amount must be a positive number', { field: 'amount' });
  }

  const t = String(type).toLowerCase();
  if (t !== 'income' && t !== 'expense') {
    throw badRequest('type must be income or expense', { field: 'type' });
  }

  if (typeof date !== 'string' || !ISO_DATE.test(date)) {
    throw badRequest('date must be YYYY-MM-DD', { field: 'date' });
  }

  await assertUserExists(uid);

  const result = await query(
    `
    INSERT INTO transactions (user_id, "date", amount, category, merchant, "type")
    VALUES ($1, $2::date, $3, $4, $5, $6)
    RETURNING
      id,
      user_id AS "userId",
      "date",
      amount,
      category,
      merchant,
      "type",
      created_at AS "createdAt"
    `,
    [uid, date, amt, String(category).trim(), String(merchant).trim(), t],
  );

  const row = mapRow(result.rows[0]);
  await bustUserCaches(uid);
  return row;
};

const LIST_SELECT = `
    SELECT
      id,
      user_id AS "userId",
      "date",
      amount,
      category,
      merchant,
      "type",
      created_at AS "createdAt"
    FROM transactions
    WHERE user_id = $1
`;

const listByUserId = async (userId) => {
  await assertUserExists(userId);
  const result = await query(
    `${LIST_SELECT}
    ORDER BY "date" DESC, id DESC
    `,
    [userId],
  );
  return result.rows.map(mapRow);
};

const listByUserIdForRange = async (userId, rangeKey, now = new Date()) => {
  await assertUserExists(userId);
  if (!rangeKey || rangeKey === 'all') {
    const current = await listByUserId(userId);
    return {
      current,
      prior: [],
      range: 'all',
      windowStart: null,
      windowEnd: null,
    };
  }

  const { start: curStart, end: curEnd, days } = getUtcInclusiveWindow(
    rangeKey,
    now,
  );
  const priorEnd = addUtcDays(curStart, -1);
  const priorStart = addUtcDays(curStart, -days);

  const result = await query(
    `
    SELECT
      id,
      user_id AS "userId",
      "date",
      amount,
      category,
      merchant,
      "type",
      created_at AS "createdAt"
    FROM transactions
    WHERE user_id = $1
      AND "date" >= $2::date
      AND "date" <= $3::date
    ORDER BY "date" DESC, id DESC
    `,
    [userId, priorStart, curEnd],
  );
  const rows = result.rows.map(mapRow);
  const current = [];
  const prior = [];
  for (const row of rows) {
    const d =
      typeof row.date === 'string'
        ? row.date.slice(0, 10)
        : String(row.date).slice(0, 10);
    if (d >= curStart && d <= curEnd) current.push(row);
    if (d >= priorStart && d <= priorEnd) prior.push(row);
  }
  return {
    current,
    prior,
    range: rangeKey,
    windowStart: curStart,
    windowEnd: curEnd,
  };
};

export {
  assertUserExists,
  createTransaction,
  listByUserId,
  listByUserIdForRange,
};

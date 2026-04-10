import { badRequest } from '../errors/httpErrors.js';

const RANGE_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const formatUtcDate = (d) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseIsoDate = (str) => {
  if (typeof str !== 'string' || str.length < 10) return null;
  const [y, m, d] = str.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
};

const addUtcDays = (isoDateStr, deltaDays) => {
  const d = parseIsoDate(isoDateStr);
  if (!d) return isoDateStr;
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return formatUtcDate(d);
};

const normalizeRangeParam = (raw) => {
  if (raw === undefined || raw === null || raw === '') return null;
  const key = String(raw).trim().toLowerCase();
  if (key === 'all') return 'all';
  if (Object.prototype.hasOwnProperty.call(RANGE_DAYS, key)) return key;
  throw badRequest('Invalid range', {
    field: 'range',
    allowed: ['7d', '30d', '90d', 'all'],
  });
};

const getUtcInclusiveWindow = (rangeKey, now = new Date()) => {
  if (!rangeKey || rangeKey === 'all') {
    return { start: null, end: null, days: null };
  }
  const days = RANGE_DAYS[rangeKey];
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return {
    start: formatUtcDate(start),
    end: formatUtcDate(end),
    days,
  };
};

export {
  normalizeRangeParam,
  getUtcInclusiveWindow,
  formatUtcDate,
  parseIsoDate,
  addUtcDays,
};

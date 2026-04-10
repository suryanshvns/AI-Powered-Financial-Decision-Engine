import dotenv from 'dotenv';

dotenv.config();

const optionalInt = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const optionalBool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  const v = String(value).toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes') return true;
  if (v === '0' || v === 'false' || v === 'no') return false;
  return fallback;
};

const parseCorsOrigins = (raw) => {
  const source = raw?.trim() || 'http://localhost:5001';
  return source
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: optionalInt(process.env.PORT, 3000),
  databaseUrl: process.env.DATABASE_URL?.trim() || null,
  modelServiceUrl:
    process.env.MODEL_SERVICE_URL?.trim() || 'http://localhost:8000',
  modelServiceTimeoutMs: optionalInt(process.env.MODEL_SERVICE_TIMEOUT_MS, 30_000),
  modelServiceEnabled: optionalBool(process.env.MODEL_SERVICE_ENABLED, true),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  redisUrl: process.env.REDIS_URL?.trim() || null,
  cacheTtlSeconds: {
    predict: optionalInt(process.env.CACHE_TTL_PREDICT_SEC, 120),
    dashboard: optionalInt(process.env.CACHE_TTL_DASHBOARD_SEC, 60),
  },
  pg: {
    host: process.env.PGHOST || 'localhost',
    port: optionalInt(process.env.PGPORT, 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'postgres',
  },
};

export { env };

import pg from 'pg';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      ...config.db,
      max: config.isProduction ? 20 : 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected PostgreSQL pool error');
    });
  }
  return pool;
};

const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

export { getPool, closePool };

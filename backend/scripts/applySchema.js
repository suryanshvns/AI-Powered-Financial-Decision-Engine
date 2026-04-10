import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from '../src/db/pool.js';
import { logger } from '../src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const main = async () => {
  const dir = path.join(__dirname, 'sql');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const pool = getPool();
  try {
    for (const file of files) {
      const sqlPath = path.join(dir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      logger.info({ sqlPath }, 'Schema applied');
    }
  } finally {
    await pool.end();
  }
};

main().catch((err) => {
  logger.fatal({ err }, 'Schema migration failed');
  process.exit(1);
});

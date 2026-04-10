import { query } from '../db/index.js';

const checkDatabase = async () => {
  try {
    const result = await query('SELECT 1 AS ok');
    const ok = result.rows[0]?.ok;
    return ok === 1 || ok === '1';
  } catch {
    return false;
  }
};

export { checkDatabase };

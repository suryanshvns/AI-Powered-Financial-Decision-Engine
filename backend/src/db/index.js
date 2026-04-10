import { closePool, getPool } from './pool.js';

const query = async (text, params) => getPool().query(text, params);

const pingDatabase = async () => {
  const client = await getPool().connect();
  try {
    await client.query('SELECT 1 AS ok');
  } finally {
    client.release();
  }
};

export { closePool, getPool, query, pingDatabase };

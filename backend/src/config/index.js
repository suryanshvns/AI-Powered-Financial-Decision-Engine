import { env } from './env.js';

const config = {
  nodeEnv: env.nodeEnv,
  port: env.port,
  isProduction: env.nodeEnv === 'production',
  modelServiceUrl: env.modelServiceUrl,
  modelServiceTimeoutMs: env.modelServiceTimeoutMs,
  modelServiceEnabled: env.modelServiceEnabled,
  corsOrigins: env.corsOrigins,
  redisUrl: env.redisUrl,
  cacheTtlSeconds: env.cacheTtlSeconds,
  db: env.databaseUrl
    ? { connectionString: env.databaseUrl }
    : {
        host: env.pg.host,
        port: env.pg.port,
        user: env.pg.user,
        password: env.pg.password,
        database: env.pg.database,
      },
};

export default config;

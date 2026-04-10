import app from './app.js';
import config from './config/index.js';
import { closePool, pingDatabase } from './db/index.js';
import { logger } from './utils/logger.js';

const start = async () => {
  await pingDatabase();

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, 'HTTP server listening');
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutdown signal received');
    await new Promise((resolve) => server.close(resolve));
    await closePool();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

import cors from 'cors';
import express from 'express';
import pinoHttp from 'pino-http';
import config from './config/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import apiRoutes from './routes/index.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  }),
);

const rootGet = (req, res) => {
  res.status(200).json({
    success: true,
    data: { name: 'financial-decision-engine-api', env: config.nodeEnv },
  });
};
app.get('/', rootGet);

app.use('/api/v1', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { getEnv } from './config/env';
import { requestIdMiddleware, requestIdHeader, loggingMiddleware } from './middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import vehiclesRouter from './routes/vehicles';
import ridesRouter from './routes/rides';
import alertsRouter from './routes/alerts';
import devicesRouter from './routes/devices';

const env = getEnv();

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);
  app.use(requestIdHeader);
  app.use(loggingMiddleware);

  app.use('/health', healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/vehicles', vehiclesRouter);
  app.use('/api/v1/rides', ridesRouter);
  app.use('/api/v1/alerts', alertsRouter);
  app.use('/api/v1/devices', devicesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

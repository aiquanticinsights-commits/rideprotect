import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { getEnv } from '../config/env';

const env = getEnv();

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'rideprotect-backend' },
});

export function loggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      req: {
        id: req.id,
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
      res: {
        statusCode: res.statusCode,
        durationMs: duration,
      },
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'HTTP Request');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'HTTP Request');
    } else {
      logger.info(logData, 'HTTP Request');
    }
  });

  next();
}

export { logger as default };

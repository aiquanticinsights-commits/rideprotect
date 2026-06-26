import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';

const router = Router();

router.get('/', async (_req, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', async (_req, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: 'ready', checks: { database: 'ok', redis: 'ok' } });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      checks: {
        database: 'error',
        redis: 'error',
      },
    });
  }
});

router.get('/live', (_req, res: Response) => {
  res.json({ status: 'alive' });
});

export default router;

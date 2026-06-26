import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authMiddleware, requireAuth } from '../middleware/auth';
import { validateParams } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.use(authMiddleware, requireAuth);

const alertParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string | undefined;
    const severity = req.query.severity as string | undefined;
    const acknowledged = req.query.acknowledged as string | undefined;

    const where: any = {
      ride: { userId: req.user!.sub },
    };
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true';

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          ride: { select: { id: true, startTime: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.alert.count({ where }),
    ]);

    res.json({ alerts, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/acknowledge', validateParams(alertParamsSchema), async (req, res, next) => {
  try {
    const alert = await prisma.alert.findFirst({
      where: { id: req.params.id as string, ride: { userId: req.user!.sub } },
    });

    if (!alert) throw new NotFoundError('Alert');

    const updated = await prisma.alert.update({
      where: { id: req.params.id as string },
      data: { acknowledged: true, acknowledgedAt: new Date() },
    });

    res.json({ alert: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [totalAlerts, byType, bySeverity] = await Promise.all([
      prisma.alert.count({ where: { ride: { userId: req.user!.sub } } }),
      prisma.alert.groupBy({
        by: ['type'],
        where: { ride: { userId: req.user!.sub } },
        _count: true,
      }),
      prisma.alert.groupBy({
        by: ['severity'],
        where: { ride: { userId: req.user!.sub } },
        _count: true,
      }),
    ]);

    res.json({
      stats: { total: totalAlerts, byType, bySeverity },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

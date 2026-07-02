import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authMiddleware, requireAuth } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.use(authMiddleware, requireAuth);

const startRideSchema = z.object({
  body: z.object({
    vehicleId: z.string().cuid(),
    startLat: z.number().min(-90).max(90),
    startLng: z.number().min(-180).max(180),
  }),
});

const endRideSchema = z.object({
  body: z.object({
    endLat: z.number().min(-90).max(90),
    endLng: z.number().min(-180).max(180),
    distanceKm: z.number().positive().optional(),
    durationSeconds: z.number().positive().optional(),
  }),
});

const rideParamsSchema = z.object({
  id: z.string().cuid(),
});

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const where: any = { userId: req.user!.sub };
    if (status) where.status = status;

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include: { vehicle: { select: { make: true, model: true, licensePlate: true } } },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ride.count({ where }),
    ]);

    res.json({ rides, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateParams(rideParamsSchema), async (req, res, next) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { id: req.params.id as string, userId: req.user!.sub },
      include: {
        vehicle: true,
        alerts: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!ride) throw new NotFoundError('Ride');

    res.json({ ride });
  } catch (error) {
    next(error);
  }
});

router.post('/start', validateBody(startRideSchema), async (req, res, next) => {
  try {
    const { vehicleId, startLat, startLng } = req.body;

    const activeRide = await prisma.ride.findFirst({
      where: { userId: req.user!.sub, status: 'ACTIVE' },
    });

    if (activeRide) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'You already have an active ride' } });
    }

    const ride = await prisma.ride.create({
      data: {
        userId: req.user!.sub,
        vehicleId,
        startLat,
        startLng,
        status: 'ACTIVE',
      },
    });

    res.status(201).json({ ride });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/end', validateParams(rideParamsSchema), validateBody(endRideSchema), async (req, res, next) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { id: req.params.id as string, userId: req.user!.sub, status: 'ACTIVE' },
    });

    if (!ride) throw new NotFoundError('Active ride');

    const now = new Date();
    const durationMs = now.getTime() - ride.startTime.getTime();
    const durationSeconds = Math.round(durationMs / 1000);

    const distanceKm = req.body.distanceKm ?? 0;

    const speedExcesses = await prisma.alert.count({
      where: { rideId: ride.id, type: 'SPEEDING', severity: 'WARNING' },
    });

    const hardBrakes = await prisma.alert.count({
      where: { rideId: ride.id, type: 'HARD_BRAKE' },
    });

    const sharpTurns = await prisma.alert.count({
      where: { rideId: ride.id, type: 'SHARP_TURN' },
    });

    let score = 100;
    score -= Math.min(speedExcesses * 10, 30);
    score -= Math.min(hardBrakes * 5, 20);
    score -= Math.min(sharpTurns * 3, 15);
    score = Math.max(score, 0);

    const updated = await prisma.ride.update({
      where: { id: ride.id },
      data: {
        endLat: req.body.endLat,
        endLng: req.body.endLng,
        endTime: now,
        distanceKm,
        durationSeconds,
        status: 'COMPLETED',
        score,
      },
    });

    res.json({ ride: updated });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/cancel', validateParams(rideParamsSchema), async (req, res, next) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { id: req.params.id as string, userId: req.user!.sub, status: 'ACTIVE' },
    });

    if (!ride) throw new NotFoundError('Active ride');

    const updated = await prisma.ride.update({
      where: { id: ride.id },
      data: { status: 'CANCELLED', endTime: new Date() },
    });

    res.json({ ride: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/score', validateParams(rideParamsSchema), async (req, res, next) => {
  try {
    const ride = await prisma.ride.findFirst({
      where: { id: req.params.id as string, userId: req.user!.sub },
      select: { id: true, score: true, status: true, distanceKm: true, durationSeconds: true },
    });

    if (!ride) throw new NotFoundError('Ride');

    res.json({ score: ride.score ?? null });
  } catch (error) {
    next(error);
  }
});

export default router;

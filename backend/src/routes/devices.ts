import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authMiddleware, requireAuth } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.use(authMiddleware, requireAuth);

const createDeviceSchema = z.object({
  body: z.object({
    deviceId: z.string().min(1).max(100),
    name: z.string().min(1).max(100),
    type: z.enum(['OBD2', 'GPS_TRACKER', 'DASH_CAM', 'MOBILE_APP']),
    firmwareVersion: z.string().optional(),
  }),
});

const updateDeviceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(['OBD2', 'GPS_TRACKER', 'DASH_CAM', 'MOBILE_APP']).optional(),
    firmwareVersion: z.string().optional(),
  }),
});

const deviceParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

router.get('/', async (req, res, next) => {
  try {
    const devices = await prisma.device.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ devices });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateParams(deviceParamsSchema), async (req, res, next) => {
  try {
    const device = await prisma.device.findFirst({
      where: { id: req.params.id as string, userId: req.user!.sub },
    });
    if (!device) throw new NotFoundError('Device');
    res.json({ device });
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(createDeviceSchema), async (req, res, next) => {
  try {
    const existing = await prisma.device.findUnique({
      where: { deviceId: req.body.deviceId },
    });
    if (existing) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Device ID already registered' },
      });
    }

    const device = await prisma.device.create({
      data: { ...req.body, userId: req.user!.sub },
    });

    res.status(201).json({ device });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', validateParams(deviceParamsSchema), validateBody(updateDeviceSchema), async (req, res, next) => {
  try {
    const existing = await prisma.device.findFirst({
      where: { id: req.params.id as string, userId: req.user!.sub },
    });
    if (!existing) throw new NotFoundError('Device');

    const device = await prisma.device.update({
      where: { id: req.params.id as string },
      data: req.body,
    });

    res.json({ device });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', validateParams(deviceParamsSchema), async (req, res, next) => {
  try {
    const existing = await prisma.device.findFirst({
      where: { id: req.params.id as string, userId: req.user!.sub },
    });
    if (!existing) throw new NotFoundError('Device');

    await prisma.device.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Device removed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

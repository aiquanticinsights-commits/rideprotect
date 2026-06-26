import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authMiddleware, requireAuth } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { NotFoundError, ForbiddenError } from '../utils/errors';

const router = Router();

router.use(authMiddleware, requireAuth);

const createVehicleSchema = z.object({
  body: z.object({
    make: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    licensePlate: z.string().min(1).max(20),
    vin: z.string().min(17).max(17).optional(),
    color: z.string().max(30).optional(),
  }),
});

const updateVehicleSchema = z.object({
  body: z.object({
    make: z.string().min(1).max(50).optional(),
    model: z.string().min(1).max(50).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    licensePlate: z.string().min(1).max(20).optional(),
    vin: z.string().min(17).max(17).optional(),
    color: z.string().max(30).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().cuid(),
  }),
});

const vehicleParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

router.get('/', async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ vehicles });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validateParams(vehicleParamsSchema), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id as string, userId: req.user!.sub },
    });

    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    res.json({ vehicle });
  } catch (error) {
    next(error);
  }
});

router.post('/', validateBody(createVehicleSchema), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        ...req.body,
        userId: req.user!.sub,
      },
    });

    res.status(201).json({ vehicle });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', validateParams(vehicleParamsSchema), validateBody(updateVehicleSchema), async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({
      where: { id: req.params.id as string, userId: req.user!.sub },
    });

    if (!existing) {
      throw new NotFoundError('Vehicle');
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id as string },
      data: req.body,
    });

    res.json({ vehicle });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', validateParams(vehicleParamsSchema), async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({
      where: { id: req.params.id as string, userId: req.user!.sub },
    });

    if (!existing) {
      throw new NotFoundError('Vehicle');
    }

    await prisma.vehicle.delete({ where: { id: req.params.id as string } });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

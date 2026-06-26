import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { authMiddleware, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { NotFoundError } from '../utils/errors';

const router = Router();

router.use(authMiddleware, requireAuth);

const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', validateBody(updateUserSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: req.body,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;

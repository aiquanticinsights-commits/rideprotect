import { Request, Response, NextFunction } from 'express';
import { verifyToken, getTokenFromHeader, TokenPayload } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../config/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const payload = await verifyToken(token);

    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    if (!payload.sessionId) {
      throw new UnauthorizedError('Invalid session');
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      select: { id: true, expiresAt: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Session expired');
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) {
      return next();
    }

    const payload = await verifyToken(token);

    if (payload.type !== 'access') {
      return next();
    }

    if (!payload.sessionId) {
      return next();
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      select: { id: true, expiresAt: true },
    });

    if (session && session.expiresAt >= new Date()) {
      req.user = payload;
    }
    next();
  } catch {
    next();
  }
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  next();
}

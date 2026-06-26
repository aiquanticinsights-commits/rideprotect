import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  req.id = req.headers['x-request-id'] as string || crypto.randomUUID();
  req.startTime = Date.now();
  next();
}

export function requestIdHeader(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader('X-Request-ID', req.id);
  next();
}

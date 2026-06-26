import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errors';

interface ValidatedRequest {
  body: unknown;
  query: unknown;
  params: unknown;
}

export function validate<T extends ValidatedRequest>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        const errors = result.error.flatten();
        throw new ValidationError('Validation failed', errors);
      }

      req.body = result.data.body ?? req.body;
      req.query = result.data.query as typeof req.query;
      req.params = result.data.params as typeof req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse({ body: req.body });
      if (!result.success) {
        const errors = result.error.flatten();
        throw new ValidationError('Invalid request body', errors);
      }
      const parsed = result.data as { body: unknown };
      req.body = parsed.body ?? req.body;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError('Invalid request body', error.flatten());
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError('Invalid query parameters', error.flatten());
      }
      next(error);
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError('Invalid route parameters', error.flatten());
      }
      next(error);
    }
  };
}

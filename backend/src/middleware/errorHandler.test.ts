import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from './errorHandler';
import { AppError, ValidationError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { ZodError } from 'zod';

function mockReq(): Request {
  return {} as Request;
}

function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext(): NextFunction {
  return jest.fn();
}

describe('errorHandler', () => {
  it('returns custom status and code for AppError', () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();
    const error = new NotFoundError('User');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      }),
    );
  });

  it('returns 400 for ZodError', () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();

    try {
      require('zod').z.string().parse(123);
    } catch (e) {
      errorHandler(e as Error, req, res, next);
    }

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      }),
    );
  });

  it('returns 500 for unknown errors', () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();
    const error = new Error('Something broke');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes details when present on AppError', () => {
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();
    const error = new ValidationError('bad input', { field: 'email' });

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ details: { field: 'email' } }),
      }),
    );
  });

  it('includes stack trace in development mode', () => {
    process.env.NODE_ENV = 'development';
    const req = mockReq();
    const res = mockRes();
    const next = mockNext();
    const error = new Error('dev error');

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ stack: expect.any(String) }),
      }),
    );
    process.env.NODE_ENV = 'test';
  });
});

describe('notFoundHandler', () => {
  it('returns 404 with NOT_FOUND code', () => {
    const req = mockReq();
    const res = mockRes();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'NOT_FOUND', message: 'Route not found' }),
      }),
    );
  });
});

import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, TooManyRequestsError, isAppError } from './errors';

describe('AppError', () => {
  it('creates with default values', () => {
    const err = new AppError('test');
    expect(err.message).toBe('test');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.name).toBe('AppError');
  });

  it('creates with custom status and code', () => {
    const err = new AppError('custom', 418, 'TEAPOT');
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('TEAPOT');
  });

  it('stores optional details', () => {
    const details = { field: 'email' };
    const err = new AppError('test', 400, 'VALIDATION', details);
    expect(err.details).toEqual(details);
  });
});

describe('ValidationError', () => {
  it('creates with 400 status and VALIDATION_ERROR code', () => {
    const err = new ValidationError('Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.name).toBe('ValidationError');
  });

  it('accepts optional details', () => {
    const err = new ValidationError('bad', { field: 'name' });
    expect(err.details).toEqual({ field: 'name' });
  });
});

describe('NotFoundError', () => {
  it('formats message without id', () => {
    const err = new NotFoundError('User');
    expect(err.message).toBe('User not found');
    expect(err.statusCode).toBe(404);
  });

  it('formats message with id', () => {
    const err = new NotFoundError('Ride', 'abc-123');
    expect(err.message).toBe('Ride with id abc-123 not found');
  });
});

describe('UnauthorizedError', () => {
  it('uses default message', () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe('Unauthorized');
    expect(err.statusCode).toBe(401);
  });

  it('accepts custom message', () => {
    const err = new UnauthorizedError('Bad token');
    expect(err.message).toBe('Bad token');
  });
});

describe('ForbiddenError', () => {
  it('creates with 403 status', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});

describe('ConflictError', () => {
  it('creates with 409 status and details', () => {
    const err = new ConflictError('email exists', { field: 'email' });
    expect(err.statusCode).toBe(409);
    expect(err.details).toEqual({ field: 'email' });
  });
});

describe('TooManyRequestsError', () => {
  it('creates with 429 status', () => {
    const err = new TooManyRequestsError();
    expect(err.statusCode).toBe(429);
    expect(err.message).toBe('Too many requests');
  });
});

describe('isAppError', () => {
  it('returns true for AppError instances', () => {
    expect(isAppError(new AppError('x'))).toBe(true);
    expect(isAppError(new ValidationError('x'))).toBe(true);
    expect(isAppError(new NotFoundError('x'))).toBe(true);
  });

  it('returns false for regular Error', () => {
    expect(isAppError(new Error('x'))).toBe(false);
  });

  it('returns false for non-errors', () => {
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});

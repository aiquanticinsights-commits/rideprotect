import { z } from 'zod';
import { Request } from 'express';
import { validate, validateBody, validateQuery, validateParams } from './validation';

function mockRequest(overrides: Partial<Request> = {}): Request {
  return { body: {}, query: {}, params: {}, ...overrides } as Request;
}

function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return jest.fn();
}

describe('validateBody', () => {
  const schema = z.object({
    body: z.object({
      name: z.string().min(1),
      age: z.number().positive(),
    }),
  });

  it('passes valid body', () => {
    const req = mockRequest({ body: { name: 'John', age: 25 } });
    const res = mockResponse();
    const next = mockNext();

    validateBody(schema)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('rejects invalid body', () => {
    const req = mockRequest({ body: { name: '', age: -1 } });
    const res = mockResponse();
    const next = mockNext();

    validateBody(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('rejects missing fields', () => {
    const req = mockRequest({ body: {} });
    const res = mockResponse();
    const next = mockNext();

    validateBody(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('validateQuery', () => {
  const schema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  });

  it('passes valid query', () => {
    const req = mockRequest({ query: { page: '1', limit: '20' } });
    const res = mockResponse();
    const next = mockNext();

    validateQuery(schema)(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('validateParams', () => {
  const schema = z.object({
    id: z.string().cuid(),
  });

  it('passes valid params', () => {
    const req = mockRequest({ params: { id: 'clx1234567890abcdefghijkl' } });
    const res = mockResponse();
    const next = mockNext();

    validateParams(schema)(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid params', () => {
    const req = mockRequest({ params: { id: 'not-a-cuid' } });
    const res = mockResponse();
    const next = mockNext();

    validateParams(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('validate', () => {
  const schema = z.object({
    body: z.object({ name: z.string() }),
    query: z.object({ page: z.string().optional() }),
    params: z.object({ id: z.string() }),
  });

  it('passes when all parts are valid', () => {
    const req = mockRequest({
      body: { name: 'test' },
      query: { page: '1' },
      params: { id: 'abc' },
    });
    const res = mockResponse();
    const next = mockNext();

    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

import { authMiddleware, requireAuth } from './auth';
import { signAccessToken } from '../utils/jwt';

jest.mock('../config/prisma', () => {
  const { createMockPrisma } = require('../test/mocks/prisma');
  return { prisma: createMockPrisma() };
});

import { prisma } from '../config/prisma';

function mockReq(overrides: any = {}) {
  return { headers: {}, user: undefined, ...overrides } as any;
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return jest.fn();
}

describe('authMiddleware', () => {
  it('sets req.user for valid token', async () => {
    const session = { id: 'session-1', expiresAt: new Date(Date.now() + 86400000) };
    (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);

    const token = await signAccessToken('user-1', 'test@test.com', 'session-1');
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user!.sub).toBe('user-1');
    expect(next).toHaveBeenCalled();
  });

  it('calls next with error for missing token', async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with error for invalid token', async () => {
    const req = mockReq({ headers: { authorization: 'Bearer bad-token' } });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('calls next with error for expired session', async () => {
    const session = { id: 'session-1', expiresAt: new Date(Date.now() - 86400000) };
    (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);

    const token = await signAccessToken('user-1', 'test@test.com', 'session-1');
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with error for refresh token used on access endpoint', async () => {
    const { signRefreshToken } = require('../utils/jwt');
    const session = { id: 'session-1', expiresAt: new Date(Date.now() + 86400000) };
    (prisma.session.findUnique as jest.Mock).mockResolvedValue(session);

    const token = await signRefreshToken('user-1', 'test@test.com', 'session-1');
    const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('requireAuth', () => {
  it('passes through when req.user is set', () => {
    const req = mockReq({ user: { sub: 'user-1' } });
    const res = mockRes();
    const next = mockNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('throws when req.user is not set', () => {
    const req = mockReq({ user: undefined });
    const res = mockRes();
    const next = mockNext();

    expect(() => requireAuth(req, res, next)).toThrow('Authentication required');
  });
});

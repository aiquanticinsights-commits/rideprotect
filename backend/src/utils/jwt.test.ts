import { signAccessToken, signRefreshToken, verifyToken, decodeToken, getTokenFromHeader } from './jwt';

describe('signAccessToken', () => {
  it('returns a valid JWT string', async () => {
    const token = await signAccessToken('user-1', 'test@test.com', 'session-1');
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('can be verified after signing', async () => {
    const token = await signAccessToken('user-1', 'test@test.com', 'session-1');
    const payload = await verifyToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('test@test.com');
    expect(payload.type).toBe('access');
    expect(payload.sessionId).toBe('session-1');
  });

  it('works without sessionId', async () => {
    const token = await signAccessToken('user-1', 'test@test.com');
    const payload = await verifyToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.sessionId).toBeUndefined();
  });
});

describe('signRefreshToken', () => {
  it('returns a refresh type token', async () => {
    const token = await signRefreshToken('user-1', 'test@test.com', 'session-1');
    const payload = await verifyToken(token);
    expect(payload.type).toBe('refresh');
    expect(payload.sessionId).toBe('session-1');
  });
});

describe('verifyToken', () => {
  it('rejects an invalid token', async () => {
    await expect(verifyToken('invalid.token.here')).rejects.toThrow('Invalid or expired token');
  });

  it('rejects a tampered token', async () => {
    const token = await signAccessToken('user-1', 'test@test.com');
    const parts = token.split('.');
    parts[2] = 'tampered';
    await expect(verifyToken(parts.join('.'))).rejects.toThrow('Invalid or expired token');
  });

  it('rejects a token signed with different secret', async () => {
    await expect(verifyToken('eyJhbGciOiJIUzI1NiJ9.dGVzdA.dGVzdA')).rejects.toThrow();
  });
});

describe('decodeToken', () => {
  it('returns payload for valid token', async () => {
    const token = await signAccessToken('user-1', 'test@test.com');
    const payload = await decodeToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user-1');
  });

  it('returns null for invalid token', async () => {
    const payload = await decodeToken('bad-token');
    expect(payload).toBeNull();
  });
});

describe('getTokenFromHeader', () => {
  it('extracts Bearer token', () => {
    const result = getTokenFromHeader('Bearer mytoken123');
    expect(result).toBe('mytoken123');
  });

  it('returns null for non-Bearer scheme', () => {
    const result = getTokenFromHeader('Basic dXNlcjpwYXNz');
    expect(result).toBeNull();
  });

  it('returns null for undefined header', () => {
    const result = getTokenFromHeader(undefined);
    expect(result).toBeNull();
  });

  it('returns null for empty header', () => {
    const result = getTokenFromHeader('');
    expect(result).toBeNull();
  });
});

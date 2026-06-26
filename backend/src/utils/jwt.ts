import { SignJWT, jwtVerify, JWTPayload, decodeProtectedHeader } from 'jose';
import { getEnv } from '../config/env';
import { UnauthorizedError } from './errors';

const env = getEnv();

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  sessionId?: string;
}

export async function signAccessToken(
  userId: string,
  email: string,
  sessionId?: string
): Promise<string> {
  return new SignJWT({ sub: userId, email, type: 'access', sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(secret);
}

export async function signRefreshToken(
  userId: string,
  email: string,
  sessionId: string
): Promise<string> {
  return new SignJWT({ sub: userId, email, type: 'refresh', sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function decodeToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' ? token : null;
}

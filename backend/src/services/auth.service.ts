import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { getEnv } from '../config/env';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError } from '../utils/errors';

const env = getEnv();

export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new ConflictError('Email already registered');

  if (data.phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingPhone) throw new ConflictError('Phone number already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: { ...data, passwordHash },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true },
  });

  const tokens = await generateTokens(user.id, user.email);
  return { user, ...tokens };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  const tokens = await generateTokens(user.id, user.email);
  return {
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone },
    ...tokens,
  };
}

export async function refreshTokens(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw new UnauthorizedError('User not found');

  const tokens = await generateTokens(user.id, user.email);
  return tokens;
}

async function generateTokens(userId: string, email: string) {
  const session = await prisma.session.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const accessToken = await signAccessToken(userId, email, session.id);
  const refreshToken = await signRefreshToken(userId, email, session.id);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
}

export async function logoutUser(userId: string, token?: string) {
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}

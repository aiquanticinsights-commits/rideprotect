import { prisma } from '../config/prisma';
import { NotFoundError } from '../utils/errors';

export async function getRides(userId: string, options: { page?: number; limit?: number; status?: string }) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const where: any = { userId };

  if (options.status) where.status = options.status;

  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where,
      include: { vehicle: { select: { make: true, model: true, licensePlate: true } } },
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ride.count({ where }),
  ]);

  return { rides, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getRideById(userId: string, rideId: string) {
  const ride = await prisma.ride.findFirst({
    where: { id: rideId, userId },
    include: { vehicle: true, alerts: { orderBy: { createdAt: 'desc' } } },
  });
  if (!ride) throw new NotFoundError('Ride');
  return ride;
}

export async function startRide(userId: string, vehicleId: string, startLat: number, startLng: number) {
  const active = await prisma.ride.findFirst({ where: { userId, status: 'ACTIVE' } });
  if (active) {
    throw new Error('You already have an active ride');
  }

  return prisma.ride.create({
    data: { userId, vehicleId, startLat, startLng, status: 'ACTIVE' },
  });
}

export async function endRide(userId: string, rideId: string, data: {
  endLat: number;
  endLng: number;
  distanceKm?: number;
}) {
  const ride = await prisma.ride.findFirst({ where: { id: rideId, userId, status: 'ACTIVE' } });
  if (!ride) throw new NotFoundError('Active ride');

  const now = new Date();
  const durationSeconds = Math.round((now.getTime() - ride.startTime.getTime()) / 1000);
  const score = await calculateRideScore(rideId);

  return prisma.ride.update({
    where: { id: rideId },
    data: {
      endLat: data.endLat,
      endLng: data.endLng,
      endTime: now,
      distanceKm: data.distanceKm ?? 0,
      durationSeconds,
      status: 'COMPLETED',
      score,
    },
  });
}

export async function cancelRide(userId: string, rideId: string) {
  const ride = await prisma.ride.findFirst({ where: { id: rideId, userId, status: 'ACTIVE' } });
  if (!ride) throw new NotFoundError('Active ride');

  return prisma.ride.update({
    where: { id: rideId },
    data: { status: 'CANCELLED', endTime: new Date() },
  });
}

async function calculateRideScore(rideId: string): Promise<number> {
  const [speedAlerts, brakeAlerts, turnAlerts] = await Promise.all([
    prisma.alert.count({ where: { rideId, type: 'SPEEDING' } }),
    prisma.alert.count({ where: { rideId, type: 'HARD_BRAKE' } }),
    prisma.alert.count({ where: { rideId, type: 'SHARP_TURN' } }),
  ]);

  let score = 100;
  score -= Math.min(speedAlerts * 10, 30);
  score -= Math.min(brakeAlerts * 5, 20);
  score -= Math.min(turnAlerts * 3, 15);
  return Math.max(score, 0);
}

export async function getRideScore(userId: string, rideId: string) {
  const ride = await prisma.ride.findFirst({
    where: { id: rideId, userId },
    select: { id: true, score: true, status: true, distanceKm: true, durationSeconds: true },
  });
  if (!ride) throw new NotFoundError('Ride');
  return ride;
}

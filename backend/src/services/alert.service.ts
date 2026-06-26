import { prisma } from '../config/prisma';
import { NotFoundError } from '../utils/errors';

export async function getAlerts(userId: string, filters: {
  page?: number;
  limit?: number;
  type?: string;
  severity?: string;
  acknowledged?: boolean;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const where: any = { ride: { userId } };

  if (filters.type) where.type = filters.type;
  if (filters.severity) where.severity = filters.severity;
  if (filters.acknowledged !== undefined) where.acknowledged = filters.acknowledged;

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      include: { ride: { select: { id: true, startTime: true, status: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.alert.count({ where }),
  ]);

  return { alerts, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function acknowledgeAlert(userId: string, alertId: string) {
  const alert = await prisma.alert.findFirst({
    where: { id: alertId, ride: { userId } },
  });
  if (!alert) throw new NotFoundError('Alert');

  return prisma.alert.update({
    where: { id: alertId },
    data: { acknowledged: true, acknowledgedAt: new Date() },
  });
}

export async function createAlert(data: {
  rideId: string;
  type: string;
  severity: string;
  message: string;
  metadata?: any;
}) {
  return prisma.alert.create({
    data: {
      rideId: data.rideId,
      type: data.type as any,
      severity: data.severity as any,
      message: data.message,
      metadata: data.metadata ?? undefined,
    },
  });
}

export async function getAlertStats(userId: string) {
  const [total, byType, bySeverity] = await Promise.all([
    prisma.alert.count({ where: { ride: { userId } } }),
    prisma.alert.groupBy({
      by: ['type'],
      where: { ride: { userId } },
      _count: true,
    }),
    prisma.alert.groupBy({
      by: ['severity'],
      where: { ride: { userId } },
      _count: true,
    }),
  ]);

  return { total, byType, bySeverity };
}

import { prisma } from '../config/prisma';
import { NotFoundError, ConflictError } from '../utils/errors';

export async function getUserDevices(userId: string) {
  return prisma.device.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDeviceById(userId: string, deviceId: string) {
  const device = await prisma.device.findFirst({
    where: { id: deviceId, userId },
  });
  if (!device) throw new NotFoundError('Device');
  return device;
}

export async function registerDevice(userId: string, data: {
  deviceId: string;
  name: string;
  type: 'OBD2' | 'GPS_TRACKER' | 'DASH_CAM' | 'MOBILE_APP';
  firmwareVersion?: string;
}) {
  const existing = await prisma.device.findUnique({ where: { deviceId: data.deviceId } });
  if (existing) throw new ConflictError('Device ID already registered');

  return prisma.device.create({
    data: { ...data, userId },
  });
}

export async function updateDevice(userId: string, deviceRecordId: string, data: {
  name?: string;
  type?: 'OBD2' | 'GPS_TRACKER' | 'DASH_CAM' | 'MOBILE_APP';
  firmwareVersion?: string;
}) {
  const existing = await prisma.device.findFirst({
    where: { id: deviceRecordId, userId },
  });
  if (!existing) throw new NotFoundError('Device');

  return prisma.device.update({
    where: { id: deviceRecordId },
    data,
  });
}

export async function removeDevice(userId: string, deviceRecordId: string) {
  const existing = await prisma.device.findFirst({
    where: { id: deviceRecordId, userId },
  });
  if (!existing) throw new NotFoundError('Device');

  await prisma.device.delete({ where: { id: deviceRecordId } });
}

export async function updateDeviceStatus(deviceId: string, status: {
  isOnline?: boolean;
  lastSeen?: Date;
  batteryLevel?: number;
}) {
  return prisma.device.update({
    where: { deviceId },
    data: status,
  });
}

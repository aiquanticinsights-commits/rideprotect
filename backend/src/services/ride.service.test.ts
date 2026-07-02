import { getRides, getRideById, startRide, endRide, cancelRide, getRideScore } from './ride.service';

jest.mock('../config/prisma', () => {
  const { createMockPrisma } = require('../test/mocks/prisma');
  return { prisma: createMockPrisma() };
});

import { prisma } from '../config/prisma';

const mockRide = {
  id: 'ride-1',
  userId: 'user-1',
  vehicleId: 'v-1',
  startLat: 17.443,
  startLng: 78.38,
  startTime: new Date('2026-06-28T10:00:00Z'),
  status: 'ACTIVE',
  vehicle: { make: 'Honda', model: 'CB650R', licensePlate: 'TS-01' },
  alerts: [],
};

describe('getRides', () => {
  it('returns paginated rides', async () => {
    (prisma.ride.findMany as jest.Mock).mockResolvedValue([mockRide]);
    (prisma.ride.count as jest.Mock).mockResolvedValue(1);

    const result = await getRides('user-1', { page: 1, limit: 20 });

    expect(result.rides).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.pages).toBe(1);
  });

  it('filters by status', async () => {
    (prisma.ride.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.ride.count as jest.Mock).mockResolvedValue(0);

    await getRides('user-1', { status: 'COMPLETED' });

    expect(prisma.ride.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'COMPLETED' }),
      }),
    );
  });

  it('returns empty array for no rides', async () => {
    (prisma.ride.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.ride.count as jest.Mock).mockResolvedValue(0);

    const result = await getRides('user-1', { page: 1, limit: 20 });

    expect(result.rides).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe('getRideById', () => {
  it('returns ride when found', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(mockRide);

    const ride = await getRideById('user-1', 'ride-1');

    expect(ride.id).toBe('ride-1');
    expect(prisma.ride.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ride-1', userId: 'user-1' } }),
    );
  });

  it('throws NotFoundError when not found', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(getRideById('user-1', 'nonexistent')).rejects.toThrow('Ride not found');
  });
});

describe('startRide', () => {
  it('creates a new active ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.ride.create as jest.Mock).mockResolvedValue(mockRide);

    const ride = await startRide('user-1', 'v-1', 17.443, 78.38);

    expect(ride).toBeTruthy();
    expect(prisma.ride.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1', vehicleId: 'v-1', status: 'ACTIVE' }),
      }),
    );
  });

  it('throws error if user already has an active ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(mockRide);

    await expect(startRide('user-1', 'v-2', 0, 0)).rejects.toThrow('already have an active ride');
  });
});

describe('endRide', () => {
  it('completes an active ride with score', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(mockRide);
    (prisma.alert.count as jest.Mock).mockResolvedValue(0);
    (prisma.ride.update as jest.Mock).mockResolvedValue({
      ...mockRide,
      status: 'COMPLETED',
      score: 100,
    });

    const ride = await endRide('user-1', 'ride-1', { endLat: 17.44, endLng: 78.38 });

    expect(ride.status).toBe('COMPLETED');
    expect(prisma.ride.update).toHaveBeenCalled();
  });

  it('deducts points for speeding alerts', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(mockRide);
    (prisma.alert.count as jest.Mock).mockImplementation((args) => {
      if (args.where.type === 'SPEEDING') return Promise.resolve(3);
      return Promise.resolve(0);
    });
    (prisma.ride.update as jest.Mock).mockResolvedValue({ ...mockRide, status: 'COMPLETED', score: 70 });

    const ride = await endRide('user-1', 'ride-1', { endLat: 17.44, endLng: 78.38 });

    expect(prisma.ride.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ score: 70 }),
      }),
    );
  });

  it('throws NotFoundError if no active ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(endRide('user-1', 'ride-1', { endLat: 0, endLng: 0 })).rejects.toThrow('Active ride not found');
  });
});

describe('cancelRide', () => {
  it('cancels an active ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(mockRide);
    (prisma.ride.update as jest.Mock).mockResolvedValue({ ...mockRide, status: 'CANCELLED' });

    const ride = await cancelRide('user-1', 'ride-1');

    expect(ride.status).toBe('CANCELLED');
    expect(prisma.ride.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }),
    );
  });

  it('throws NotFoundError if no active ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(cancelRide('user-1', 'ride-1')).rejects.toThrow('Active ride not found');
  });
});

describe('getRideScore', () => {
  it('returns ride with score fields', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue({
      id: 'ride-1',
      score: 85,
      status: 'COMPLETED',
      distanceKm: 12.5,
      durationSeconds: 1800,
    });

    const result = await getRideScore('user-1', 'ride-1');

    expect(result.score).toBe(85);
    expect(result.status).toBe('COMPLETED');
  });

  it('throws NotFoundError when ride does not exist', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(getRideScore('user-1', 'nonexistent')).rejects.toThrow('Ride not found');
  });
});

import request from 'supertest';
import { createApp } from '../app';
import { signAccessToken } from '../utils/jwt';

jest.mock('../config/prisma', () => {
  const { createMockPrisma } = require('../test/mocks/prisma');
  return { prisma: createMockPrisma() };
});

import { prisma } from '../config/prisma';

const app = createApp();

const VEHICLE_ID = 'clxaaaaaaaaaaaaaaaaaaaaaa';
const RIDE_ID_1 = 'clxbbbbbbbbbbbbbbbbbbbbbb';
const RIDE_ID_2 = 'clxcccccccccccccccccccccc';
const NONEXISTENT_ID = 'clxdddddddddddddddddddddd';

const mockVehicle = {
  id: VEHICLE_ID,
  make: 'Honda',
  model: 'CB650R',
  year: 2024,
  licensePlate: 'TS-01',
};

const mockRide = {
  id: RIDE_ID_1,
  userId: 'user-1',
  vehicleId: VEHICLE_ID,
  startLat: 17.443,
  startLng: 78.38,
  startTime: new Date('2026-06-28T10:00:00Z'),
  endTime: null,
  distanceKm: null,
  durationSeconds: null,
  status: 'ACTIVE',
  score: null,
  createdAt: new Date('2026-06-28T10:00:00Z'),
  updatedAt: new Date('2026-06-28T10:00:00Z'),
  vehicle: mockVehicle,
  alerts: [],
};

const completedRide = {
  ...mockRide,
  id: RIDE_ID_2,
  status: 'COMPLETED',
  endTime: new Date('2026-06-28T11:00:00Z'),
  distanceKm: 25.5,
  durationSeconds: 3600,
  score: 85,
};

let token: string;

beforeAll(async () => {
  token = await signAccessToken('user-1', 'test@test.com', 'session-1');
});

beforeEach(() => {
  jest.clearAllMocks();
  (prisma.session.findUnique as jest.Mock).mockResolvedValue({
    id: 'session-1',
    expiresAt: new Date(Date.now() + 86400000),
  });
});

function authHeader() {
  return { Authorization: `Bearer ${token}` };
}

describe('GET /api/v1/rides', () => {
  it('returns paginated rides', async () => {
    (prisma.ride.findMany as jest.Mock).mockResolvedValue([completedRide]);
    (prisma.ride.count as jest.Mock).mockResolvedValue(1);

    const res = await request(app).get('/api/v1/rides').set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.rides).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('returns empty list when no rides', async () => {
    (prisma.ride.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.ride.count as jest.Mock).mockResolvedValue(0);

    const res = await request(app).get('/api/v1/rides').set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.rides).toHaveLength(0);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/rides');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/rides/:id', () => {
  it('returns ride by id', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(completedRide);

    const res = await request(app).get(`/api/v1/rides/${RIDE_ID_2}`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.ride.id).toBe(RIDE_ID_2);
  });

  it('returns 404 for nonexistent ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(`/api/v1/rides/${NONEXISTENT_ID}`).set(authHeader());

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/rides/start', () => {
  it('creates a new ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.ride.create as jest.Mock).mockResolvedValue(mockRide);

    const res = await request(app)
      .post('/api/v1/rides/start')
      .set(authHeader())
      .send({ vehicleId: VEHICLE_ID, startLat: 17.443, startLng: 78.38 });

    expect(res.status).toBe(201);
    expect(res.body.ride.status).toBe('ACTIVE');
  });

  it('rejects duplicate active ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(mockRide);

    const res = await request(app)
      .post('/api/v1/rides/start')
      .set(authHeader())
      .send({ vehicleId: VEHICLE_ID, startLat: 17.443, startLng: 78.38 });

    expect(res.status).toBe(409);
  });

  it('rejects invalid coordinates', async () => {
    const res = await request(app)
      .post('/api/v1/rides/start')
      .set(authHeader())
      .send({ vehicleId: VEHICLE_ID, startLat: 200, startLng: 78.38 });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/rides/:id/end', () => {
  it('ends an active ride with score', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(mockRide);
    (prisma.alert.count as jest.Mock).mockResolvedValue(0);
    (prisma.ride.update as jest.Mock).mockResolvedValue({ ...completedRide, score: 100 });

    const res = await request(app)
      .patch(`/api/v1/rides/${RIDE_ID_1}/end`)
      .set(authHeader())
      .send({ endLat: 17.44, endLng: 78.38 });

    expect(res.status).toBe(200);
    expect(res.body.ride.status).toBe('COMPLETED');
  });

  it('returns 404 if no active ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/v1/rides/${NONEXISTENT_ID}/end`)
      .set(authHeader())
      .send({ endLat: 0, endLng: 0 });

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/rides/:id/cancel', () => {
  it('cancels an active ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(mockRide);
    (prisma.ride.update as jest.Mock).mockResolvedValue({ ...mockRide, status: 'CANCELLED' });

    const res = await request(app)
      .patch(`/api/v1/rides/${RIDE_ID_1}/cancel`)
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.ride.status).toBe('CANCELLED');
  });
});

describe('GET /api/v1/rides/:id/score', () => {
  it('returns score for completed ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue(completedRide);

    const res = await request(app).get(`/api/v1/rides/${RIDE_ID_2}/score`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(85);
  });

  it('returns null for unscored ride', async () => {
    (prisma.ride.findFirst as jest.Mock).mockResolvedValue({ ...mockRide, score: null });

    const res = await request(app).get(`/api/v1/rides/${RIDE_ID_1}/score`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.score).toBeNull();
  });
});

const mockModel = () => ({
  findMany: jest.fn().mockResolvedValue([]),
  findFirst: jest.fn().mockResolvedValue(null),
  findUnique: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue(undefined),
  count: jest.fn().mockResolvedValue(0),
  groupBy: jest.fn().mockResolvedValue([]),
});

export function createMockPrisma() {
  return {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: mockModel(),
    vehicle: mockModel(),
    ride: mockModel(),
    alert: mockModel(),
    device: mockModel(),
    session: mockModel(),
    refreshToken: mockModel(),
  };
}

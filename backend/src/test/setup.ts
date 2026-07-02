process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-key-that-is-at-least-32-chars';
process.env.MQTT_BROKER_URL = 'mqtt://localhost:1883';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.BCRYPT_ROUNDS = '4';
process.env.LOG_LEVEL = 'error';

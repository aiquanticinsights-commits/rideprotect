import { loadEnv } from './config/env';
import { connectRedis, disconnectRedis } from './config/redis';
import { getMqttClient, disconnectMqtt } from './config/mqtt';
import { setupMqttListeners } from './services/mqtt.service';
import { setupWorkers } from './services/queue.service';
import { createApp } from './app';
import { logger } from './middleware/logging';

async function bootstrap() {
  const env = loadEnv();

  logger.info('Starting server...');

  await connectRedis();
  logger.info('Redis connected');

  const mqttClient = getMqttClient();
  if (mqttClient) {
    mqttClient.on('connect', () => {});
    setupMqttListeners();
    logger.info('MQTT configured');
  } else {
    logger.warn('MQTT not configured — IoT features disabled');
  }
  setupWorkers();

  const app = createApp();

  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info(`Server listening on http://${env.HOST}:${env.PORT}`);
  });

  async function shutdown(signal: string) {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(async () => {
      await disconnectRedis();
      await disconnectMqtt();
      logger.info('Server stopped');
      process.exit(0);
    });

    setTimeout(() => {
      logger.fatal('Forced shutdown');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});

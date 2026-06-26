import { Queue, Worker } from 'bullmq';
import { redisWorker } from '../config/redis';

const conn = redisWorker as any;

export const notificationQueue = new Queue('notifications', { connection: conn });
export const analyticsQueue = new Queue('analytics', { connection: conn });
export const webhookQueue = new Queue('webhooks', { connection: conn });

export async function addNotificationJob(data: {
  userId: string;
  type: 'push' | 'email' | 'sms';
  title: string;
  body: string;
  metadata?: any;
}) {
  return notificationQueue.add('send-notification', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
}

export async function addAnalyticsJob(rideId: string) {
  return analyticsQueue.add('process-ride-analytics', { rideId }, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
  });
}

export async function addWebhookJob(event: string, payload: any) {
  return webhookQueue.add('send-webhook', { event, payload }, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

export function setupWorkers() {
  new Worker('notifications', async (job) => {
    const { type, userId, title, body, metadata } = job.data;
    console.log(`Sending ${type} notification to user ${userId}: ${title}`);
  }, { connection: conn });

  new Worker('analytics', async (job) => {
    const { rideId } = job.data;
    console.log(`Processing analytics for ride ${rideId}`);
  }, { connection: conn });

  new Worker('webhooks', async (job) => {
    const { event, payload } = job.data;
    console.log(`Sending webhook for event ${event}`);
  }, { connection: conn });
}

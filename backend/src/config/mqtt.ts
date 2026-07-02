import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { getEnv } from './env';

const env = getEnv();

let client: MqttClient | null = null;

export function getMqttClient(): MqttClient | null {
  if (!env.MQTT_BROKER_URL) {
    return null;
  }

  if (!client) {
    const options: IClientOptions = {
      clientId: env.MQTT_CLIENT_ID,
      username: env.MQTT_USERNAME,
      password: env.MQTT_PASSWORD,
      clean: true,
      connectTimeout: 30000,
      reconnectPeriod: 5000,
      keepalive: 60,
      protocolVersion: 4,
      resubscribe: true,
    };

    client = mqtt.connect(env.MQTT_BROKER_URL, options);

    client.on('connect', () => {
      console.log('?? MQTT connected');
      client?.subscribe('rideprotect/+/events', (err) => {
        if (err) console.error('? MQTT subscribe error:', err);
        else console.log('?? Subscribed to rideprotect/+/events');
      });
      client?.subscribe('rideprotect/+/telemetry', (err) => {
        if (err) console.error('? MQTT subscribe error:', err);
        else console.log('?? Subscribed to rideprotect/+/telemetry');
      });
    });

    client.on('error', (err) => console.error('? MQTT error:', err));
    client.on('close', () => console.warn('?? MQTT connection closed'));
    client.on('offline', () => console.warn('?? MQTT offline'));
  }
  return client;
}

export function publishMqtt(topic: string, payload: object, options?: { qos?: 0 | 1 | 2; retain?: boolean }): void {
  const c = getMqttClient();
  if (!c) return;
  c.publish(topic, JSON.stringify(payload), options ?? { qos: 1 });
}

export async function disconnectMqtt(): Promise<void> {
  if (client) {
    await new Promise<void>((resolve) => client!.end(true, {}, () => resolve()));
    client = null;
  }
}

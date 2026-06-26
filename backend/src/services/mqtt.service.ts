import { getMqttClient, publishMqtt } from '../config/mqtt';
import { prisma } from '../config/prisma';
import { createAlert } from './alert.service';

const DEVICE_EVENTS_TOPIC = 'rideprotect/+/events';
const DEVICE_TELEMETRY_TOPIC = 'rideprotect/+/telemetry';

interface TelemetryData {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  batteryLevel?: number;
  timestamp: string;
}

interface EventData {
  event: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export function setupMqttListeners(): void {
  const client = getMqttClient();

  client.on('message', async (topic: string, payload: Buffer) => {
    try {
      const message = JSON.parse(payload.toString());

      const deviceId = extractDeviceId(topic);
      if (!deviceId) return;

      if (topic.endsWith('/events')) {
        await handleDeviceEvent(deviceId, message);
      } else if (topic.endsWith('/telemetry')) {
        await handleDeviceTelemetry(deviceId, message);
      }
    } catch (err) {
      console.error('MQTT message processing error:', err);
    }
  });
}

function extractDeviceId(topic: string): string | null {
  const parts = topic.split('/');
  return parts.length >= 2 ? parts[1] : null;
}

async function handleDeviceEvent(deviceId: string, data: EventData) {
  const device = await prisma.device.findUnique({ where: { deviceId } });
  if (!device) {
    console.warn(`Unknown device: ${deviceId}`);
    return;
  }

  const activeRide = await prisma.ride.findFirst({
    where: { userId: device.userId, status: 'ACTIVE' },
  });

  if (!activeRide) return;

  const eventAlertMap: Record<string, { type: string; severity: string }> = {
    speeding: { type: 'SPEEDING', severity: 'WARNING' },
    hard_brake: { type: 'HARD_BRAKE', severity: 'WARNING' },
    hard_acceleration: { type: 'HARD_ACCELERATION', severity: 'INFO' },
    sharp_turn: { type: 'SHARP_TURN', severity: 'WARNING' },
    crash: { type: 'CRASH_DETECTED', severity: 'EMERGENCY' },
    sos: { type: 'SOS', severity: 'EMERGENCY' },
    device_disconnected: { type: 'DEVICE_DISCONNECTED', severity: 'CRITICAL' },
    low_battery: { type: 'LOW_BATTERY', severity: 'WARNING' },
  };

  const mapping = eventAlertMap[data.event];
  if (mapping) {
    await createAlert({
      rideId: activeRide.id,
      type: mapping.type,
      severity: mapping.severity,
      message: data.message,
      metadata: data.metadata,
    });
  }
}

async function handleDeviceTelemetry(deviceId: string, data: TelemetryData) {
  await prisma.device.update({
    where: { deviceId },
    data: {
      lastSeen: new Date(),
      isOnline: true,
      batteryLevel: data.batteryLevel,
    },
  });
}

export function sendDeviceCommand(deviceId: string, command: string, payload?: any) {
  publishMqtt(`rideprotect/${deviceId}/commands`, {
    command,
    payload,
    timestamp: new Date().toISOString(),
  });
}

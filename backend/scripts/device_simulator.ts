import mqtt, { MqttClient } from 'mqtt';

const BROKER = process.argv.find(a => a.startsWith('--broker='))?.split('=')[1] ?? 'mqtt://localhost:1883';
const DEVICE_ID = process.argv.find(a => a.startsWith('--device='))?.split('=')[1] ?? 'sim-001';
const INTERVAL = parseInt(process.argv.find(a => a.startsWith('--interval='))?.split('=')[1] ?? '3000', 10);

interface Waypoint {
  lat: number;
  lng: number;
}

const ROUTES: Record<string, Waypoint[]> = {
  'cyberabad-loop': [
    { lat: 17.4445, lng: 78.3798 },
    { lat: 17.4480, lng: 78.3820 },
    { lat: 17.4455, lng: 78.3850 },
    { lat: 17.4415, lng: 78.3826 },
    { lat: 17.4360, lng: 78.3770 },
    { lat: 17.4300, lng: 78.3800 },
    { lat: 17.4250, lng: 78.3750 },
    { lat: 17.4350, lng: 78.3700 },
    { lat: 17.4400, lng: 78.3680 },
    { lat: 17.4445, lng: 78.3798 },
  ],
};

const ROUTE_NAME = process.argv.find(a => a.startsWith('--route='))?.split('=')[1] ?? 'cyberabad-loop';
const route = ROUTES[ROUTE_NAME];
if (!route) {
  console.error(`Unknown route "${ROUTE_NAME}". Available: ${Object.keys(ROUTES).join(', ')}`);
  process.exit(1);
}

const EVENTS = ['speeding', 'hard_brake', 'hard_acceleration', 'sharp_turn', 'low_battery'] as const;

let waypointIndex = 0;
let progress = 0;
const stepsPerSegment = 10;
let speed = 30 + Math.random() * 40;

function interpolate(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getPosition(): { lat: number; lng: number } {
  const from = route[waypointIndex];
  const to = route[(waypointIndex + 1) % route.length];
  const t = progress / stepsPerSegment;
  return {
    lat: interpolate(from.lat, to.lat, t),
    lng: interpolate(from.lng, to.lng, t),
  };
}

function advancePosition(): void {
  progress++;
  if (progress >= stepsPerSegment) {
    progress = 0;
    waypointIndex = (waypointIndex + 1) % route.length;
  }
  speed += (Math.random() - 0.45) * 8;
  speed = Math.max(0, Math.min(90, speed));
}

function getHeading(): number {
  const from = route[waypointIndex];
  const to = route[(waypointIndex + 1) % route.length];
  const dLng = to.lng - from.lng;
  const dLat = to.lat - from.lat;
  const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  return ((angle % 360) + 360) % 360;
}

const TELEMETRY_TOPIC = `rideprotect/${DEVICE_ID}/telemetry`;
const EVENTS_TOPIC = `rideprotect/${DEVICE_ID}/events`;
const COMMANDS_TOPIC = `rideprotect/${DEVICE_ID}/commands`;

function publishTelemetry(client: MqttClient): void {
  const pos = getPosition();
  const telemetry = {
    lat: pos.lat,
    lng: pos.lng,
    speed: Math.round(speed * 10) / 10,
    heading: Math.round(getHeading()),
    batteryLevel: Math.max(10, Math.min(100, Math.round(70 + Math.random() * 25))),
    timestamp: new Date().toISOString(),
  };
  client.publish(TELEMETRY_TOPIC, JSON.stringify(telemetry), { qos: 1 });
  console.log(`[${new Date().toLocaleTimeString()}] TELEMETRY ${JSON.stringify(telemetry)}`);

  if (Math.random() < 0.1) {
    const eventType = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    const messages: Record<string, string> = {
      speeding: 'Speed exceeded 60 km/h',
      hard_brake: 'Sudden braking detected',
      hard_acceleration: 'Rapid acceleration detected',
      sharp_turn: 'Sharp turn detected',
      low_battery: 'Device battery is low',
    };
    const event = {
      event: eventType,
      message: messages[eventType] ?? eventType,
      metadata: eventType === 'speeding' ? { currentSpeed: speed } : undefined,
      timestamp: new Date().toISOString(),
    };
    client.publish(EVENTS_TOPIC, JSON.stringify(event), { qos: 1 });
    console.log(`[${new Date().toLocaleTimeString()}] EVENT     ${JSON.stringify(event)}`);
  }

  advancePosition();
}

console.log(`Device Simulator`);
console.log(`  Broker:   ${BROKER}`);
console.log(`  Device:   ${DEVICE_ID}`);
console.log(`  Route:    ${ROUTE_NAME} (${route.length} waypoints)`);
console.log(`  Interval: ${INTERVAL}ms`);
console.log();

const client = mqtt.connect(BROKER, {
  clientId: DEVICE_ID,
  clean: true,
  connectTimeout: 30000,
  reconnectPeriod: 5000,
  keepalive: 60,
  protocolVersion: 4,
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe(COMMANDS_TOPIC, (err) => {
    if (err) console.error('Subscribe error:', err);
    else console.log(`Subscribed to ${COMMANDS_TOPIC}`);
  });
  console.log(`Publishing telemetry to ${TELEMETRY_TOPIC}`);
  console.log(`Publishing events to ${EVENTS_TOPIC}`);
  console.log();

  setInterval(() => publishTelemetry(client), INTERVAL);
});

client.on('message', (topic, payload) => {
  const cmd = payload.toString();
  console.log(`[${new Date().toLocaleTimeString()}] COMMAND   ${topic} => ${cmd}`);
  try {
    const parsed = JSON.parse(cmd);
    if (parsed.command === 'set-speed') {
      speed = parsed.value ?? speed;
      console.log(`  -> Speed set to ${speed} km/h`);
    }
  } catch {
    console.log(`  -> Raw command: ${cmd}`);
  }
});

client.on('error', (err) => console.error('MQTT error:', err));
client.on('close', () => console.warn('MQTT connection closed'));
client.on('offline', () => console.warn('MQTT offline'));

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  client.end(true);
  process.exit(0);
});

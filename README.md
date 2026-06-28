# RideProtect

A motorcycle safety and ride tracking system built with **Node.js/TypeScript** (backend) and **Flutter** (mobile), with MQTT-based IoT device simulation.

## Architecture

```
┌──────────────────┐     HTTP/JSON     ┌──────────────────────────────────┐
│  Flutter Mobile  │ ◄──────────────►  │  Node.js API Server (Express 5)  │
│  (Web / Desktop) │                   │  TypeScript + Prisma + Zod       │
└──────────────────┘                   │                                  │
                                        │  Routes: /auth /vehicles /rides  │
┌──────────────────┐     MQTT         │  /alerts /devices /health         │
│  Device Simulator│ ◄──────────────►  │                                  │
│  (IoT emulator)  │                   ├──────────────────────────────────┤
└──────────────────┘                   │  PostgreSQL 16 ◄── Prisma ORM    │
                                        │  Redis 7       ◄── BullMQ       │
                                        │  Mosquitto 2.1 ◄── MQTT broker  │
                                        └──────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Node.js 24, TypeScript 6, Express 5 |
| **Database** | PostgreSQL 16 + Prisma ORM |
| **Cache / Queue** | Redis 7 + BullMQ |
| **MQTT** | Eclipse Mosquitto + mqtt.js |
| **Auth** | JWT (jose), bcrypt, session management |
| **Validation** | Zod 4 |
| **Mobile** | Flutter 3.12, Dart 3.12, http, provider |
| **Infrastructure** | Docker, Railway, GitHub Actions |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24.0.0
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL, Redis, MQTT)
- [Flutter SDK](https://flutter.dev/) >= 3.12
- A code editor (VS Code recommended)

## Quick Start

### 1. Start infrastructure

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL 16, Redis 7, and Mosquitto MQTT 2.1.

### 2. Configure environment

```bash
cp .env.example .env
```

Default `.env` works for local development with Docker.

### 3. Apply database migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Start the backend server

```bash
npm run dev
```

Server starts at `http://localhost:3000`.

### 5. Start the device simulator (optional)

In a separate terminal:

```bash
npm run simulate-device -- --device sim-001
```

Publishes telemetry from a **Cyberabad, Hyderabad** route every 3 seconds and random safety events (speeding, hard brake, sharp turn, etc.).

### 6. Run the mobile app

In a separate terminal:

```bash
cd mobile
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000
```

> For Windows desktop: `flutter run -d windows --dart-define=API_BASE_URL=http://localhost:3000`
>
> For Android emulator: `flutter run -d emulator-5554` (default URL `http://10.0.2.2:3000`)

### 7. Demo the app

1. Register a new account or login with an existing one
2. Add a vehicle from the Home screen
3. Tap **Start Ride** → pick a vehicle → ride begins
4. The device simulator publishes real-time telemetry and events
5. Pull-to-refresh on the Ride Detail screen to see alerts
6. Tap **End Ride** → safety score is calculated (0-100)
7. Check the Rides list for history, Alerts screen for all events

## Project Structure

```
rideprotect/
├── backend/
│   ├── src/
│   │   ├── config/          # env, prisma, redis, mqtt
│   │   ├── middleware/       # auth, validation, error handler, logging
│   │   ├── routes/           # health, auth, users, vehicles, rides, alerts, devices
│   │   ├── services/         # auth, ride, alert, mqtt, queue, device
│   │   ├── utils/            # errors, jwt
│   │   ├── app.ts            # Express app factory
│   │   └── index.ts          # Bootstrap entry point
│   ├── scripts/
│   │   └── device_simulator.ts   # MQTT IoT device emulator
│   ├── prisma/
│   │   └── schema.prisma     # Database schema (6 models + 4 enums)
│   └── docker-compose.yml    # PostgreSQL + Redis + Mosquitto
├── mobile/
│   └── lib/
│       ├── config/           # API configuration (env-based)
│       ├── models/            # User, Vehicle, Ride, Alert
│       ├── screens/           # login, register, home, vehicles, rides, ride_detail, alerts, add_vehicle
│       ├── services/          # api_client, vehicle_service, ride_service, alert_service
│       └── main.dart
└── .github/workflows/        # CI for backend build + mobile analyze
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/auth/register` | Register user |
| `POST` | `/api/v1/auth/login` | Login |
| `POST` | `/api/v1/auth/refresh` | Refresh tokens |
| `POST` | `/api/v1/auth/logout` | Logout |
| `GET` | `/api/v1/auth/me` | Current user profile |
| `GET/POST/PATCH/DELETE` | `/api/v1/vehicles` | Vehicle CRUD |
| `GET` | `/api/v1/rides` | List rides (paginated, filterable) |
| `POST` | `/api/v1/rides/start` | Start a ride |
| `PATCH` | `/api/v1/rides/:id/end` | End a ride (calculates score) |
| `PATCH` | `/api/v1/rides/:id/cancel` | Cancel a ride |
| `GET` | `/api/v1/rides/:id` | Ride details with alerts |
| `GET` | `/api/v1/rides/:id/score` | Ride safety score |
| `GET` | `/api/v1/alerts` | List alerts (paginated, filterable) |
| `PATCH` | `/api/v1/alerts/:id/acknowledge` | Acknowledge alert |
| `GET` | `/api/v1/alerts/stats` | Alert statistics |
| `GET/POST/PATCH/DELETE` | `/api/v1/devices` | Device management |

## Device Simulator

The device simulator emulates an IoT tracker publishing telemetry and safety events via MQTT.

```bash
npx ts-node scripts/device_simulator.ts [options]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--broker` | `mqtt://localhost:1883` | MQTT broker URL |
| `--device` | `sim-001` | Device identifier |
| `--interval` | `3000` | Telemetry interval (ms) |
| `--route` | `cyberabad-loop` | Route preset |

**Route:** `cyberabad-loop` — 10 waypoints across Cyberabad/HITEC City, Hyderabad.

**Telemetry** publishes every N ms: `lat`, `lng`, `speed`, `heading`, `batteryLevel`, `timestamp`

**Events** publish randomly (~10% chance per tick): speeding, hard_brake, hard_acceleration, sharp_turn, low_battery

**Commands** subscribed: `set-speed` (via `rideprotect/{deviceId}/commands`)

## Safety Score

The ride safety score starts at 100 and deducts for alerts:

| Alert Type | Deduction | Max Cap |
|-----------|-----------|---------|
| Speeding | -10 per event | 30 |
| Hard Brake | -5 per event | 20 |
| Sharp Turn | -3 per event | 15 |

Score is clamped to 0–100.

## Environment Variables

Key variables (see `backend/src/config/env.ts`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Min 32 characters |
| `MQTT_BROKER_URL` | Yes | — | MQTT broker URL |
| `REDIS_HOST` | No | `localhost` | Redis host |
| `PORT` | No | `3000` | Server port |

## License

MIT

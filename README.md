# 🎬 YouTube Watch Party

A real-time collaborative video watching platform that lets multiple users watch YouTube videos together in perfect sync. When one person plays, pauses, seeks, or changes the video — everyone in the room sees the same action instantly.

---

## ✨ Features

- **Real-time Synchronization** — All participants see the same video state (play/pause, seek position, current video) with sub-second precision
- **Room-based Model** — Create or join watch rooms with unique 6-character codes or shareable links
- **YouTube Integration** — Play YouTube videos in sync using the official YouTube IFrame Player API
- **WebSockets** — Socket.IO for bidirectional real-time communication with Redis adapter for horizontal scaling
- **Role-based Access Control** — Host, Moderator, Participant, and Viewer roles with granular permissions
- **Live Chat** — Real-time messaging with nicknames, role badges, and slow mode support
- **Emoji Reactions** — Floating emoji reactions visible to everyone in the room
- **Persistent Rooms** — Rooms, memberships, playlists, and playback state saved across sessions
- **Authentication** — Clerk-powered sign-in required before joining any room

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (React 19) + TypeScript | UI, room creation/join, video player |
| **Backend** | Node.js + Express 5 + TypeScript | REST API, room logic, WebSocket server |
| **Real-time** | Socket.IO + Redis Adapter | WebSocket-based bidirectional sync |
| **Database** | PostgreSQL (Prisma Next ORM) | Rooms, users, memberships, playlists, playback state |
| **Chat Store** | MongoDB (Mongoose) | High-throughput real-time chat messages |
| **Cache & Pub/Sub** | Redis / Upstash | Playback cache, distributed locks, Pub/Sub, presence, rate limiting |
| **Auth** | Clerk | JWT authentication, user management, webhooks |
| **Video** | YouTube IFrame Player API | Embedded, controllable YouTube player |

---

## 🔐 Role-Based Access Control

| Role | Who assigns | Permissions |
|------|------------|-------------|
| **Host** | Auto (room creator) | Full control: play/pause, seek, change video, assign roles, remove participants, transfer host |
| **Moderator** | Host | Play/pause, seek, change video (when allowed by Host); can kick/ban participants |
| **Participant** | Host (default for joiners) | Watch only; cannot control playback or change video |
| **Viewer** | Host | Same as Participant (restricted spectator) |

---

## 🔌 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `room:join` | Client → Server | User joins room; server assigns role and returns sync state |
| `room:leave` | Client → Server | User leaves room |
| `playback:sync` | Server → Clients | Broadcast current video state (position, playing, rate, media) |
| `playback:action` | Client → Server | Play, pause, seek, or change video (role-gated) |
| `chat:send` / `chat:message` | Bidirectional | Send and receive chat messages with nicknames and roles |
| `room:reaction` | Bidirectional | Emoji reactions broadcast to the room |
| `room:member_joined` / `room:member_left` | Server → Clients | Participant join/leave notifications |
| `room:role_changed` | Server → Clients | Role assignment broadcast |
| `room:member_updated` | Server → Clients | Nickname or profile update broadcast |

---

## 📋 Prerequisites

- **Node.js** ≥ 22.0.0
- **pnpm** (package manager)
- **PostgreSQL** database (or [Neon](https://neon.tech) for serverless)
- **MongoDB** instance (or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Redis** instance (or [Upstash](https://upstash.com))
- **Clerk** account ([clerk.com](https://clerk.com)) for authentication

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Backend server port (default: `3001`) |
| `HOST` | Network interface (default: `0.0.0.0`) |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) |
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations) |
| `MONGODB_URL` | MongoDB connection URI |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST auth token |
| `REDIS_URL` | Direct Redis URL (auto-synthesized from Upstash vars if omitted) |
| `CLERK_SECRET_KEY` | Clerk server-side secret key |
| `CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_WEBHOOK_SECRET` | Svix webhook verification secret |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for client auth |
| `CLERK_SECRET_KEY` | Clerk secret key for server-side Next.js |
| `NEXT_PUBLIC_API_URL` | Backend REST API URL (e.g., `http://localhost:3001`) |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket URL (e.g., `http://localhost:3001`) |

> See `backend/.env.example` and `frontend/.env.example` for templates.

---

## 🚀 Setup & Run

### 1. Clone the repository

```bash
git clone https://github.com/your-username/yt-watch-party.git
cd yt-watch-party
```

### 2. Install dependencies

```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

### 3. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database URLs, Redis, and Clerk keys

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your Clerk key and API URLs
```

### 4. Set up the database

```bash
cd backend
npx prisma db init         # Initialize database schema
npx prisma db migrate      # Run migrations
```

### 5. Start development servers

```bash
# Terminal 1 — Backend (Express + Socket.IO)
cd backend
pnpm dev                   # Starts on http://localhost:3001

# Terminal 2 — Frontend (Next.js)
cd frontend
pnpm dev                   # Starts on http://localhost:3000
```

Or from the project root:

```bash
npm run dev:backend        # Backend dev server
npm run dev:frontend       # Frontend dev server
```

### 6. Open the app

Navigate to [http://localhost:3000](http://localhost:3000), sign in with Clerk, create a room, and share the room code or link with friends!

---

## 🏭 Production Build

```bash
# Backend
cd backend
pnpm build                 # Compiles TypeScript to dist/
pnpm start                 # Single instance
pnpm start:cluster         # Multi-core cluster mode

# Frontend
cd frontend
pnpm build                 # Next.js production build
pnpm start                 # Serves on port 3000
```

---

## 🧪 Testing

```bash
cd backend
pnpm test                  # Run all Vitest tests (47 tests)
pnpm typecheck             # TypeScript type checking
```

---

## 🌐 Deployment

The application can be deployed on:

| Platform | Best for |
|----------|----------|
| **[Railway](https://railway.app)** | Full-stack: backend + frontend + databases |
| **[Render](https://render.com)** | Full-stack: WebSocket servers, backend + frontend |
| **[Vercel](https://vercel.com)** + separate backend | Frontend (Next.js) + separate WebSocket backend |

### Live Deployment

<!-- Replace with your actual deployment URLs -->
- **Frontend**: `https://watchparty-yt.vercel.app`
- **Backend**: `https://yt-watch-party.up.railway.app`

---

## 📐 Architecture Overview

The system uses a **hybrid polyglot database architecture** with a **modular Clean Architecture backend** and **reactive Next.js frontend**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Clients (Browsers)                                             │
│  Next.js 16 / React 19 + Socket.IO Client + YouTube IFrame API │
└────────────────┬───────────────────────┬────────────────────────┘
                 │ HTTPS REST            │ WebSocket (Socket.IO)
                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend Node.js Cluster                                        │
│  ┌──────────────┐  ┌───────────────────┐  ┌──────────────────┐ │
│  │ Express REST  │  │ WatchParty Gateway│  │ PlaybackSync     │ │
│  │ API Layer     │  │ (Socket.IO)       │  │ Engine           │ │
│  └──────┬───────┘  └────────┬──────────┘  └────────┬─────────┘ │
│         │                   │                      │            │
│  ┌──────▼───────────────────▼──────────────────────▼─────────┐ │
│  │            RBAC Policy Engine + DI Container               │ │
│  └──────┬──────────────────┬──────────────────┬──────────────┘ │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          ▼                  ▼                  ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  PostgreSQL   │  │   MongoDB    │  │    Redis     │
   │  (Prisma)     │  │  (Mongoose)  │  │  (Pub/Sub)   │
   │  Rooms, Users │  │  Chat Msgs   │  │  Playback    │
   │  Memberships  │  │              │  │  Locks, Cache│
   └──────────────┘  └──────────────┘  └──────────────┘
```

**How WebSockets enable real-time sync:**

1. When a Host/Moderator performs a playback action (play/pause/seek/change video), the frontend emits a `playback:action` event via Socket.IO
2. The backend gateway validates the user's role against the RBAC Policy Engine
3. If authorized, the `PlaybackSyncEngine` updates the canonical playback state (Redis cache + PostgreSQL)
4. The gateway broadcasts a `playback:sync` event to all room participants via Socket.IO
5. Each client's `YouTubeSyncPlayer` receives the sync event and adjusts the local YouTube IFrame player to match
6. A continuous drift-correction ticker (every 500ms) ensures sub-second synchronization across all clients

For the full technical deep-dive, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 📁 Project Structure

```
yt-watch-party/
├── backend/                    # Express + Socket.IO backend
│   ├── src/
│   │   ├── core/               # Base classes, DI container, domain events
│   │   ├── config/             # Environment config
│   │   ├── modules/
│   │   │   ├── auth/           # Clerk JWT auth + webhooks
│   │   │   ├── rooms/          # Room CRUD, settings, repositories
│   │   │   ├── memberships/    # Join, kick, ban, role management
│   │   │   ├── playback/       # PlaybackSyncEngine, playback state
│   │   │   ├── chat/           # Chat service + MongoDB repository
│   │   │   ├── rbac/           # RBAC Policy Engine + permissions
│   │   │   └── sessions/       # Watch session tracking
│   │   ├── infrastructure/
│   │   │   ├── redis/          # Redis keys, Pub/Sub, locks, rate limiter
│   │   │   └── cache/          # Presence cache
│   │   ├── realtime/           # Socket.IO server, WatchPartyGateway
│   │   └── prisma/             # Prisma schema + generated client
│   └── test/                   # Vitest unit tests
├── frontend/                   # Next.js 16 frontend
│   ├── app/                    # App Router pages
│   ├── components/
│   │   ├── room/               # Room UI (player, controls, sidebar)
│   │   ├── dashboard/          # Dashboard, room cards, create modal
│   │   └── ui/                 # Shadcn-style primitives
│   └── lib/                    # Socket client, YouTube utils, API client
├── ARCHITECTURE.md             # Detailed system architecture
└── README.md                   # This file
```

---

## 📄 License

This project was built as part of an internship assignment.

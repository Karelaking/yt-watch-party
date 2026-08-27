# Frontend Architecture & Coding Conventions

This document outlines the standardized architecture, directory structure, naming rules, and React/Next.js best practices for the WatchParty frontend.

---

## 1. Directory Structure

```
frontend/
├── app/                  # Next.js App Router (Pages, Layouts, Server Components)
│   ├── globals.css       # Global Tailwind v4 styles & theme tokens
│   ├── layout.tsx        # Root Server Layout with providers
│   ├── loading.tsx       # Global Suspense skeleton
│   ├── error.tsx         # Global Error boundary ("use client")
│   ├── not-found.tsx     # Global 404 page
│   ├── page.tsx          # Landing page (Server Component orchestrator)
│   ├── dashboard/        # Dashboard route segment
│   │   ├── page.tsx      # Server Component shell
│   │   └── loading.tsx   # Dashboard loading skeleton
│   ├── room/[roomId]/    # Watch Room route segment
│   │   ├── page.tsx      # Server Component shell with dynamic metadata
│   │   ├── loading.tsx   # Room loading skeleton
│   │   └── not-found.tsx # Room-not-found UI
│   ├── sign-in/          # Clerk Sign-In route
│   └── sign-up/          # Clerk Sign-Up route
│
├── components/           # Modular React Components
│   ├── providers/        # Client provider wrappers (Clerk, GSAP)
│   ├── ds/               # Design system primitives & animations
│   ├── ui/               # Base shadcn / Radix primitives
│   ├── auth/             # Authentication showcase & forms
│   ├── landing/          # Modular landing page sections
│   ├── dashboard/        # Dashboard layout, cards & modals
│   └── room/             # Watch party player, sidebar, settings & controls
│       ├── sidebar/      # Individual sidebar tabs (Chat, Queue, Users, Audit)
│       └── settings/     # Room configuration tabs
│
├── hooks/                # Reusable React custom hooks
├── lib/                  # Utilities, types, constants, stores & loaders
├── types/                # Type definitions & re-exports
└── public/               # Static public assets
```

---

## 2. Naming Conventions

| Entity | Pattern | Example |
|---|---|---|
| **Files & Folders** | `kebab-case` | `youtube-sync-player.tsx`, `use-rooms.ts` |
| **Components** | `PascalCase` | `YouTubeSyncPlayer`, `GlassNav` |
| **Custom Hooks** | `useCamelCase` in `use-kebab-case.ts` | `useRooms()`, `useMediaQuery()` |
| **Utility Functions** | `camelCase` | `formatSeconds()`, `extractYouTubeId()` |
| **Constants** | `SCREAMING_SNAKE_CASE` | `EMOJI_REACTIONS`, `PLAYBACK_RATES` |
| **TypeScript Types/Interfaces** | `PascalCase` | `Room`, `RoomSettings`, `PlaybackState` |
| **Event Handlers** | `handleCamelCase` / `onCamelCase` | `handleTogglePlay`, `onPlaybackChange` |
| **Boolean Variables/Props** | `is*`, `has*`, `allow*`, `can*` | `isPlaying`, `hasScreenStream`, `canControl` |

---

## 3. Server & Client Component Guidelines

### Server Components by Default
- All `page.tsx` and `layout.tsx` files are **Server Components** by default (no `"use client"`).
- Fetch data or resolve route params on the server:
  ```tsx
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ClientContent id={id} />;
  }
  ```

### Client Boundaries & Provider Wrappers
- Push `"use client"` down to the leaves of the component tree.
- Wrap third-party libraries (e.g. Clerk, GSAP) in thin client provider wrappers inside `components/providers/`.
- Pass Server Components as `children` or props to Client Components whenever possible to avoid inflating client bundle sizes.

---

## 4. State Management

- **External Sync**: Use `useSyncExternalStore` for external reactive stores (e.g. `useRooms()`).
- **Local Interactivity**: Use standard `useState`, `useReducer`, and `useRef` for isolated component state.
- **Custom Hooks**: Encapsulate complex state machines and browser listeners into dedicated hooks under `hooks/`.

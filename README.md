# FleetOps — Fleet Tracking Platform

A single-page web app for a fuel-distribution fleet, built for the FleetPanda
**Lead Frontend** take-home. Two personas — **Admin** (operations) and **Driver**
(execution) — work over one shared, reactive data layer. There is no backend; the
API is mocked at the network level with [MSW](https://mswjs.io/), so the app runs
and deploys as a self-contained static SPA.

The product is organised around one reactive loop the demo shows end-to-end:

> **Admin** allocates a vehicle to a driver → **Driver** starts a shift and the
> orders go *in transit* → a live, simulated truck moves across the **Live Fleet
> Map** → **Driver** completes a delivery → the destination terminal's
> **inventory** updates → the **Admin** map and inventory dashboard reflect it.

## Stack

| Concern | Choice |
| --- | --- |
| Build / dev | Vite + React 19 + TypeScript |
| State | Zustand (domain-sliced stores) |
| Mock API | MSW over an in-memory seeded DB |
| Maps | Leaflet + react-leaflet (CARTO tiles) |
| Forms | react-hook-form + Zod |
| Styling | Tailwind CSS (custom "mission-control" theme, light/dark) |
| Testing | Vitest + React Testing Library (reusing the MSW handlers) |
| Routing | react-router |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (MSW starts before the app mounts) |
| `npm run build` | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest run |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with a v8 coverage report |

No environment variables or external services are required — MSW also runs in the
built app, so `npm run preview` (or any static host) is fully functional offline,
aside from the map's tile imagery.

## Using the app

Switch personas from the **switcher in the top-right header** (no login):

- **Admin** — Live Fleet Map, Orders, Allocations, Inventory, and Master Data
  (Hubs / Terminals / Products / Drivers / Vehicles).
- **Driver** (pick any driver) — My Shift, Live Map, Shift History.

The seed data ships with one driver already **on shift today** (John Smith /
TRK-101), so the Live Fleet Map shows a moving vehicle immediately. Another driver
(Maria Garcia) has an allocation but no shift, so you can demo **Start Shift →
deliver → inventory update** from scratch.

## Architecture at a glance

```
UI components ─▶ Zustand domain stores ─▶ service layer (typed fetch) ─▶ MSW handlers ─▶ in-memory DB (seed)
                       ▲                                                                      │
                       └───────────────── simulation ticker writes live positions ───────────┘
```

- **Clear layer boundaries.** Components never call `fetch`; they call store
  actions, which call the typed [service layer](src/services), which is the only
  place the app talks to "the backend". Swapping MSW for a real API touches just
  that layer.
- **One generic CRUD engine** drives all five master-data entities from a
  declarative config (`src/features/master-data`), instead of five bespoke pages.
- **The Live Fleet Map** is the graded core feature: a client-side simulation
  ticker interpolates each on-shift vehicle along its route, with a 30s
  auto-refresh and theme-aware map tiles.

```
src/
  components/   ui primitives, layout shell, map components
  features/     master-data CRUD engine (EntityConfig-driven)
  pages/        admin/* and driver/* route screens
  store/        Zustand domain stores (+ CRUD store factory, simulation store)
  services/     typed fetch client + per-resource services
  sim/          geo math + simulation engine (pure)
  mocks/        MSW handlers, in-memory DB, seed data
  lib/          pure helpers (inventory, allocations, shift, dates)
  types/        domain model
```

## Documentation

- [docs/DECISIONS.md](docs/DECISIONS.md) — key trade-offs and why they were made.
- [docs/STATE_MANAGEMENT.md](docs/STATE_MANAGEMENT.md) — the data/state architecture.
- [docs/COMPONENTS.md](docs/COMPONENTS.md) — the component library and patterns.

## Testing

Vitest + RTL run against the **same MSW handlers** the app uses, so service and
store tests exercise real request/response behaviour (including the `409`
double-booking and inventory mutations). Pure logic — route interpolation,
allocation conflicts, inventory math, shift outcomes — is unit-tested directly.

```bash
npm test
npm run test:coverage
```

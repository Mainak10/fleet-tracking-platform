# State Management & Data Architecture

## Layers

```
UI components ─▶ Zustand stores ─▶ service layer ─▶ MSW handlers ─▶ in-memory DB (seed)
                      ▲                                                     │
                      └──────────── simulation ticker writes positions ─────┘
```

Each arrow is a one-way dependency, which keeps the boundaries testable:

1. **Components** subscribe to stores and call store actions. They never call
   `fetch` and never import MSW or the DB.
2. **Stores** (`src/store`) hold domain state and expose async actions that call
   the service layer, tracking `loading`/`error`/`loaded` per slice.
3. **Service layer** (`src/services`) is thin typed `fetch` wrappers — the single
   boundary to "the backend". Reused by both stores and tests.
4. **MSW handlers** (`src/mocks/handlers.ts`) implement the REST routes against an
   **in-memory DB** (`src/mocks/db.ts`) seeded by `src/mocks/seed.ts`, with
   simulated latency and business rules (e.g. `409` on double-booking).

Swapping the mock for a real API means changing only the service layer.

## The service boundary

`src/services/client.ts` exposes a tiny `api` object (`get/post/put/del`) over
`fetch`, prefixes `/api`, serialises JSON, and throws a typed **`ApiError`**
(carrying `status`) on any non-2xx response. Stores catch it to set `error`, or
re-throw so a form/toast can surface the message (this is how the `409`
double-booking message and `422` "no allocation" reach the UI).

`src/services/index.ts` defines one service per resource:

- **Master data** (`facilities`, `products`, `drivers`, `vehicles`) use the
  generic `createCrudService` (`list/create/update/remove`).
- **Orders** add lifecycle actions: `assign`, `complete`, `fail`.
- **Allocations** add `create` (409 on double-booking) and `remove`.
- **Shifts** add `start` (driver + date) and `end`.

## Stores

| Store | Backing | Responsibility |
| --- | --- | --- |
| `entities` | `createCrudStore` × 4 | Facilities, products, drivers, vehicles |
| `orders` | bespoke | Orders + assign/complete/fail; refreshes facilities on complete |
| `allocations` | bespoke | Allocations; re-throws 409 for the form |
| `shifts` | bespoke | Start/end shifts; refreshes orders on start |
| `positions` | bespoke | Client-side simulation of live vehicle positions |
| `ui` | persisted | Persona, theme, toasts |

### The CRUD store factory

`createCrudStore(service)` (`src/store/createCrudStore.ts`) returns a Zustand store
with `items/loading/error/loaded`, the four CRUD actions, and a `getById` getter.
The four master-data stores are each one line. `items` is the single source of
truth the UI subscribes to; mutations update it optimistically after the service
resolves.

### Cross-store reactivity

The reactive loop is wired by stores calling each other via `getState()`:

- `shifts.start()` → after the server moves the day's orders to `in_transit`, it
  calls `useOrdersStore.getState().fetchAll()` so the UI reflects the new statuses.
- `orders.complete()` → after the server increments destination inventory, it
  calls `useFacilitiesStore.getState().fetchAll()` so the inventory dashboard and
  map update immediately.

`useBootstrap` (`src/hooks/useBootstrap.ts`) prefetches every collection once on
app start so pages render against warm data. The `ui` store persists `persona` and
`theme` to `localStorage` (`persist` middleware); toasts are session-only.

## Simulation engine & positions

The Live Fleet Map is driven by a **pure engine** plus a **store wrapper**, so the
movement math has no React/Zustand dependency and is directly unit-tested
(`src/sim/engine.test.ts`).

**`src/sim/engine.ts`** (pure):

- `deriveLeg(shift, orders, facilities)` — for an active shift, finds its first
  `in_transit` order and builds a `Leg` from the **nearest hub** to that order's
  destination, with a heading and a (compressed) ETA. Returns `null` when there's
  nothing to drive.
- `advance(prev, leg, dt)` — moves a position one tick by linear interpolation
  (`lerp`), **clamping `progress` at 1** so an arrived vehicle idles at the
  destination until the driver completes the delivery.
- `initialPosition`, plus constants `TICK_MS`, `SPEED_KMH`, `GPS_STEP_MS`. Geo math
  (`lerp`, `bearing`, `distanceKm`, `nearest`) lives in `src/sim/geo.ts`.

**`src/store/positions.ts`** (store):

- Derives the active set every tick from the `shifts`/`orders`/`facilities` stores
  (`activeLegs()`), reconciling positions: keep progress for a vehicle still on the
  same order, reset to origin when its leg changes, drop vehicles no longer active.
- `start()/stop()` manage a **module-scoped interval** (not store state) so React
  StrictMode's double-mount can't spawn two tickers — `start()` is idempotent.
- `refresh()` re-derives the active set and stamps `lastRefreshAt` (the 30s poll /
  manual Refresh button); `tick()` advances every vehicle (exposed for tests);
  `sendGpsUpdate(vehicleId)` jumps one vehicle forward (the driver action).

Map pages start the ticker on mount and stop it on unmount, plus a 30s `refresh`
interval. The admin map renders all active vehicles; the driver map renders only
the current driver's vehicle — both consume the same `positions` store.

## Domain model

`src/types/domain.ts` is the single source of types. Cross-entity links are by id,
so the in-memory DB behaves like a normalised relational backend:

- `Facility` (a `hub` or `terminal`, distinguished by `type`) with `coordinates`
  and an `inventory` map of `productId → quantity`.
- `Order` (`created → assigned → in_transit → completed | failed`) referencing a
  destination facility, a product, and an optional assigned driver.
- `Allocation` — reserves a `(vehicleId, date)`; uniqueness on that pair is the
  rule that prevents double-booking.
- `Shift` — a driver's working session derived from an allocation, holding the
  day's order ids.
- `VehiclePosition` — ephemeral telemetry (`coordinates`, `heading`, `progress`,
  `activeOrderId`), owned by the simulation store, never persisted.

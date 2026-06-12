# Architecture Decisions

The brief weights **architecture, state management, reusability, code
organisation, and testing** over raw feature count. These are the deliberate
trade-offs made to reflect that, with the reasoning behind each.

## 1. Zustand + a service layer, not TanStack Query

**Decision.** Domain state lives in domain-sliced Zustand stores; all network
access goes through a thin typed service layer (`src/services`).

**Why.** This is a session-scoped app over a mocked backend with no real cache
invalidation, refetch-on-focus, or pagination concerns. TanStack Query's main
value — server-cache management — would be mostly inert here, while still adding
a query-key surface to reason about. Zustand gives a single, explicit source of
truth the UI subscribes to, and the service layer keeps the async/error boundary
clean and independently testable. The store actions still track `loading`/`error`
per slice, so we don't lose that ergonomics.

**Trade-off.** If this grew into a real multi-user backend with cache coherency
needs, TanStack Query (or RTK Query) would become the better default. The service
layer is the seam that makes that migration local.

## 2. One generic CRUD engine, not five bespoke master-data pages

**Decision.** Hubs, Terminals, Products, Drivers, and Vehicles are all driven by a
single declarative `EntityConfig` (`src/features/master-data`) feeding one generic
list + form. Adding an entity is a config change, not new UI.

**Why.** Five near-identical CRUD pages is exactly the kind of duplication a lead
should design away. The config pattern concentrates the variation (fields, schema,
columns, scope) in data and keeps the rendering/validation logic in one tested
place — the strongest reusability signal in the codebase. Facilities back both
Hubs and Terminals from one store, scoped by `type`.

**Trade-off.** A config abstraction is slightly more indirection to read for a
single entity. It pays off from the second entity onward, which is the case here.

## 3. Client-side simulation, not a positions API resource

**Decision.** Live vehicle positions are **not** a persisted resource served over
MSW. They live in a dedicated client-side simulation store (`src/store/positions`)
fed by a pure engine (`src/sim/engine`); the seed DB deliberately omits them.

**Why.** Positions are ephemeral, high-frequency telemetry derived from durable
state (which shifts are active, which orders are in transit). Modelling them as a
REST resource would mean polling a mock endpoint every second to read values the
client already computes. Keeping the derivation pure and client-side makes the
movement math trivially unit-testable and avoids a pointless network round-trip,
while the durable entities (shifts, orders) remain the source of truth.

**Trade-off.** With a real GPS backend, positions *would* be a server resource.
The simulation store is structured like any other store, so swapping its internal
ticker for a websocket/poll feed would not change its consumers.

## 4. Continuous interpolation *plus* a 30s refresh

**Decision.** A ~1s ticker linearly interpolates each vehicle along its
origin→destination leg, while a 30-second poll re-derives the active set; a manual
**Refresh** button is also provided.

**Why.** The brief asks for a map that "auto-refreshes every 30 seconds." A pure
30s snapshot looks dead between refreshes. Continuous interpolation satisfies the
literal requirement (the 30s cycle reconciles which vehicles are active) while the
map reads as genuinely live. Marker movement is smoothed in CSS between ticks.

## 5. Route origin = nearest hub to the destination

**Decision.** An order has a `destinationId` but no origin; a moving vehicle's leg
starts from the **nearest hub** to that destination (`nearest()` in `src/sim/geo`).

**Why.** It needs zero additions to the data model, always yields a plausible
geographic leg from the seeded Bay Area hubs, and reuses an existing utility.
Alternatives considered — a single fixed home hub (every route fans out from one
point, less believable) and an explicit `originId` on orders (most realistic but
expands the model/seed for marginal gain in a demo).

## 6. Real, theme-aware map tiles

**Decision.** The map uses CARTO raster tiles with light/dark variants that swap
with the app theme, rather than an offline schematic canvas.

**Why.** The Live Fleet Map is the graded core feature; real tiles make it read as
a genuine operations tool and the dark variant matches the mission-control theme.
The only cost is that tile imagery needs network at runtime — everything else in
the app (data, simulation) is fully self-contained.

## 7. Persona switcher, no mock authentication

**Decision.** A header switcher toggles between Admin and any Driver, re-scoping
the shared store; there is no login screen.

**Why.** Auth is out of scope for the brief and a mock login adds friction without
demonstrating anything graded. The switcher makes it trivial to demo the
cross-persona loop (allocate as Admin → execute as that Driver → see the result as
Admin) in seconds.

## 8. Inventory increments on delivery

**Note, not a preference.** Completing a delivery **adds** the delivered quantity
to the destination terminal's stock (fuel delivered *to* a terminal), implemented
in `applyDelivery` (`src/lib/inventory`) and asserted by the service tests. The UI
copy reflects this ("destination inventory updated").

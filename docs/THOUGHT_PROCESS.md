# Thought Process — How This Solution Was Built, Step by Step

This document is the *reasoning* companion to the code. Where
[`DECISIONS.md`](./DECISIONS.md) records the final architectural decisions tersely
(as ADRs), this file tells the **story**: what problem each phase faced, what
options were on the table, what was chosen, and *why* — in plain language, in the
order the work actually happened.

It deliberately **excludes the documentation and testing phases** (those are
mechanical follow-through). It covers the build phases: **Tasks 1–7 and 10.**

---

## 0. The brief and the bet

**The brief:** build the web front end for a fuel-distribution fleet platform with
two personas — **Admin** (operations) and **Driver** (execution) — over one shared,
reactive data layer. There is no backend; it must be mocked. The role is **Lead
Frontend**, and the grading rubric weights **architecture, state-management
approach, reusability, code organization, and testing** *above* raw feature count.

**The bet:** with rubric pressure on *quality* over *quantity*, the winning move is
**depth on the differentiators** plus a **clean, well-documented foundation**, and
only **lean-but-functional breadth** everywhere else. Concretely, two things had to
be genuinely excellent:

1. **One end-to-end reactive loop** that proves the whole system hangs together:
   > Admin allocates a vehicle → Driver starts a shift (orders go *in transit*) →
   > a simulated truck moves on the **Live Fleet Map** → Driver completes a
   > delivery → the destination terminal's **inventory** updates → the Admin's map
   > and inventory dashboard reflect it.
2. **The Live Fleet Map** — the assignment's explicitly named "core feature."

Everything else (the five master-data entities, etc.) is necessary but is *breadth*.
The strategy was to make breadth cheap so the budget could go to depth. That single
trade-off drove almost every later decision.

---

## 1. Scaffold + tooling — *get the rails right before laying track*

**Problem:** pick a stack that signals seniority and keeps the differentiators
cheap to build, without over-engineering a session-scoped app.

**Reasoning:**
- **Vite + React + TypeScript** — fast, standard, type-safety is table stakes for a
  "Lead" rubric.
- **Zustand** for state instead of Redux (too much ceremony for this scope) or
  TanStack Query (it's a *server-cache* library; here the "server" is a mock and the
  app is a single source of truth — Query would fight the model). Zustand gives
  small, domain-sliced stores with almost no boilerplate.
- **MSW (Mock Service Worker)** for the backend — and this is the key tooling
  insight: by mocking **at the network layer** rather than stubbing functions, the
  app makes *real* `fetch` calls. That means (a) the service layer is real, (b) the
  same mocks power the tests, and (c) swapping in a real API later changes *nothing*
  above the network boundary.
- **Leaflet** for maps (open, no API key, deploys offline-friendly), **Tailwind**
  for styling, **react-hook-form + Zod** for forms.

**Why it matters:** the tooling choices *pre-decided* the architecture. MSW made a
clean layered boundary natural; Zustand made domain slicing natural.

---

## 2. Data foundation — *model the domain once, correctly*

**Problem:** everything downstream depends on the shape of the data. Get the domain
model and the layering right, and the feature work becomes assembly.

**Reasoning — the layered boundary:**

```
UI components ─▶ Zustand stores ─▶ service layer (typed fetch) ─▶ MSW handlers ─▶ in-memory DB (seed)
```

Each arrow is a *one-way* dependency with a single responsibility:
- **Components never call `fetch`.** They call store actions. (Enforced by
  convention and obvious in review.)
- **Stores** hold the single source of truth the UI subscribes to and own
  loading/error state.
- **The service layer** is the *only* place the app talks to "the backend." This is
  the seam a real API would plug into.
- **MSW handlers + an in-memory `db` module** simulate latency, inject occasional
  errors, and enforce real rules (the allocation `409`).

**Key modeling decisions:**
- **`Hub` and `Terminal` share one `Facility` type**, differing only by a `type`
  field. This looks small but it's load-bearing: it lets *one* API resource and
  *one* store back *two* master-data entities, and it set up the generic-CRUD play
  in Task 4.
- **Inventory is `Record<productId, number>` on each facility** — delivery
  completion is then just "add quantity to a key," a pure function.
- **Vehicle positions are deliberately *not* a persisted resource.** They are
  ephemeral, client-side simulation state. Recognizing this early avoided building a
  pointless `/api/positions` round-trip and kept the simulation honest (more in
  Task 6).

---

## 3. App shell + UI primitives — *build the vocabulary before the sentences*

**Problem:** five admin screens and three driver screens will repeat the same
patterns (tables, modals, forms, badges, toasts). Building each screen bespoke would
be slow *and* would bury the reusability signal the rubric rewards.

**Reasoning:** invest up front in a small, sharp **primitive library** —
`DataTable`, `Modal`, `Button`, `Input`/`Select`, `Badge`, `Card`, `Toaster`,
`Skeleton`, `EmptyState`, `ErrorBoundary` — so every later screen is *composition*,
not construction. The **`DataTable`** in particular is generic (search/sort/filter,
loading skeleton, empty state, row actions) because it has to drive *every* list
view in the app.

The **app shell** is a single SPA with a **persona switcher in the header** (Admin /
Driver-as-[name]) that re-scopes the shared store — **no mock login**, because auth
isn't what's being graded and a switcher demos both personas in seconds.

**Why it matters:** the primitive layer is the multiplier. Tasks 4–7 were fast
*because* this existed.

---

## 4. Master-data CRUD engine — *the central reusability play*

**Problem:** there are five master-data entities (Hubs, Terminals, Products,
Drivers, Vehicles). The naive approach is five List pages + five Form pages = ten
near-identical files. That's exactly the kind of duplication a Lead should *not*
ship.

**Reasoning — one engine, five configs:** instead, drive all five from a single
generic engine fed by a declarative **`EntityConfig`** (fields, Zod schema, table
columns, default values, search text). One `MasterDataPage` + one `EntityForm`
render *any* entity from its config. Adding a sixth entity is a config object, not a
new page.

This is the single highest-leverage reusability decision in the codebase, and it's
*directly* enabled by the Task 2 choice to make `Hub`/`Terminal` one shared type.

The **Inventory dashboard** rode along here: it's a facilities × products table with
low-stock color coding, built from the same `DataTable` and the pure `stockLevel`
helper.

**Why it matters:** breadth got *cheap*. Five entities cost roughly the effort of
one, freeing the budget for the Live Map.

---

## 5. Orders + Vehicle allocation — *encode the one hard rule as pure logic*

**Problem:** allocation has a real constraint — **a vehicle can't be
double-booked** for the same date — and the assignment calls out a calendar view
and clear error handling.

**Reasoning:**
- The double-booking rule lives in **one pure function**,
  `findAllocationConflict(allocations, vehicleId, date, excludeId)`. Pure means it's
  trivially unit-testable *and* reusable by both the MSW handler (authoritative,
  returns **`409`**) and any client-side pre-validation. The `excludeId` parameter
  handles the edit case (a row mustn't conflict with itself).
- The UI surfaces the `409` as a **form-field error plus a toast**, so the failure
  is legible, not a console mystery.
- Orders carry a status lifecycle (`created → assigned → in_transit → completed /
  failed`) that the rest of the loop keys off of.

**Why it matters:** "business rule as a pure, tested function, enforced at the API
boundary" is exactly the pattern a Lead is expected to demonstrate.

---

## 6. Simulation engine + Live Fleet Map — *the core feature, done with real polish*

**Problem:** show vehicles moving in real time on a map, with a literal requirement
to "auto-refresh every 30 seconds." This is the graded centerpiece.

**Reasoning — separate the math from the machinery:**
- **`src/sim/engine.ts` is pure and React-free.** `deriveLeg(shift, order,
  facilities)` computes a vehicle's current trip `{ origin, dest, heading, etaMs }`;
  `advance(prev, leg, dtMs)` returns the next `VehiclePosition` by linear
  interpolation with progress **clamped at 1** (a truck that arrives *parks* and
  waits for the driver to mark the delivery complete). Pure math = trivial unit
  tests and no rendering concerns.
- **A Zustand `positions` store runs the ticker** (~1s) that calls `advance` for
  each active vehicle; the map subscribes reactively.
- **"Auto-refresh every 30s" — satisfy the letter *and* the spirit.** A naive reading
  is "repaint every 30s," which looks robotic. So: a **30s poll + manual Refresh**
  re-derives *which* vehicles are active (the literal requirement), while
  **continuous 1s interpolation** makes the movement look genuinely live. Both, not
  either.
- **Route origin = the nearest hub to the order's destination**, reusing the
  existing `nearest()` geo helper — a sensible default given orders have a
  destination but no explicit origin.
- **Map markers are Leaflet `divIcon`s (inline SVG, rotated by heading).** This
  sidesteps the well-known Leaflet bundler bug where default marker image assets
  404 under Vite — no need to patch `L.Icon.Default`. The vehicle icon rotates to
  its compass `bearing`, so direction reads at a glance.
- **Theme-aware tiles** (CARTO light/dark, re-keyed on theme toggle) so the map
  doesn't glare white in dark mode.

**Why it matters:** this is where "lean elsewhere" buys "excellent here." The map has
filters, tooltips, smooth motion, and arrival behavior — depth the rubric rewards.

---

## 7. Driver interface — *close the loop by reusing, not rebuilding*

**Problem:** the Driver persona needs a shift view, a live map, delivery
complete/fail actions, and history — and completing a delivery must ripple back to
the Admin's inventory. This is the other half of the reactive loop.

**Reasoning:**
- **Pure shift helpers** (`src/lib/shift.ts`) mirror the `lib/inventory.ts` pattern:
  `activeShiftForDriver`, `allocationForDriver`, `shiftDeliveries`,
  `deliverySummary` — all dependency-free, so the driver pages stay declarative and
  the logic is unit-tested directly.
- **The Driver map reuses the admin `FleetMap` component**, simply *scoped* to the
  driver's own vehicle — no second map implementation. Reuse over rebuild.
- **"Send GPS Update"** advances *one* vehicle by `GPS_STEP_MS` (an 8-second jump,
  deliberately larger than the 1s auto-tick) so the manual action produces a
  *visible* move on both the driver's and the admin's map — the feature feels real.
- **Delivery completion is the payoff:** it flips the order to `completed` and
  **increments the destination terminal's inventory** via the pure `applyDelivery`,
  which the Admin's inventory dashboard and map immediately reflect. The loop is
  closed: one driver action, visible across both personas.

**Why it matters:** the end-to-end demo now works start to finish, and it was built
mostly from parts that already existed.

---

## 10. Polish / nice-to-haves — *the seniority finish*

**Problem:** with the system working, the remaining budget goes to the details that
separate "it works" from "a Lead built this." Picked for high signal-to-effort:

- **Optimistic CRUD updates with rollback.** The generic CRUD store applies
  create/update/remove to the UI *immediately*, then reconciles with the server
  response — and **rolls back** if the request fails (snapshot → mutate → restore on
  error, error still re-thrown so the toast path works). Because all five entities
  share one store factory, this one change makes the *entire* master-data surface
  feel instant. Maximum leverage, again from the generic engine.
- **Modal focus management.** Real dialog accessibility: focus moves into the dialog
  on open, **Tab is trapped** inside it, and focus **returns to the opener** on
  close — plus the existing Esc/backdrop/scroll-lock. Labeled via `aria-labelledby`.
- **DataTable keyboard a11y.** Clickable rows become real controls
  (`role="button"`, `tabIndex`, Enter/Space), and sortable headers expose
  `aria-sort` — so the app is operable without a mouse and legible to assistive tech.
- **Route transitions.** A subtle, `prefers-reduced-motion`-aware fade/slide on
  navigation, reusing the existing animation convention — motion that adds polish
  without getting in the way.

**Why it matters:** these are the touches a reviewer notices precisely *because* most
take-homes skip them.

---

## The through-line

If there's a single thread tying the whole build together, it's this: **spend the
expensive effort once, in the right place, and let it pay off everywhere.** One
shared `Facility` type enabled one generic CRUD engine, which made breadth cheap,
which funded a genuinely excellent Live Map and a fully closed reactive loop — and
the same generic engine later made optimistic updates a one-file change. Layered
boundaries and pure functions kept all of it testable and swappable. Depth where it
counts, leverage everywhere else.

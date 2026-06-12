# Component Library

Components are organised by role: reusable **UI primitives**, the **layout shell**,
**map** components, and the **master-data engine**. Everything is styled with
Tailwind against a custom "mission-control" theme (cool slates + a hazard-amber
accent) with full light/dark support. All primitives are exported from
`src/components/ui/index.ts`.

## UI primitives (`src/components/ui`)

| Component | Purpose / API highlights |
| --- | --- |
| **`DataTable<T>`** | Generic table: typed `columns` (`render`, optional `sortValue`, `align`), `rowKey`, built-in search (`searchable` + `getSearchText`), `toolbar` slot for filters, per-row `actions`, `loading` skeletons, and an `empty` state. Drives every list view. |
| **`Modal`** | Portal dialog; closes on Escape/backdrop, locks body scroll, optional `footer`. |
| **`Field`** | Label + control + inline error/hint; the wrapper every form field uses. |
| **`Input` / `Select` / `Textarea`** | Themed form controls with an `invalid` state, `forwardRef` for react-hook-form. |
| **`Button`** | Variants `primary | secondary | ghost | danger`, sizes, and a `loading` spinner. |
| **`Badge` / `OrderStatusBadge`** | Pill with tone + optional pulsing dot; `OrderStatusBadge` maps order status → tone/label. |
| **`Card` / `CardHeader` / `CardTitle` / `CardBody`** | Surface container primitives. |
| **`Skeleton` / `SkeletonRows`** | Loading placeholders. |
| **`EmptyState`** | Icon + title + description + optional action, for empty lists. |
| **`Toaster`** | Renders the transient toasts from the `ui` store (success/error/info). |
| **`ErrorBoundary`** | Class boundary wrapping routed content for render-error recovery. |

**Forms pattern.** Every form is react-hook-form + a Zod schema via `zodResolver`,
with `Field` for layout and the themed controls registered through `register`.
Submit handlers call a store action and surface success/failure via a toast — see
`OrdersPage`'s create/assign modals and the driver `FailDeliveryModal`.

## Layout shell (`src/components/layout`)

| Component | Purpose |
| --- | --- |
| **`AppShell`** | Top-level layout: sidebar + topbar + routed `Outlet`, mobile drawer, global `Toaster`, `ErrorBoundary`. Runs `useBootstrap` and `useThemeEffect`. |
| **`Sidebar` / `SidebarContent`** | Persona-aware navigation (admin vs driver sections from `src/config/nav.ts`); content is shared by the desktop rail and mobile drawer. |
| **`Topbar`** | Theme toggle, mobile menu trigger, live-status indicator, persona switcher. |
| **`PersonaSwitcher`** | The single control that re-scopes the app — switches between Admin and any Driver and routes to that persona's home. |
| **`PageHeader`** | Consistent eyebrow + title + description + actions for every page. |

Navigation is data-driven: `adminNav` / `driverNav` in `src/config/nav.ts` define
the sidebar sections, and `MASTER_DATA_ENTITIES` is the single list expanded into
the master-data nav and routes.

## Map components (`src/components/map`)

| Component | Purpose |
| --- | --- |
| **`FleetMap`** | Reusable Leaflet map: theme-aware CARTO `TileLayer` (swaps light/dark with the `ui` theme), facility + vehicle markers, popups/tooltips, and a `FocusController` that pans to a requested vehicle. Takes `facilities`, an `ActiveVehicle[]` view-model, and an optional `focus` request. Shared by **both** the admin and driver maps. |
| **`markers.ts`** | `vehicleIcon(heading, arrived)` and `facilityIcon(type)` built as Leaflet `divIcon`s with inline SVG — crisp, theme-agnostic, and avoiding the Leaflet/bundler default-marker asset bug (no `L.Icon.Default` patch needed). The vehicle icon rotates to its heading; CSS transitions glide markers between the 1s ticks. |

`ActiveVehicle` is the join the pages build — a `VehiclePosition` paired with its
`vehicle`, `driver`, `order`, and `destination` — keeping `FleetMap` purely
presentational.

## Master-data engine (`src/features/master-data`)

A single declarative engine renders CRUD for all five master-data entities.

- **`types.ts`** — `EntityConfig` describes an entity: its `store`, Zod `schema`,
  form `fields` (`FieldConfig`), table `columns`, `defaultValues`, optional `scope`
  (client filter on a shared store, e.g. hubs vs terminals), `fixed` values, and an
  `hasInventory` flag for facility stock inputs.
- **`configs.tsx`** — the registry of configs for Hubs, Terminals, Products,
  Drivers, Vehicles.
- **`MasterDataPage.tsx`** — route-driven (`/admin/master-data/:entity`) page that
  looks up the config and renders a `DataTable` + add/edit/delete.
- **`EntityForm.tsx`** — renders the create/edit form from the config's fields and
  validates with its schema.

Adding a new master-data entity is a config entry plus a one-line store — no new
list or form code.

## Page screens (`src/pages`)

**Admin:** `LiveMapPage`, `OrdersPage`, `AllocationsPage` (weekly calendar with
double-booking handling), `InventoryPage` (facilities × products, low-stock
colouring). **Driver:** `ShiftPage` (start/complete/fail/end), `DriverMapPage`
(own vehicle + Send GPS Update), `HistoryPage` (ended shifts via `DataTable`).
Pages compose primitives + stores and contain no direct network access.

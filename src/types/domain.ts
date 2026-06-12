/**
 * Core domain model for the fleet tracking platform.
 *
 * IDs are strings throughout. Cross-entity links are by id (e.g. an Order
 * references a destination Facility and an assigned Driver) so the in-memory
 * mock DB behaves like a normalized relational backend.
 */

export interface LatLng {
  lat: number
  lng: number
}

export type FacilityType = 'hub' | 'terminal'

/**
 * A hub or terminal. Both share the same shape and differ only by `type`,
 * which lets the master-data CRUD engine treat them with one config each
 * while a single API resource/store backs both.
 *
 * `inventory` maps a Product id to the quantity currently held.
 */
export interface Facility {
  id: string
  name: string
  type: FacilityType
  address: string
  coordinates: LatLng
  inventory: Record<string, number>
}

export interface Product {
  id: string
  name: string
  /** Unit of measure, e.g. "litres". */
  unit: string
  /** Inventory at or below this level is flagged as low stock. */
  lowStockThreshold: number
}

export interface Driver {
  id: string
  name: string
  license: string
  phone: string
}

export interface Vehicle {
  id: string
  registration: string
  /** Maximum load the vehicle can carry, in product units. */
  capacity: number
  type: string
}

export type OrderStatus =
  | 'created'
  | 'assigned'
  | 'in_transit'
  | 'completed'
  | 'failed'

export interface Order {
  id: string
  destinationId: string
  productId: string
  quantity: number
  /** ISO date (yyyy-MM-dd) the delivery is scheduled for. */
  deliveryDate: string
  assignedDriverId: string | null
  status: OrderStatus
  /** Populated when status is `failed`. */
  failureReason?: string
}

/**
 * Reserves a vehicle for a driver on a specific date. The combination of
 * (vehicleId, date) must be unique — that constraint is what prevents
 * double-booking.
 */
export interface Allocation {
  id: string
  vehicleId: string
  driverId: string
  /** ISO date (yyyy-MM-dd). */
  date: string
}

export type ShiftStatus = 'active' | 'ended'

/**
 * A driver's working session for a given date, derived from an allocation.
 * Orders assigned to the driver for that date are the shift's deliveries;
 * their per-order status is the source of truth for delivery outcomes.
 */
export interface Shift {
  id: string
  driverId: string
  vehicleId: string
  /** ISO date (yyyy-MM-dd). */
  date: string
  status: ShiftStatus
  startedAt: string
  endedAt?: string
  orderIds: string[]
}

/**
 * Live telemetry for a vehicle that is currently on shift. `progress` is the
 * 0..1 fraction of the trip from origin to the active delivery, advanced by
 * the simulation ticker.
 */
export interface VehiclePosition {
  vehicleId: string
  coordinates: LatLng
  heading: number
  progress: number
  updatedAt: string
  /** The order/delivery the vehicle is currently heading toward, if any. */
  activeOrderId: string | null
}

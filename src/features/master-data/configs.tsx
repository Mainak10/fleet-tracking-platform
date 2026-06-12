import { z } from 'zod'
import {
  useDriversStore,
  useFacilitiesStore,
  useProductsStore,
  useVehiclesStore,
} from '@/store'
import { Badge } from '@/components/ui'
import type { Driver, Facility, Product, Vehicle } from '@/types/domain'
import type { EntityConfig } from './types'

const mono = 'font-mono text-xs'

const facilitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  coordinates: z.object({
    lat: z.coerce.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
    lng: z.coerce.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  }),
})

const facilityFields = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true, colSpan: 2 as const },
  { name: 'address', label: 'Address', type: 'text' as const, required: true, colSpan: 2 as const },
  { name: 'coordinates.lat', label: 'Latitude', type: 'number' as const, required: true },
  { name: 'coordinates.lng', label: 'Longitude', type: 'number' as const, required: true },
]

const facilityCols = (typeLabel: string) => [
  { key: 'name', header: 'Name', sortValue: (f: Facility) => f.name },
  {
    key: 'address',
    header: 'Address',
    render: (f: Facility) => <span className="text-slate-500">{f.address}</span>,
  },
  {
    key: 'coordinates',
    header: 'Coordinates',
    render: (f: Facility) => (
      <span className={mono}>
        {f.coordinates.lat.toFixed(4)}, {f.coordinates.lng.toFixed(4)}
      </span>
    ),
  },
  {
    key: 'products',
    header: 'Products',
    render: (f: Facility) => (
      <span className={mono}>{Object.keys(f.inventory).length || '—'}</span>
    ),
  },
  { key: 'type', header: '', render: () => <Badge tone="slate">{typeLabel}</Badge> },
]

const hubsConfig: EntityConfig<Facility> = {
  slug: 'hubs',
  title: 'Hubs',
  singular: 'Hub',
  description: 'Distribution hubs that hold bulk fuel inventory.',
  store: useFacilitiesStore,
  schema: facilitySchema,
  fields: facilityFields,
  columns: facilityCols('Hub'),
  defaultValues: { name: '', address: '', coordinates: { lat: 37.7749, lng: -122.4194 } },
  fixed: { type: 'hub' },
  scope: (f) => f.type === 'hub',
  hasInventory: true,
  searchText: (f) => `${f.name} ${f.address}`,
}

const terminalsConfig: EntityConfig<Facility> = {
  ...hubsConfig,
  slug: 'terminals',
  title: 'Terminals',
  singular: 'Terminal',
  description: 'Delivery terminals that receive fuel from the fleet.',
  columns: facilityCols('Terminal'),
  fixed: { type: 'terminal' },
  scope: (f) => f.type === 'terminal',
}

const productsConfig: EntityConfig<Product> = {
  slug: 'products',
  title: 'Products',
  singular: 'Product',
  description: 'Fuel products carried across the network.',
  store: useProductsStore,
  schema: z.object({
    name: z.string().min(1, 'Name is required'),
    unit: z.string().min(1, 'Unit is required'),
    lowStockThreshold: z.coerce.number().min(0, 'Must be zero or more'),
  }),
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, colSpan: 2 },
    { name: 'unit', label: 'Unit', type: 'text', required: true, placeholder: 'litres' },
    {
      name: 'lowStockThreshold',
      label: 'Low-stock threshold',
      type: 'number',
      required: true,
      hint: 'Inventory at or below this flags as low.',
    },
  ],
  columns: [
    { key: 'name', header: 'Name', sortValue: (p: Product) => p.name },
    { key: 'unit', header: 'Unit', render: (p: Product) => <span className={mono}>{p.unit}</span> },
    {
      key: 'lowStockThreshold',
      header: 'Low-stock threshold',
      align: 'right',
      sortValue: (p: Product) => p.lowStockThreshold,
      render: (p: Product) => <span className={mono}>{p.lowStockThreshold.toLocaleString()}</span>,
    },
  ],
  defaultValues: { name: '', unit: 'litres', lowStockThreshold: 3000 },
  searchText: (p) => p.name,
}

const driversConfig: EntityConfig<Driver> = {
  slug: 'drivers',
  title: 'Drivers',
  singular: 'Driver',
  description: 'Fleet drivers available for shifts and deliveries.',
  store: useDriversStore,
  schema: z.object({
    name: z.string().min(1, 'Name is required'),
    license: z.string().min(1, 'License is required'),
    phone: z.string().min(6, 'Enter a valid phone number'),
  }),
  fields: [
    { name: 'name', label: 'Full name', type: 'text', required: true, colSpan: 2 },
    { name: 'license', label: 'License no.', type: 'text', required: true, placeholder: 'DL-000000' },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+1-555-0100' },
  ],
  columns: [
    { key: 'name', header: 'Name', sortValue: (d: Driver) => d.name },
    { key: 'license', header: 'License', render: (d: Driver) => <span className={mono}>{d.license}</span> },
    { key: 'phone', header: 'Phone', render: (d: Driver) => <span className={mono}>{d.phone}</span> },
  ],
  defaultValues: { name: '', license: '', phone: '' },
  searchText: (d) => `${d.name} ${d.license} ${d.phone}`,
}

const vehiclesConfig: EntityConfig<Vehicle> = {
  slug: 'vehicles',
  title: 'Vehicles',
  singular: 'Vehicle',
  description: 'Tankers and trucks in the fleet.',
  store: useVehiclesStore,
  schema: z.object({
    registration: z.string().min(1, 'Registration is required'),
    type: z.string().min(1, 'Type is required'),
    capacity: z.coerce.number().positive('Capacity must be greater than zero'),
  }),
  fields: [
    { name: 'registration', label: 'Registration', type: 'text', required: true, placeholder: 'TRK-000' },
    { name: 'type', label: 'Type', type: 'text', required: true, placeholder: 'Tanker' },
    {
      name: 'capacity',
      label: 'Capacity',
      type: 'number',
      required: true,
      hint: 'Maximum load in product units.',
      colSpan: 2,
    },
  ],
  columns: [
    {
      key: 'registration',
      header: 'Registration',
      sortValue: (v: Vehicle) => v.registration,
      render: (v: Vehicle) => <span className={`${mono} font-medium`}>{v.registration}</span>,
    },
    { key: 'type', header: 'Type', render: (v: Vehicle) => <Badge tone="slate">{v.type}</Badge> },
    {
      key: 'capacity',
      header: 'Capacity',
      align: 'right',
      sortValue: (v: Vehicle) => v.capacity,
      render: (v: Vehicle) => <span className={mono}>{v.capacity.toLocaleString()}</span>,
    },
  ],
  defaultValues: { registration: '', type: 'Tanker', capacity: 8000 },
  searchText: (v) => `${v.registration} ${v.type}`,
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  hubs: hubsConfig,
  terminals: terminalsConfig,
  products: productsConfig,
  drivers: driversConfig,
  vehicles: vehiclesConfig,
}

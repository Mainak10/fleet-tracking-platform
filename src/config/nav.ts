import {
  Boxes,
  CalendarRange,
  ClipboardCheck,
  History,
  type LucideIcon,
  Navigation,
  Package,
  Radar,
  Warehouse,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

/** Master-data entities exposed in the admin sidebar. */
export const MASTER_DATA_ENTITIES = [
  { slug: 'hubs', label: 'Hubs' },
  { slug: 'terminals', label: 'Terminals' },
  { slug: 'products', label: 'Products' },
  { slug: 'drivers', label: 'Drivers' },
  { slug: 'vehicles', label: 'Vehicles' },
] as const

export type MasterDataSlug = (typeof MASTER_DATA_ENTITIES)[number]['slug']

export const adminNav: NavSection[] = [
  {
    items: [
      { label: 'Live Fleet Map', to: '/admin/map', icon: Radar },
      { label: 'Orders', to: '/admin/orders', icon: Package },
      { label: 'Allocations', to: '/admin/allocations', icon: CalendarRange },
      { label: 'Inventory', to: '/admin/inventory', icon: Warehouse },
    ],
  },
  {
    title: 'Master Data',
    items: MASTER_DATA_ENTITIES.map((e) => ({
      label: e.label,
      to: `/admin/master-data/${e.slug}`,
      icon: Boxes,
    })),
  },
]

export const driverNav: NavSection[] = [
  {
    items: [
      { label: 'My Shift', to: '/driver/shift', icon: ClipboardCheck },
      { label: 'Live Map', to: '/driver/map', icon: Navigation },
      { label: 'Shift History', to: '/driver/history', icon: History },
    ],
  },
]

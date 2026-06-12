import type { ZodType } from 'zod'
import type { UseBoundStore, StoreApi } from 'zustand'
import type { CrudState } from '@/store/createCrudStore'
import type { Column } from '@/components/ui'

export type FieldType = 'text' | 'number' | 'tel' | 'select'

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  hint?: string
  options?: { value: string; label: string }[]
  /** Layout width within the two-column form grid. */
  colSpan?: 1 | 2
}

/**
 * Declarative description of a master-data entity. One config drives the list
 * view, the create/edit form, and validation — so adding an entity is a data
 * change, not new UI code.
 *
 * Typed loosely (`any` row) on purpose: the registry holds heterogeneous
 * entities and the generic components cast per-config internally.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface EntityConfig<T extends { id: string } = any> {
  slug: string
  /** Plural display name, e.g. "Hubs". */
  title: string
  /** Singular display name, e.g. "Hub". */
  singular: string
  description: string
  store: UseBoundStore<StoreApi<CrudState<T>>>
  schema: ZodType
  fields: FieldConfig[]
  columns: Column<T>[]
  defaultValues: Record<string, unknown>
  /** Values forced onto every record (e.g. a fixed facility `type`). */
  fixed?: Partial<T>
  /** Client-side filter applied to the shared store (e.g. only hubs). */
  scope?: (row: T) => boolean
  /** Render product-quantity inputs in the form (facilities only). */
  hasInventory?: boolean
  searchText?: (row: T) => string
}

import { createSeedData, type Db } from './seed'

/**
 * The single in-memory store backing every MSW handler. It plays the role of
 * the "database" a real backend would own: handlers read and mutate it, and
 * tests reset it between cases via `resetDb()`.
 */
let db: Db = createSeedData()

export function getDb(): Db {
  return db
}

/** Restore the seed dataset. Called between tests for isolation. */
export function resetDb(): void {
  db = createSeedData()
}

let idCounter = 0

/** Monotonic, prefixed id generator for newly created records. */
export function genId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`
}

export type { Db }

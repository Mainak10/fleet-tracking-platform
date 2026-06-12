import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from '@/mocks/server'
import { resetDb } from '@/mocks/db'

// Start the MSW request-mocking server once for the whole test run.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers + seed data + RTL DOM between tests for isolation.
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetDb()
})

afterAll(() => server.close())

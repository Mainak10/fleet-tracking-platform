import { describe, expect, it } from 'vitest'

// Sanity check that the Vitest + jsdom + MSW setup boots correctly.
describe('toolchain', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2)
  })
})

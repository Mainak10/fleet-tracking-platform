import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Browser-side request interception, started from main.tsx.
export const worker = setupWorker(...handlers)

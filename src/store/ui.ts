import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Persona = { kind: 'admin' } | { kind: 'driver'; driverId: string }

export type ToastType = 'success' | 'error' | 'info'
export interface Toast {
  id: string
  type: ToastType
  message: string
}

export type Theme = 'light' | 'dark'

interface UiState {
  persona: Persona
  theme: Theme
  toasts: Toast[]
  setPersona: (persona: Persona) => void
  toggleTheme: () => void
  addToast: (type: ToastType, message: string) => void
  dismissToast: (id: string) => void
}

/**
 * Cross-cutting UI state: which persona is active (Admin vs a specific
 * Driver), the color theme, and transient toast notifications. Persona and
 * theme are persisted to localStorage; toasts are session-only.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      persona: { kind: 'admin' },
      theme: 'light',
      toasts: [],

      setPersona: (persona) => set({ persona }),

      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

      addToast: (type, message) =>
        set((s) => ({
          toasts: [
            ...s.toasts,
            { id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, message },
          ],
        })),

      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'fleet-ui',
      partialize: (s) => ({ persona: s.persona, theme: s.theme }),
    },
  ),
)

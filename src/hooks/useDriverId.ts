import { useUiStore } from '@/store'

/** The active driver's id when a driver persona is selected, else null. */
export function useDriverId(): string | null {
  const persona = useUiStore((s) => s.persona)
  return persona.kind === 'driver' ? persona.driverId : null
}

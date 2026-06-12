import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronsUpDown, ShieldCheck, Truck } from 'lucide-react'
import { useDriversStore, useUiStore, type Persona } from '@/store'
import { cn } from '@/lib/cn'

function personaLabel(persona: Persona, driverName?: string): string {
  return persona.kind === 'admin' ? 'Admin Console' : (driverName ?? 'Driver')
}

/**
 * Switches the active persona (Admin vs a specific Driver) and routes to that
 * persona's home. This is the single control that re-scopes the whole app.
 */
export function PersonaSwitcher() {
  const persona = useUiStore((s) => s.persona)
  const setPersona = useUiStore((s) => s.setPersona)
  const drivers = useDriversStore((s) => s.items)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const activeDriver =
    persona.kind === 'driver' ? drivers.find((d) => d.id === persona.driverId) : undefined

  const select = (next: Persona) => {
    setPersona(next)
    setOpen(false)
    navigate(next.kind === 'admin' ? '/admin/map' : '/driver/shift')
  }

  const isAdmin = persona.kind === 'admin'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-2.5 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
      >
        <span
          className={cn(
            'grid size-8 place-items-center rounded-md',
            isAdmin ? 'bg-slate-900 text-brand-400 dark:bg-slate-950' : 'bg-brand-500 text-slate-950',
          )}
        >
          {isAdmin ? <ShieldCheck className="size-4" /> : <Truck className="size-4" />}
        </span>
        <span className="hidden sm:block">
          <span className="eyebrow block leading-tight">{isAdmin ? 'Operator' : 'Driver'}</span>
          <span className="block text-sm font-semibold leading-tight">
            {personaLabel(persona, activeDriver?.name)}
          </span>
        </span>
        <ChevronsUpDown className="size-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <PersonaOption
            label="Admin Console"
            sub="Full operations access"
            active={isAdmin}
            icon={<ShieldCheck className="size-4" />}
            onClick={() => select({ kind: 'admin' })}
          />
          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          <p className="eyebrow px-3 py-1">Sign in as driver</p>
          <div className="max-h-60 overflow-y-auto">
            {drivers.map((d) => (
              <PersonaOption
                key={d.id}
                label={d.name}
                sub={d.license}
                active={persona.kind === 'driver' && persona.driverId === d.id}
                icon={<Truck className="size-4" />}
                onClick={() => select({ kind: 'driver', driverId: d.id })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PersonaOption({
  label,
  sub,
  active,
  icon,
  onClick,
}: {
  label: string
  sub: string
  active: boolean
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/60"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="block truncate font-mono text-xs text-slate-400">{sub}</span>
      </span>
      {active && <Check className="size-4 text-brand-500" />}
    </button>
  )
}

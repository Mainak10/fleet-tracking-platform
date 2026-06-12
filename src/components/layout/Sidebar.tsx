import { NavLink } from 'react-router-dom'
import { Radar } from 'lucide-react'
import { adminNav, driverNav, type NavSection } from '@/config/nav'
import { useUiStore } from '@/store'
import { cn } from '@/lib/cn'

function NavItems({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {sections.map((section, i) => (
        <div key={i} className="space-y-1">
          {section.title && <p className="eyebrow px-3 pb-1">{section.title}</p>}
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn('size-5 shrink-0', isActive ? 'text-brand-500' : 'text-slate-400')}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

/** Brand + persona-aware navigation. Shared by the desktop rail and mobile drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const persona = useUiStore((s) => s.persona)
  const sections = persona.kind === 'admin' ? adminNav : driverNav

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <span className="grid size-9 place-items-center rounded-lg bg-slate-900 text-brand-400 dark:bg-slate-950">
          <Radar className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-tight">FleetOps</p>
          <p className="eyebrow">Control</p>
        </div>
      </div>
      <NavItems sections={sections} onNavigate={onNavigate} />
      <div className="border-t border-slate-200 px-5 py-3 dark:border-slate-800">
        <p className="font-mono text-[11px] text-slate-400">v1.0 · mock fleet network</p>
      </div>
    </div>
  )
}

/** Persistent desktop navigation rail. */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 md:block dark:border-slate-800">
      <SidebarContent />
    </aside>
  )
}

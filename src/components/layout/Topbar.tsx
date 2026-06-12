import { Menu, Moon, Sun } from 'lucide-react'
import { useUiStore } from '@/store'
import { PersonaSwitcher } from './PersonaSwitcher'

/** Sticky top bar: mobile menu trigger, theme toggle, and persona switcher. */
export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md md:px-6 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
        >
          <Menu className="size-5" />
        </button>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="eyebrow">Network live</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
        <PersonaSwitcher />
      </div>
    </header>
  )
}

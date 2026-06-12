import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { Sidebar, SidebarContent } from './Sidebar'
import { Topbar } from './Topbar'
import { ErrorBoundary, Toaster } from '@/components/ui'
import { useThemeEffect } from '@/hooks/useThemeEffect'
import { useBootstrap } from '@/hooks/useBootstrap'

/** Top-level layout: sidebar + topbar + routed content, plus global toaster. */
export function AppShell() {
  useThemeEffect()
  useBootstrap()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-full">
      <Sidebar />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute -right-10 top-3 rounded-md p-2 text-white"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="bg-grid flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  )
}

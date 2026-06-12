import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

/** Friendly placeholder for empty lists/tables. */
export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="font-display font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

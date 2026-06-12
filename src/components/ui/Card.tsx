import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps {
  className?: string
  children: ReactNode
}

/** Surface container with the platform's border + shadow treatment. */
export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        'dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={cn('font-display text-base font-semibold tracking-tight', className)}>{children}</h3>
  )
}

export function CardBody({ className, children }: CardProps) {
  return <div className={cn('p-5', className)}>{children}</div>
}

import { cn } from '@/lib/cn'
import type { OrderStatus } from '@/types/domain'

export type Tone = 'slate' | 'amber' | 'green' | 'red' | 'blue'

const tones: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  amber: 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  blue: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
}

const dots: Record<Tone, string> = {
  slate: 'bg-slate-400',
  amber: 'bg-brand-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  blue: 'bg-sky-500',
}

export interface BadgeProps {
  tone?: Tone
  dot?: boolean
  pulse?: boolean
  className?: string
  children: React.ReactNode
}

export function Badge({ tone = 'slate', dot, pulse, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex size-1.5">
          {pulse && (
            <span
              className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-75', dots[tone])}
            />
          )}
          <span className={cn('relative inline-flex size-1.5 rounded-full', dots[tone])} />
        </span>
      )}
      {children}
    </span>
  )
}

const orderStatusTone: Record<OrderStatus, Tone> = {
  created: 'slate',
  assigned: 'blue',
  in_transit: 'amber',
  completed: 'green',
  failed: 'red',
}

const orderStatusLabel: Record<OrderStatus, string> = {
  created: 'Created',
  assigned: 'Assigned',
  in_transit: 'In transit',
  completed: 'Completed',
  failed: 'Failed',
}

/** Convenience badge for order/delivery status. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={orderStatusTone[status]} dot pulse={status === 'in_transit'}>
      {orderStatusLabel[status]}
    </Badge>
  )
}

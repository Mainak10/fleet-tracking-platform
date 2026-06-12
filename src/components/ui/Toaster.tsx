import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useUiStore, type Toast, type ToastType } from '@/store'
import { cn } from '@/lib/cn'

const config: Record<ToastType, { icon: typeof Info; accent: string }> = {
  success: { icon: CheckCircle2, accent: 'text-emerald-500' },
  error: { icon: XCircle, accent: 'text-red-500' },
  info: { icon: Info, accent: 'text-sky-500' },
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUiStore((s) => s.dismissToast)
  const { icon: Icon, accent } = config[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, dismiss])

  return (
    <div
      role="status"
      className="animate-toast flex w-80 items-start gap-3 rounded-lg border border-slate-200 bg-white p-3.5 shadow-lg dark:border-slate-700 dark:bg-slate-800"
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', accent)} />
      <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{toast.message}</p>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

/** Global toast stack, mounted once at the app root. */
export function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  )
}

import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

const control =
  'w-full rounded-md border bg-white px-3 text-sm text-slate-900 transition ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'

const valid = 'border-slate-300 dark:border-slate-700'
const invalid = 'border-red-400 dark:border-red-500 focus:ring-red-500/50 focus:border-red-500'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid: isInvalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={isInvalid}
      className={cn(control, 'h-10', isInvalid ? invalid : valid, className)}
      {...props}
    />
  )
})

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid: isInvalid, className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={isInvalid}
      className={cn(control, 'h-10', isInvalid ? invalid : valid, className)}
      {...props}
    >
      {children}
    </select>
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid: isInvalid, className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={isInvalid}
      className={cn(control, 'py-2', isInvalid ? invalid : valid, className)}
      {...props}
    />
  )
})

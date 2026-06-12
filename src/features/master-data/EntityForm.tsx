import { useState } from 'react'
import {
  useForm,
  type FieldErrors,
  type Resolver,
  type UseFormRegister,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

type FormValues = Record<string, unknown>
import { Button, Field, Input, Select } from '@/components/ui'
import { useProductsStore } from '@/store'
import { cn } from '@/lib/cn'
import type { EntityConfig, FieldConfig } from './types'

/** Resolve a possibly-nested RHF error (e.g. "coordinates.lat"). */
function errorAt(errors: FieldErrors, name: string): string | undefined {
  const node = name.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, errors)
  const message = (node as { message?: unknown })?.message
  return typeof message === 'string' ? message : undefined
}

export interface EntityFormProps {
  config: EntityConfig
  initial?: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void
  onCancel: () => void
  submitting?: boolean
}

/**
 * Renders a create/edit form from an {@link EntityConfig}: standard fields via
 * react-hook-form + zod, plus a per-product inventory grid for facilities.
 */
export function EntityForm({ config, initial, onSubmit, onCancel, submitting }: EntityFormProps) {
  const products = useProductsStore((s) => s.items)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(config.schema as Parameters<typeof zodResolver>[0]) as Resolver<FormValues>,
    defaultValues: (initial ?? config.defaultValues) as FormValues,
  })

  const [inventory, setInventory] = useState<Record<string, number>>(
    () => (initial?.inventory as Record<string, number>) ?? {},
  )

  const submit = handleSubmit((values) => {
    onSubmit(config.hasInventory ? { ...values, inventory } : values)
  })

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {config.fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            register={register}
            error={errorAt(errors, field.name)}
          />
        ))}
      </div>

      {config.hasInventory && (
        <div className="space-y-2">
          <p className="eyebrow">Inventory on hand</p>
          {products.length === 0 ? (
            <p className="text-sm text-slate-400">Create a product first to track inventory.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <Field key={p.id} label={`${p.name} (${p.unit})`} htmlFor={`inv-${p.id}`}>
                  <Input
                    id={`inv-${p.id}`}
                    type="number"
                    min={0}
                    value={inventory[p.id] ?? 0}
                    onChange={(e) =>
                      setInventory((inv) => ({ ...inv, [p.id]: Number(e.target.value) }))
                    }
                  />
                </Field>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save changes' : `Create ${config.singular}`}
        </Button>
      </div>
    </form>
  )
}

function FormField({
  field,
  register,
  error,
}: {
  field: FieldConfig
  register: UseFormRegister<FormValues>
  error?: string
}) {
  return (
    <Field
      label={field.label}
      htmlFor={field.name}
      required={field.required}
      error={error}
      hint={field.hint}
      className={cn(field.colSpan === 2 && 'sm:col-span-2')}
    >
      {field.type === 'select' ? (
        <Select id={field.name} invalid={!!error} {...register(field.name)}>
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          id={field.name}
          type={field.type}
          step={field.type === 'number' ? 'any' : undefined}
          placeholder={field.placeholder}
          invalid={!!error}
          {...register(field.name)}
        />
      )}
    </Field>
  )
}

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Card, DataTable, Modal } from '@/components/ui'
import { useUiStore } from '@/store'
import { ENTITY_CONFIGS } from './configs'
import { EntityForm } from './EntityForm'
import type { EntityConfig } from './types'

type Row = { id: string } & Record<string, unknown>

/** Resolves the route param to an entity config and remounts the view on change. */
export function MasterDataPage() {
  const { entity } = useParams<{ entity: string }>()
  const config = entity ? ENTITY_CONFIGS[entity] : undefined

  if (!config) {
    return <PageHeader eyebrow="Admin" title="Unknown entity" description={`No master-data type "${entity}".`} />
  }
  return <MasterDataView key={config.slug} config={config} />
}

function MasterDataView({ config }: { config: EntityConfig }) {
  const items = config.store((s) => s.items) as Row[]
  const loading = config.store((s) => s.loading)
  const loaded = config.store((s) => s.loaded)
  const createItem = config.store((s) => s.create)
  const updateItem = config.store((s) => s.update)
  const removeItem = config.store((s) => s.remove)
  const addToast = useUiStore((s) => s.addToast)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const rows = config.scope ? items.filter((r) => config.scope!(r)) : items

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (row: Row) => {
    setEditing(row)
    setFormOpen(true)
  }

  const submit = async (values: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      const payload = { ...config.fixed, ...values }
      if (editing) {
        await updateItem(editing.id, payload)
        addToast('success', `${config.singular} updated.`)
      } else {
        await createItem(payload)
        addToast('success', `${config.singular} created.`)
      }
      setFormOpen(false)
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setSubmitting(true)
    try {
      await removeItem(deleting.id)
      addToast('success', `${config.singular} deleted.`)
      setDeleting(null)
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title={config.title}
        description={config.description}
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New {config.singular}
          </Button>
        }
      />

      <Card>
        <DataTable<Row>
          data={rows}
          columns={config.columns}
          rowKey={(r) => r.id}
          loading={loading && !loaded}
          searchable
          searchPlaceholder={`Search ${config.title.toLowerCase()}…`}
          getSearchText={config.searchText as ((r: Row) => string) | undefined}
          empty={{
            title: `No ${config.title.toLowerCase()} yet`,
            description: `Create your first ${config.singular.toLowerCase()} to get started.`,
            action: (
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" /> New {config.singular}
              </Button>
            ),
          }}
          actions={(row) => (
            <>
              <Button variant="ghost" size="sm" onClick={() => openEdit(row)} aria-label="Edit">
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(row)} aria-label="Delete">
                <Trash2 className="size-4 text-red-500" />
              </Button>
            </>
          )}
        />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${config.singular}` : `New ${config.singular}`}
        description={config.description}
      >
        <EntityForm
          config={config}
          initial={editing ?? undefined}
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete ${config.singular}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={submitting} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This will permanently remove this {config.singular.toLowerCase()}. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, EmptyState } from '@/components/ui'

/** Temporary page body used while a feature page is being built out. */
export function Placeholder({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} />
      <Card>
        <EmptyState icon={Construction} title="Coming up next" description="This page is under construction." />
      </Card>
    </div>
  )
}

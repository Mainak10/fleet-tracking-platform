import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable, type Column } from './DataTable'

interface Row {
  id: string
  name: string
  qty: number
}

const rows: Row[] = [
  { id: '1', name: 'Alpha', qty: 30 },
  { id: '2', name: 'Bravo', qty: 10 },
  { id: '3', name: 'Charlie', qty: 20 },
]

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', sortValue: (r) => r.name },
  { key: 'qty', header: 'Qty', sortValue: (r) => r.qty },
]

const bodyNames = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('tbody tr')).map(
    (tr) => tr.querySelector('td')?.textContent ?? '',
  )

describe('DataTable', () => {
  it('filters rows by the search box', async () => {
    const user = userEvent.setup()
    render(<DataTable data={rows} columns={columns} rowKey={(r) => r.id} searchable />)

    await user.type(screen.getByLabelText('Search'), 'alph')

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Bravo')).not.toBeInTheDocument()
  })

  it('renders the empty state when nothing matches', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchable
        empty={{ title: 'Nothing here' }}
      />,
    )

    await user.type(screen.getByLabelText('Search'), 'zzz')
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('toggles sort order and reflects it in aria-sort', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DataTable data={rows} columns={columns} rowKey={(r) => r.id} />,
    )

    const qtyHeader = screen.getByText('Qty').closest('th')!

    await user.click(screen.getByRole('button', { name: /qty/i }))
    expect(bodyNames(container)).toEqual(['Bravo', 'Charlie', 'Alpha']) // 10, 20, 30
    expect(qtyHeader).toHaveAttribute('aria-sort', 'ascending')

    await user.click(screen.getByRole('button', { name: /qty/i }))
    expect(bodyNames(container)).toEqual(['Alpha', 'Charlie', 'Bravo']) // 30, 20, 10
    expect(qtyHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('invokes onRowClick on click and on keyboard activation', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(
      <DataTable data={rows} columns={columns} rowKey={(r) => r.id} onRowClick={onRowClick} />,
    )

    const alphaRow = screen.getByText('Alpha').closest('tr')!
    await user.click(alphaRow)
    expect(onRowClick).toHaveBeenCalledWith(rows[0])

    // Rows are keyboard-operable controls.
    expect(alphaRow).toHaveAttribute('role', 'button')
    expect(alphaRow).toHaveAttribute('tabindex', '0')
    alphaRow.focus()
    await user.keyboard('{Enter}')
    expect(onRowClick).toHaveBeenCalledTimes(2)
  })

  it('shows skeleton rows while loading instead of data', () => {
    const { container } = render(
      <DataTable data={rows} columns={columns} rowKey={(r) => r.id} loading />,
    )
    // No data rows render while loading.
    expect(within(container).queryByText('Alpha')).not.toBeInTheDocument()
  })
})

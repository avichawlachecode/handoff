import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NormalizeTab from './NormalizeTab'
import { demoDeal } from '@/lib/demoDeal'

function renderTab() {
  return render(
    <MemoryRouter>
      <NormalizeTab dealId="demo" deal={demoDeal} />
    </MemoryRouter>,
  )
}

describe('NormalizeTab (financials normalizer)', () => {
  it('shows claimed vs normalized SDE and the delta', () => {
    renderTab()
    expect(screen.getByText('$752,000')).toBeInTheDocument()
    expect(screen.getByText('$455,000')).toBeInTheDocument()
    // Delta and total-removed both read −$297,000.
    expect(screen.getAllByText(/297,000/).length).toBeGreaterThan(0)
  })

  it('lists the add-back ledger including the non-recurring adjustment row', () => {
    renderTab()
    expect(screen.getByText("Owner's son on payroll")).toBeInTheDocument()
    expect(screen.getByText('Deferred equipment maintenance')).toBeInTheDocument()
    expect(screen.getByText(/Non-recurring adjustment/i)).toBeInTheDocument()
  })

  it('expands a row to reveal the lender note', async () => {
    const user = userEvent.setup()
    renderTab()
    expect(screen.queryByText(/What a lender will ask for/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Toggle lender note for Owner's son on payroll/i }))
    expect(screen.getByText(/What a lender will ask for/i)).toBeInTheDocument()
  })

  it('shows the severity-ordered red flags and the pencil CTA', () => {
    renderTab()
    expect(screen.getByText('Recurring revenue overstated')).toBeInTheDocument()
    expect(screen.getByText('Customer concentration')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /See what this pencils at/i })).toBeInTheDocument()
  })
})

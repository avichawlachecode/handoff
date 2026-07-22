import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PencilTab from './PencilTab'
import { demoDeal } from '@/lib/demoDeal'

function renderTab() {
  return render(
    <MemoryRouter>
      <PencilTab dealId="demo" deal={demoDeal} />
    </MemoryRouter>,
  )
}

describe('PencilTab (Bank Pencil Check — the hero)', () => {
  it('shows the headline: asking, pencil price, and gap', () => {
    renderTab()
    expect(screen.getByText('$1,950,000')).toBeInTheDocument()
    expect(screen.getAllByText('$1,365,000').length).toBeGreaterThan(0)
    expect(screen.getByText('−$585,000')).toBeInTheDocument()
  })

  it('marks the multiple as the binding constraint', () => {
    renderTab()
    expect(screen.getByText('Multiple constraint')).toBeInTheDocument()
    expect(screen.getByText('Binds')).toBeInTheDocument()
  })

  it('shows sources & uses and the cash-reality residual', () => {
    renderTab()
    expect(screen.getByText('SBA 7(a) loan')).toBeInTheDocument()
    expect(screen.getByText('Minimum cash from you')).toBeInTheDocument()
    // Residual after a typical injection is $10,000 for the demo.
    expect(screen.getByText('$10,000')).toBeInTheDocument()
  })

  it('recalculates live when an assumption slider changes', () => {
    renderTab()
    expect(screen.getByText('−$585,000')).toBeInTheDocument()
    // Raising the max multiple past ~3.24× flips the binding constraint to DSCR,
    // so the pencil price and gap change.
    fireEvent.change(screen.getByLabelText('Max multiple'), { target: { value: '4' } })
    expect(screen.queryByText('−$585,000')).not.toBeInTheDocument()
  })

  it('links to the lender-ready package paywall', () => {
    renderTab()
    expect(screen.getByRole('link', { name: /Get the lender-ready package/i })).toBeInTheDocument()
  })
})

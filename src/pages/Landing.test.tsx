import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Landing from './Landing'

describe('Landing (PRD §6.1)', () => {
  it('renders the hero, before/after strip, CTAs, and pricing', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /deal team you can/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /See it on a real deal/i })).toBeInTheDocument()
    // Before/after strip numbers.
    expect(screen.getByText('$455,000')).toBeInTheDocument()
    expect(screen.getByText('$1,365,000')).toBeInTheDocument()
    // Pricing cards (shared component).
    expect(screen.getByText('Lender-Ready Pack')).toBeInTheDocument()
  })
})

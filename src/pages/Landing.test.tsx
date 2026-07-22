import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Landing from './Landing'

describe('Landing (PRD §6.1)', () => {
  it('renders the hero, before/after strip, pillars, pricing, and disclaimer', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /deal team you can/i })).toBeInTheDocument()
    // CTA appears in the sticky nav and the hero.
    expect(screen.getAllByRole('button', { name: /See it on a real deal/i }).length).toBeGreaterThanOrEqual(1)
    // Before/after comparison numbers.
    expect(screen.getByText('$752,000')).toBeInTheDocument()
    expect(screen.getByText('$455,000')).toBeInTheDocument()
    expect(screen.getByText('$1,365,000')).toBeInTheDocument()
    // The screenshot line and its navy delta.
    expect(screen.getByText('$585,000')).toBeInTheDocument()
    // Pricing (shared tier data).
    expect(screen.getByText('Lender-Ready Pack')).toBeInTheDocument()
    expect(screen.getByText('Most popular')).toBeInTheDocument()
    // Footer disclaimer (Landing renders its own now).
    expect(screen.getByText(/Not affiliated with the U\.S\. Small Business Administration/i)).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoiTab from './LoiTab'

describe('LoiTab (LOI Protection Pack — PRD §4 stretch #10)', () => {
  it('lists the protective clauses with a "without it" explanation and checkboxes', () => {
    render(
      <MemoryRouter>
        <LoiTab dealId="demo" />
      </MemoryRouter>,
    )
    expect(screen.getByText('Exclusivity (no-shop)')).toBeInTheDocument()
    expect(screen.getByText('SBA seller-note full standby')).toBeInTheDocument()
    expect(screen.getAllByText('Without it:').length).toBeGreaterThanOrEqual(6)
    expect(screen.getAllByRole('checkbox')).toHaveLength(6)
  })
})

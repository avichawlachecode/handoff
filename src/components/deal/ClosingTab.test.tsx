import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ClosingTab from './ClosingTab'

describe('ClosingTab (Closing Checklist — PRD §4 stretch #11)', () => {
  it('shows a sequenced task list with task, owner, and target day', () => {
    render(
      <MemoryRouter>
        <ClosingTab dealId="demo" />
      </MemoryRouter>,
    )
    expect(screen.getByText('Signed LOI executed')).toBeInTheDocument()
    expect(screen.getByText('Closing / funding')).toBeInTheDocument()
    // Column headers.
    expect(screen.getByRole('columnheader', { name: 'Owner' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Target day' })).toBeInTheDocument()
    // A target day and an owner badge.
    expect(screen.getByText('Day 60')).toBeInTheDocument()
    expect(screen.getAllByText('landlord').length).toBeGreaterThanOrEqual(1)
    // One checkbox per task (12).
    expect(screen.getAllByRole('checkbox')).toHaveLength(12)
  })
})

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DealJourney from './DealJourney'

function renderRail(activeTab: string) {
  return render(
    <MemoryRouter>
      <DealJourney dealId="d1" activeTab={activeTab} />
    </MemoryRouter>,
  )
}

describe('DealJourney rail', () => {
  it('renders all seven stages', () => {
    renderRail('screen')
    for (const label of ['Source', 'Screen', 'Normalize', 'Pencil', 'Verify', 'LOI', 'Close']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('links built stages to their tabs and greys unbuilt stages with a v2 badge', () => {
    renderRail('screen')
    expect(screen.getByRole('link', { name: /Normalize/i })).toHaveAttribute('href', '/deals/d1?tab=normalize')
    expect(screen.getByRole('link', { name: /Pencil/i })).toHaveAttribute('href', '/deals/d1?tab=pencil')
    // Verify is now built (Task 12); LOI and Close remain v2.
    expect(screen.getByRole('link', { name: /Verify/i })).toHaveAttribute('href', '/deals/d1?tab=verify')
    expect(screen.getAllByText('v2')).toHaveLength(2)
  })

  it('highlights the current stage', () => {
    renderRail('normalize')
    expect(screen.getByRole('link', { name: /Normalize/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Screen/i })).not.toHaveAttribute('aria-current')
  })

  it('maps the gutcheck/package tabs onto the Pencil stage', () => {
    renderRail('package')
    expect(screen.getByRole('link', { name: /Pencil/i })).toHaveAttribute('aria-current', 'page')
  })
})

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

  it('links every stage to its tab (all built after Task 13 — no v2 remaining)', () => {
    renderRail('screen')
    expect(screen.getByRole('link', { name: /Normalize/i })).toHaveAttribute('href', '/deals/d1?tab=normalize')
    expect(screen.getByRole('link', { name: /Pencil/i })).toHaveAttribute('href', '/deals/d1?tab=pencil')
    expect(screen.getByRole('link', { name: /Verify/i })).toHaveAttribute('href', '/deals/d1?tab=verify')
    expect(screen.getByRole('link', { name: /LOI/i })).toHaveAttribute('href', '/deals/d1?tab=loi')
    expect(screen.getByRole('link', { name: /Close/i })).toHaveAttribute('href', '/deals/d1?tab=close')
    expect(screen.queryByText('v2')).not.toBeInTheDocument()
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

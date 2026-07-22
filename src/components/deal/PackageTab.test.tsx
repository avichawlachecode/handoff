import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PackageTab from './PackageTab'

describe('PackageTab (paywall / A1 test — PRD §6.8)', () => {
  it('shows a price variant, the contents, and the three response options', () => {
    render(
      <MemoryRouter>
        <PackageTab dealId="demo" />
      </MemoryRouter>,
    )
    // One of the two A/B price variants.
    expect(screen.getByText(/^\$(10|25),000$/)).toBeInTheDocument()
    expect(screen.getByText(/SBA-compliant structure memo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^I'd pay this$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /I'd pay, but less/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /I wouldn't pay for this/i })).toBeInTheDocument()
  })

  it('reveals the willingness-to-pay prompt', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <PackageTab dealId="demo" />
      </MemoryRouter>,
    )
    expect(screen.queryByText(/What would you pay\?/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /I'd pay, but less/i }))
    expect(screen.getByText(/What would you pay\?/i)).toBeInTheDocument()
  })
})

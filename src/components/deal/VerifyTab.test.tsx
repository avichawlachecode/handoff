import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import VerifyTab from './VerifyTab'
import { demoDeal } from '@/lib/demoDeal'

describe('VerifyTab (PRD §4 stretch #12)', () => {
  it('shows verification sections for the fired red flags with request language', async () => {
    render(
      <MemoryRouter>
        <VerifyTab dealId="demo" deal={demoDeal} />
      </MemoryRouter>,
    )
    // Recurring-revenue and concentration flags fired for the demo deal.
    expect(screen.getByText('Verify recurring revenue')).toBeInTheDocument()
    expect(screen.getByText('Request a redacted contract list')).toBeInTheDocument()
    expect(screen.getByText('Billing-system screen-share protocol')).toBeInTheDocument()
    expect(screen.getByText('Customer-concentration confirmation')).toBeInTheDocument()
    // Copy-paste request language is present and selectable.
    const textarea = screen.getByLabelText(
      'Request a redacted contract list request language',
    ) as HTMLTextAreaElement
    expect(textarea.value).toContain('redacted list')
    // A persistent checkbox per item.
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThanOrEqual(4)
  })
})

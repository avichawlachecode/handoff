import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NewDeal from './NewDeal'
import { demoDeal } from '@/lib/demoDeal'

function renderForm() {
  return render(
    <MemoryRouter>
      <NewDeal />
    </MemoryRouter>,
  )
}

describe('NewDeal — 10-Minute NO Screener', () => {
  it('renders the intake form and the Load demo deal button', () => {
    renderForm()
    expect(screen.getByRole('heading', { name: /10-Minute NO Screener/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Load demo deal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add another/i })).toBeInTheDocument()
  })

  it('Load demo deal fills every field from the seed data', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /Load demo deal/i }))
    expect(screen.getByLabelText('Business name')).toHaveValue(demoDeal.businessName)
    expect(screen.getByLabelText('Asking price')).toHaveValue(String(demoDeal.askingPrice))
    // The $117k non-recurring adjustment is filled too (needed for §9 to reproduce).
    expect(screen.getByLabelText(/Non-recurring adjustment/i)).toHaveValue(
      String(demoDeal.nonRecurringAdjustment),
    )
    // One add-back row per seed add-back.
    expect(screen.getAllByLabelText('Add-back description')).toHaveLength(demoDeal.addBacks.length)
  })

  it('blocks submit and shows errors on an empty required numeric', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /Run screener/i }))
    expect(screen.getByText(/fix the highlighted fields/i)).toBeInTheDocument()
  })
})

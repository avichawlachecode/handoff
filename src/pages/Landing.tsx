import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PricingCards from '@/components/PricingCards'
import { logEvent } from '@/lib/events'
import { captureLead } from '@/lib/leads'
import { loadDemoDeal } from '@/lib/deals'

const PILLARS = [
  {
    title: 'Lender-ready in days, not weeks.',
    body: 'Normalize earnings, verify recurring revenue, and package structures banks actually fund.',
  },
  {
    title: 'Kill bad deals fast.',
    body: 'An objective gut check with explicit kill triggers — because failing to acquire is cheaper than buying the wrong business.',
  },
  {
    title: 'Close with confidence.',
    body: 'Sequenced checklist, LOI protections, and AI-drafted, attorney-reviewed documents.',
  },
  {
    title: 'Built for first-timers.',
    body: 'Playbooks, 10-minute NO screeners, and clear milestones instead of months of drift.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [leadState, setLeadState] = useState<{ status: 'idle' | 'ok' | 'error'; message?: string }>({
    status: 'idle',
  })
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)

  async function seeDemo() {
    void logEvent('cta_see_demo', { source: 'landing' })
    setDemoLoading(true)
    setDemoError(null)
    try {
      const id = await loadDemoDeal()
      navigate(`/deals/${id}?tab=screen`)
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Could not load the demo deal.')
      setDemoLoading(false)
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    void logEvent('cta_early_access', { source: 'landing' })
    setLeadSubmitting(true)
    const res = await captureLead(email, 'landing')
    setLeadSubmitting(false)
    setLeadState(res.ok ? { status: 'ok' } : { status: 'error', message: res.error })
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="space-y-6 pt-4">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The deal team you can’t afford, delivered as AI.
          </h1>
          <p className="text-lg text-muted-foreground">
            Handoff turns a seller’s messy numbers into a bank-normalized, lender-ready package — and
            tells you what the deal actually pencils at before you sign a personal guarantee.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={seeDemo}
            disabled={demoLoading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {demoLoading ? 'Loading…' : 'See it on a real deal'}
          </button>

          <form onSubmit={submitEmail} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {leadState.status === 'ok' ? (
              <p className="text-sm font-medium text-verdict-green">Thanks — you’re on the list.</p>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email for early access"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-56"
                />
                <button
                  type="submit"
                  disabled={leadSubmitting}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                >
                  Get early access
                </button>
              </>
            )}
          </form>
        </div>
        {demoError && <p className="text-sm text-destructive">{demoError}</p>}
        {leadState.status === 'error' && <p className="text-sm text-destructive">{leadState.message}</p>}
      </section>

      {/* Four messaging pillars */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <div key={p.title} className="space-y-1.5">
            <h2 className="text-base font-semibold text-foreground">{p.title}</h2>
            <p className="text-sm text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </section>

      {/* Before / after strip */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 overflow-hidden rounded-lg border sm:grid-cols-2">
          <div className="border-b p-6 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">What the seller says</p>
            <dl className="mt-3 space-y-2 text-sm">
              <BeforeAfterRow label="SDE" value="$752,000" />
              <BeforeAfterRow label="Asking" value="$1,950,000" />
              <BeforeAfterRow label="Recurring contracts" value="1,100 claimed" />
            </dl>
          </div>
          <div className="bg-secondary/40 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">What the bank sees</p>
            <dl className="mt-3 space-y-2 text-sm">
              <BeforeAfterRow label="Normalized SDE" value="$455,000" />
              <BeforeAfterRow label="Pencils at" value="$1,365,000" />
              <BeforeAfterRow label="Contracts on file" value="640" />
            </dl>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          One deal. A <span className="font-semibold text-foreground">$585,000</span> difference.
        </p>
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Pricing</h2>
        <PricingCards source="landing" />
      </section>
    </div>
  )
}

function BeforeAfterRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

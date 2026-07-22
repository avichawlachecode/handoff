import { useState } from 'react'
import PricingCards from '@/components/PricingCards'
import { logEvent } from '@/lib/events'
import { captureLead } from '@/lib/leads'

export default function Pricing() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [state, setState] = useState<{ status: 'idle' | 'ok' | 'error'; message?: string }>({ status: 'idle' })

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    void logEvent('cta_early_access', { source: 'pricing' })
    setSubmitting(true)
    const res = await captureLead(email, 'pricing')
    setSubmitting(false)
    setState(res.ok ? { status: 'ok' } : { status: 'error', message: res.error })
  }

  return (
    <div className="space-y-10">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pricing</h1>
        <p className="text-sm text-muted-foreground">
          Priced from real willingness-to-pay interviews — a flat fee for work performed, tied to the
          acquisition, not the loan.
        </p>
      </div>

      <PricingCards source="pricing" />

      <section className="rounded-lg border bg-secondary/40 p-6">
        <h2 className="text-base font-semibold text-foreground">Not ready yet?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Leave your email and we’ll reach out when you have a live deal.
        </p>
        <form onSubmit={submitEmail} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          {state.status === 'ok' ? (
            <p className="text-sm font-medium text-verdict-green">Thanks — you’re on the list.</p>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                aria-label="Email for early access"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-64"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Get early access
              </button>
            </>
          )}
        </form>
        {state.status === 'error' && <p className="mt-2 text-sm text-destructive">{state.message}</p>}
      </section>
    </div>
  )
}

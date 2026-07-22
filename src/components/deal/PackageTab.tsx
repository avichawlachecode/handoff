import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/format'
import { logEvent } from '@/lib/events'

const CONTENTS = [
  'Bank-normalized EBITDA memo with the full add-back ledger',
  'SBA-compliant structure memo (seller-note standby, injection, DSCR)',
  'Red-flag report in plain English',
  'Sources & uses and pro-forma debt schedule',
  'Draft LOI language with protections',
  'Lender submission checklist',
]

// A/B price variants (PRD §6.8) — chosen at random per view, logged.
const VARIANT_PRICE: Record<'A' | 'B', number> = { A: 10_000, B: 25_000 }

type Mode = 'idle' | 'less' | 'no'

export default function PackageTab({ dealId }: { dealId: string }) {
  const navigate = useNavigate()
  const [variant] = useState<'A' | 'B'>(() => (Math.random() < 0.5 ? 'A' : 'B'))
  const price = VARIANT_PRICE[variant]

  const [mode, setMode] = useState<Mode>('idle')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void logEvent('paywall_viewed', { variant, price, dealId })
  }, [variant, price, dealId])

  async function respond(choice: string, extra: Record<string, unknown> = {}) {
    setSubmitting(true)
    await logEvent('paywall_response', { variant, price, choice, dealId, ...extra })
    navigate('/thanks')
  }

  return (
    <div className="space-y-8">
      {/* What's inside + blurred preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">What&apos;s inside the Lender-Ready Pack</h2>
          <ul className="space-y-2">
            {CONTENTS.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Watermarked / blurred preview */}
        <section aria-label="Package preview (locked)">
          <div className="relative overflow-hidden rounded-lg border bg-card p-6">
            <div className="space-y-3 blur-[3px]" aria-hidden>
              <div className="h-4 w-2/3 rounded bg-muted-foreground/30" />
              <div className="h-3 w-full rounded bg-muted-foreground/20" />
              <div className="h-3 w-11/12 rounded bg-muted-foreground/20" />
              <div className="h-3 w-5/6 rounded bg-muted-foreground/20" />
              <div className="mt-4 h-4 w-1/2 rounded bg-muted-foreground/30" />
              <div className="h-3 w-full rounded bg-muted-foreground/20" />
              <div className="h-3 w-10/12 rounded bg-muted-foreground/20" />
              <div className="h-3 w-3/4 rounded bg-muted-foreground/20" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40">
              <Lock className="h-6 w-6 text-primary" aria-hidden />
              <p className="text-sm font-medium text-foreground">Preview locked</p>
            </div>
          </div>
        </section>
      </div>

      {/* The offer */}
      <section className="rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">Lender-Ready Pack</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{formatMoney(price)}</p>
        <p className="text-sm text-muted-foreground">flat, paid at LOI</p>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => respond('would_pay')}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
          >
            I&apos;d pay this
          </button>

          <div className="flex flex-col gap-3 border-t pt-3 text-sm">
            {/* I'd pay, but less */}
            <div>
              <button
                type="button"
                onClick={() => setMode(mode === 'less' ? 'idle' : 'less')}
                className="font-medium text-primary hover:underline"
              >
                I&apos;d pay, but less
              </button>
              {mode === 'less' && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label htmlFor="wtp" className="text-muted-foreground">
                    What would you pay?
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <input
                      id="wtp"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-32 rounded-md border border-input bg-background py-1.5 pl-6 pr-2 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="7,500"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={submitting || amount.trim() === ''}
                    onClick={() => respond('would_pay_less', { amount: Number(amount.replace(/[^0-9.]/g, '')) || null })}
                    className="rounded-md border border-input bg-background px-3 py-1.5 font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>

            {/* I wouldn't pay for this */}
            <div>
              <button
                type="button"
                onClick={() => setMode(mode === 'no' ? 'idle' : 'no')}
                className="font-medium text-primary hover:underline"
              >
                I wouldn&apos;t pay for this
              </button>
              {mode === 'no' && (
                <div className="mt-2 space-y-2">
                  <label htmlFor="missing" className="block text-muted-foreground">
                    What&apos;s missing?
                  </label>
                  <textarea
                    id="missing"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="What would make this worth it?"
                  />
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => respond('would_not_pay', { reason: reason.trim() || null })}
                    className={cn(
                      'rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50',
                    )}
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        No payment is taken. This records your intent so we can learn what a lender-ready package is worth.
      </p>
    </div>
  )
}

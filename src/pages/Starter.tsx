import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { logEvent } from '@/lib/events'

const INDUSTRIES = [
  'HVAC',
  'Plumbing',
  'Electrical',
  'Commercial cleaning',
  'Pest control',
  'Landscaping',
  'B2B services',
  'Other',
]

const LESSONS = [
  {
    title: 'What a lender actually looks at',
    body: 'Banks underwrite normalized cash flow and debt-service coverage — not the seller’s asking price. Every add-back gets scrutinized line by line.',
  },
  {
    title: 'What “add-backs” really mean',
    body: 'Add-backs are costs a buyer won’t inherit. Owner perks and one-time items count; recurring spend and roles you must replace do not.',
  },
  {
    title: 'What a personal guarantee means for your household',
    body: 'An SBA 7(a) loan puts your personal assets on the line. Spouse alignment is a real decision gate — model the downside before you sign.',
  },
]

export default function Starter() {
  const navigate = useNavigate()
  const [industries, setIndustries] = useState<string[]>([])

  const toggle = (name: string) =>
    setIndustries((prev) => (prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]))

  function upgrade() {
    // A5 signal: early-stage buyer converting toward the core package.
    void logEvent('starter_upgrade_click')
    navigate('/deals/new')
  }

  return (
    <div className="space-y-12">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Starter Track</h1>
        <p className="text-sm text-muted-foreground">
          Get your bearings before you have a live deal — build a buy box, run a fast screen, and learn
          what a lender really cares about.
        </p>
      </div>

      {/* Light buy-box builder */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Build your buy box</h2>
        <p className="text-sm text-muted-foreground">Which industries would you consider?</p>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((name) => {
            const on = industries.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm',
                  on
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background text-foreground hover:bg-secondary',
                )}
              >
                {name}
              </button>
            )
          })}
        </div>
        <Link
          to="/deals/new"
          onClick={() => void logEvent('starter_screener_click')}
          className="mt-2 inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Run the 10-minute NO screener →
        </Link>
      </section>

      {/* Education */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">The basics, fast</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {LESSONS.map((l) => (
            <div key={l.title} className="rounded-lg border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground">{l.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{l.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upgrade CTA (A5) */}
      <section className="rounded-lg border border-primary bg-primary/5 p-6">
        <h2 className="text-base font-semibold text-foreground">Have a live deal?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Run a full Pencil Check and see what it actually pencils at before you sign.
        </p>
        <button
          type="button"
          onClick={upgrade}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Run a full Pencil Check →
        </button>
      </section>
    </div>
  )
}

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardCheck, Compass, FileCheck2, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logEvent } from '@/lib/events'
import { captureLead } from '@/lib/leads'
import { loadDemoDeal } from '@/lib/deals'
import { PRICING_TIERS, PRICING_FEE_NOTE } from '@/components/PricingCards'

const HAIRLINE = 'border-[#E5E7EB]'

// Footer disclaimer — PRD §6.1 wording.
const DISCLAIMER =
  'Handoff is decision support, not legal, accounting, or lending advice. All documents require attorney review. Not affiliated with the U.S. Small Business Administration.'

const PILLARS = [
  {
    icon: FileCheck2,
    title: 'Lender-ready in days, not weeks.',
    body: 'Normalize earnings, verify recurring revenue, and package structures banks actually fund.',
  },
  {
    icon: ShieldAlert,
    title: 'Kill bad deals fast.',
    body: 'An objective gut check with explicit kill triggers — because failing to acquire is cheaper than buying the wrong business.',
  },
  {
    icon: ClipboardCheck,
    title: 'Close with confidence.',
    body: 'Sequenced checklist, LOI protections, and AI-drafted, attorney-reviewed documents.',
  },
  {
    icon: Compass,
    title: 'Built for first-timers.',
    body: 'Playbooks, 10-minute NO screeners, and clear milestones instead of months of drift.',
  },
]

/** Subtle fade-up on scroll (150ms, ease-out). No parallax, no bounce. */
function FadeUp({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-150 ease-out motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [email, setEmail] = useState('')
  const [leadState, setLeadState] = useState<{ status: 'idle' | 'ok' | 'error'; message?: string }>({ status: 'idle' })
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky top nav — gains a hairline bottom border on scroll */}
      <header
        className={cn(
          'sticky top-0 z-40 bg-background transition-colors duration-150',
          scrolled ? `border-b ${HAIRLINE}` : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight text-navy">
            Handoff
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/pricing" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block">
              Pricing
            </Link>
            <button
              type="button"
              onClick={seeDemo}
              disabled={demoLoading}
              className="inline-flex items-center justify-center rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
            >
              {demoLoading ? 'Loading…' : 'See it on a real deal'}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-[3.75rem]">
            The deal team you can’t afford, delivered as AI.
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg text-muted-foreground sm:text-xl">
            Handoff turns a seller’s messy numbers into a bank-normalized, lender-ready package — and
            tells you what the deal actually pencils at before you sign a personal guarantee.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={seeDemo}
              disabled={demoLoading}
              className="inline-flex items-center justify-center rounded-md bg-navy px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
            >
              {demoLoading ? 'Loading…' : 'See it on a real deal'}
            </button>

            <form onSubmit={submitEmail} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {leadState.status === 'ok' ? (
                <p className="text-sm font-medium text-navy">Thanks — you’re on the list.</p>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    aria-label="Email for early access"
                    className={cn('w-full rounded-md border bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 sm:w-56', HAIRLINE)}
                  />
                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className={cn('inline-flex items-center justify-center rounded-md border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-[#F7F8FA] disabled:opacity-50', HAIRLINE)}
                  >
                    Get early access
                  </button>
                </>
              )}
            </form>
          </div>
          {demoError && <p className="mt-3 text-sm text-destructive">{demoError}</p>}
          {leadState.status === 'error' && <p className="mt-3 text-sm text-destructive">{leadState.message}</p>}
        </div>
      </section>

      {/* Before / after — the centerpiece */}
      <section className={cn('border-t', HAIRLINE)}>
        <div className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
          <FadeUp>
            <p className="mb-8 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              The same deal, two ways
            </p>
            <div className={cn('overflow-hidden rounded-xl border', HAIRLINE)}>
              <div className="grid grid-cols-2">
                <ComparisonHeader className={`border-r ${HAIRLINE}`}>What the seller says</ComparisonHeader>
                <ComparisonHeader>What the bank sees</ComparisonHeader>

                <ComparisonCell className={`border-t border-r ${HAIRLINE}`} label="SDE">
                  <BigNumber struck>$752,000</BigNumber>
                </ComparisonCell>
                <ComparisonCell className={`border-t ${HAIRLINE}`} label="Normalized SDE">
                  <BigNumber>$455,000</BigNumber>
                </ComparisonCell>

                <ComparisonCell className={`border-t border-r ${HAIRLINE}`} label="Asking">
                  <BigNumber struck>$1,950,000</BigNumber>
                </ComparisonCell>
                <ComparisonCell className={`border-t ${HAIRLINE}`} label="Pencils at">
                  <BigNumber>$1,365,000</BigNumber>
                </ComparisonCell>

                <ComparisonCell className={`border-t border-r ${HAIRLINE}`} label="Recurring maintenance contracts">
                  <p className="mt-1 text-lg font-medium tabular-nums text-foreground">1,100 claimed</p>
                </ComparisonCell>
                <ComparisonCell className={`border-t ${HAIRLINE}`} label="Contracts on file">
                  <p className="mt-1 text-lg font-medium tabular-nums text-foreground">640</p>
                </ComparisonCell>
              </div>
            </div>
            <p className="mt-8 text-2xl font-medium text-foreground sm:text-3xl">
              One deal. A <span className="font-semibold tabular-nums text-navy">$585,000</span> difference.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Four messaging pillars */}
      <section className={cn('border-t', HAIRLINE)}>
        <div className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
          <FadeUp>
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar) => (
                <div key={pillar.title}>
                  <pillar.icon className="h-6 w-6 text-navy" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-4 text-base font-semibold text-foreground">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Pricing */}
      <section className={cn('border-t', HAIRLINE)}>
        <div className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
          <FadeUp>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground">Pricing</h2>
            <p className="mt-3 max-w-[60ch] text-muted-foreground">
              A flat fee for work performed, tied to the acquisition — priced from real willingness-to-pay
              interviews.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={cn(
                    'flex flex-col rounded-lg border bg-background p-6',
                    HAIRLINE,
                    tier.featured && 'border-t-2 border-t-navy',
                  )}
                >
                  {tier.featured && (
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-navy">Most popular</p>
                  )}
                  <h3 className="text-sm font-semibold text-foreground">{tier.name}</h3>
                  <p className="mt-4 text-2xl font-semibold tabular-nums text-foreground">{tier.price}</p>
                  <p className="text-sm text-muted-foreground">{tier.unit}</p>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{tier.description}</p>
                  <button
                    type="button"
                    onClick={() => void logEvent('pricing_cta', { tier: tier.id, source: 'landing' })}
                    className={cn(
                      'mt-6 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
                      tier.featured
                        ? 'bg-navy text-white hover:bg-navy/90'
                        : cn('border bg-background text-foreground hover:bg-[#F7F8FA]', HAIRLINE),
                    )}
                  >
                    {tier.cta}
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-[80ch] text-xs leading-relaxed text-muted-foreground">{PRICING_FEE_NOTE}</p>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn('border-t', HAIRLINE)}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold tracking-tight text-navy">Handoff</span>
          <p className="max-w-[70ch] text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </footer>
    </div>
  )
}

function ComparisonHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</p>
    </div>
  )
}

function ComparisonCell({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('px-4 py-5 sm:px-6 sm:py-6', className)}>
      <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
      {children}
    </div>
  )
}

function BigNumber({ children, struck }: { children: ReactNode; struck?: boolean }) {
  return (
    <p
      className={cn(
        'mt-1 text-xl font-semibold tabular-nums sm:text-3xl lg:text-4xl',
        struck ? 'text-muted-foreground line-through decoration-1' : 'text-navy',
      )}
    >
      {children}
    </p>
  )
}

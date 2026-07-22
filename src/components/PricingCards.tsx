import { cn } from '@/lib/utils'
import { logEvent } from '@/lib/events'

export interface Tier {
  id: string
  name: string
  price: string
  unit: string
  description: string
  cta: string
  featured?: boolean
}

// From the WTP interview data (PRD §10).
export const PRICING_TIERS: Tier[] = [
  {
    id: 'deal_triage',
    name: 'Deal Triage',
    price: '$500',
    unit: 'per deal',
    description: '48-hour kill check with a lender’s point of view.',
    cta: 'Start a triage',
  },
  {
    id: 'lender_ready_pack',
    name: 'Lender-Ready Pack',
    price: '$10,000 / $25,000',
    unit: 'flat, paid at LOI',
    description: 'Normalized financials, red flags, SBA structure memo, and draft LOI language.',
    cta: 'Get the pack',
    featured: true,
  },
  {
    id: 'closing_navigator',
    name: 'Closing Navigator',
    price: '$2,500',
    unit: 'per month',
    description: 'Weekly checklist, stakeholder sequencing, and document & contingency tracking.',
    cta: 'Talk to us',
  },
]

/** The SBA agent-rules guardrail (PRD §10) — disclosed near pricing. */
export const PRICING_FEE_NOTE =
  'The Lender-Ready Pack fee is tied to the business acquisition, not the SBA loan, and is a flat fee for work performed (see SBA Form 159 / 13 CFR Part 103). Any success-fee experiment stays tied to the acquisition and disclosed. Run the final structure past counsel.'

export default function PricingCards({ source }: { source: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              'flex flex-col rounded-lg border p-6',
              tier.featured ? 'border-primary bg-primary/5' : 'bg-card',
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{tier.name}</h3>
              {tier.featured && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Most popular
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{tier.price}</p>
            <p className="text-sm text-muted-foreground">{tier.unit}</p>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{tier.description}</p>
            <button
              type="button"
              onClick={() => void logEvent('pricing_cta', { tier: tier.id, source })}
              className={cn(
                'mt-5 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
                tier.featured
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border border-input bg-background text-foreground hover:bg-secondary',
              )}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{PRICING_FEE_NOTE}</p>
    </div>
  )
}

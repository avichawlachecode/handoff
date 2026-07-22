import { useEffect, useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logEvent } from '@/lib/events'
import { redFlags, type DealInput } from '@/lib/calc'
import { loadVerification, setVerificationItem } from '@/lib/verification'

interface VerifyItem {
  key: string
  title: string
  request: string
}

interface VerifySection {
  flagId: string
  title: string
  items: VerifyItem[]
}

// Verification steps + copy-paste request language, keyed by the red flag that
// fired. Content only — no calculations (deal fields are interpolated as-is).
function buildSections(deal: DealInput): VerifySection[] {
  const fired = new Set(redFlags(deal).map((f) => f.id))
  const sections: VerifySection[] = []

  if (fired.has('recurring-revenue-overstated')) {
    sections.push({
      flagId: 'recurring-revenue-overstated',
      title: 'Verify recurring revenue',
      items: [
        {
          key: 'redacted-contract-list',
          title: 'Request a redacted contract list',
          request: `Could you share a redacted list of every active recurring / maintenance agreement — one row per contract with start date, renewal terms, and monthly or annual value? Redact customer names if you prefer; we need counts and terms, not identities. We're reconciling the ${deal.claimedContracts} agreements referenced against what's actually on file.`,
        },
        {
          key: 'billing-screen-share',
          title: 'Billing-system screen-share protocol',
          request: `We'd like a 30-minute screen-share of your billing / field-service system (ServiceTitan, Housecall Pro, QuickBooks, etc.). Please filter to active recurring plans, show the live count and recurring monthly revenue on screen, then export that same view to CSV. This verifies the recurring base — it isn't an audit of individual customers.`,
        },
      ],
    })
  }

  if (fired.has('customer-concentration')) {
    sections.push({
      flagId: 'customer-concentration',
      title: 'Confirm customer concentration',
      items: [
        {
          key: 'concentration-confirmation',
          title: 'Customer-concentration confirmation',
          request: `Please confirm revenue by customer for the trailing twelve months: the top customer's share of revenue (we have ${deal.topCustomerPct}% noted), the top-5 combined share, and — for the largest account — the contract type (month-to-month vs. term), tenure, and renewal / termination terms. A redacted sales-by-customer or A/R aging report is perfect.`,
        },
      ],
    })
  }

  if (fired.has('revenue-spike')) {
    sections.push({
      flagId: 'revenue-spike',
      title: 'Explain the revenue trend',
      items: [
        {
          key: 'revenue-spike-explanation',
          title: 'Break down the one-year revenue change',
          request: `Your largest single-year revenue change was about ${deal.largestYoyChangePct}%. Could you split that year's revenue into recurring vs. one-time / project work, and flag any single job that materially moved the total? We're trying to understand the repeatable run-rate, not the peak.`,
        },
      ],
    })
  }

  if (fired.has('add-back-density')) {
    sections.push({
      flagId: 'add-back-density',
      title: 'Document the add-backs',
      items: [
        {
          key: 'add-back-documentation',
          title: 'Request add-back documentation',
          request: `For each add-back to earnings, could you provide support we can hand a lender: receipts or statements for owner personal expenses, the settlement or invoice for one-time items, payroll records for any family or owner roles, and a fixed-asset schedule for anything maintenance- or equipment-related?`,
        },
      ],
    })
  }

  if (fired.has('undisclosed-motivation')) {
    sections.push({
      flagId: 'undisclosed-motivation',
      title: 'Understand seller motivation',
      items: [
        {
          key: 'motivation-questions',
          title: 'Ask about the reason for sale',
          request: `Help us understand the timing and reason for the sale, and whether there are any declining trends, lost accounts, or pending issues we should know about before we sign an LOI.`,
        },
      ],
    })
  }

  if (fired.has('thin-history')) {
    sections.push({
      flagId: 'thin-history',
      title: 'Get the full history',
      items: [
        {
          key: 'full-financials',
          title: 'Request full financial history',
          request: `Could you provide financial statements and tax returns for all available years, plus year-to-date interim statements? With ${deal.yearsInBusiness} years of history we want the trend, not a single snapshot.`,
        },
      ],
    })
  }

  return sections
}

export default function VerifyTab({ dealId, deal }: { dealId: string; deal: DealInput }) {
  const sections = useMemo(() => buildSections(deal), [deal])
  const allKeys = useMemo(() => sections.flatMap((s) => s.items.map((i) => i.key)), [sections])

  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadVerification(dealId).then((map) => {
      if (active) {
        setChecked(map)
        setLoaded(true)
      }
    })
    return () => {
      active = false
    }
  }, [dealId])

  async function toggle(key: string) {
    const next = !checked[key]
    setChecked((prev) => ({ ...prev, [key]: next }))
    setError(null)
    void logEvent('verify_item_toggled', { dealId, item: key, checked: next })
    try {
      await setVerificationItem(dealId, key, next)
    } catch (err) {
      // Revert on failure.
      setChecked((prev) => ({ ...prev, [key]: !next }))
      setError(err instanceof Error ? err.message : 'Could not save. Try again.')
    }
  }

  async function copy(item: VerifyItem) {
    try {
      await navigator.clipboard?.writeText(item.request)
      setCopiedKey(item.key)
      void logEvent('verify_copy', { dealId, item: item.key })
      setTimeout(() => setCopiedKey((k) => (k === item.key ? null : k)), 1500)
    } catch {
      // Clipboard unavailable — the textarea remains selectable.
    }
  }

  const doneCount = allKeys.filter((k) => checked[k]).length

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No open red flags on this deal — there’s nothing to verify before an LOI.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Before you sign an LOI, close the gaps behind each red flag. Send the seller or broker the
          request language below and check items off as they’re satisfied.
        </p>
        <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
          {doneCount}/{allKeys.length} verified
        </span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {sections.map((section) => (
        <section key={section.flagId} className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
          <div className="space-y-3">
            {section.items.map((item) => {
              const isChecked = !!checked[item.key]
              return (
                <div key={item.key} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      aria-label={item.title}
                      disabled={!loaded}
                      onClick={() => toggle(item.key)}
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                        isChecked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background',
                      )}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-sm font-medium', isChecked ? 'text-muted-foreground line-through' : 'text-foreground')}>
                          {item.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => copy(item)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedKey === item.key ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={item.request}
                        rows={4}
                        aria-label={`${item.title} request language`}
                        className="mt-2 w-full resize-none rounded-md border border-input bg-secondary/40 p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

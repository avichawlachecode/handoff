// Pure, deterministic financial logic for Handoff.
//
// Every output is traceable to a rule in the PRD. No I/O, no framework code, no
// randomness — this file is the single source of truth for all calculations
// (CLAUDE.md: "All financial logic lives in src/lib/calc.ts").
//
// See docs/PRD.md §8 (calculation spec) and §9 (demo-deal expected outputs).

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReasonForSale =
  | 'retiring'
  | 'health'
  | 'relocating'
  | 'other venture'
  | 'declining'
  | 'undisclosed'

export type AddBackCategory =
  | 'Personal expense'
  | 'One-time event'
  | 'Non-operating'
  | 'Owner perk'
  | 'Growth investment'
  | 'Other'

export type AddBackVerdict = 'Allowed' | 'Disallowed'

export interface AddBack {
  description: string
  amount: number
  category: AddBackCategory
}

export interface AddBackResult extends AddBack {
  verdict: AddBackVerdict
  /** Plain-English "why", shown next to the verdict (PRD §6.5). */
  rationale: string
  /** Expandable "what a lender will ask for" note (PRD §6.5). */
  lenderNote: string
}

export interface DealInput {
  businessName: string
  industry: string
  location: string
  askingPrice: number
  revenueTtm: number
  yearsInBusiness: number
  reasonForSale: ReasonForSale

  reportedNetIncome: number
  ownerComp: number
  interestExpense: number
  depreciationAmort: number

  addBacks: AddBack[]

  /**
   * Non-recurring revenue adjustment excluded from run-rate earnings, e.g. a
   * one-off new-construction job margin. This is NOT an add-back row; it is
   * subtracted from normalized SDE on top of the disallowed add-backs
   * (PRD §9, "Additional non-recurring adjustment"). Without it the demo deal
   * normalizes to $572,000 instead of $455,000.
   */
  nonRecurringAdjustment: number

  topCustomerPct: number
  top5CustomerPct: number
  claimedContracts: number
  verifiedContracts: number
  largestYoyChangePct: number
}

export interface Assumptions {
  /** Annual interest rate as a decimal, e.g. 0.11 for 11%. */
  interestRate: number
  termYears: number
  buyerSalary: number
  annualCapex: number
  requiredDscr: number
  maxMultiple: number
}

export type ScreenerVerdict = 'GREEN' | 'AMBER' | 'RED'
export type GutCheckVerdict = 'KILL' | 'PROCEED WITH CONDITIONS' | 'GREENLIGHT'
export type FlagSeverity = 'red' | 'amber'

export interface RedFlag {
  id: string
  label: string
  severity: FlagSeverity
  /** The rule that fired. */
  rule: string
  /** The number that triggered it. */
  detail: string
}

// ---------------------------------------------------------------------------
// Model constants (PRD §6.6 / §8). Structural values, not slider-adjustable.
// ---------------------------------------------------------------------------

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  interestRate: 0.11,
  termYears: 10,
  buyerSalary: 120_000,
  annualCapex: 45_000,
  requiredDscr: 1.25,
  maxMultiple: 3.0,
}

export const WORKING_CAPITAL = 50_000
export const CLOSING_COSTS = 35_000
export const MIN_EQUITY_INJECTION_PCT = 0.1
export const MAX_SELLER_NOTE_INJECTION_PCT = 0.5
export const LENDER_TYPICAL_INJECTION_PCT = 0.2

// Keyword rules for add-back auto-verdicts (PRD §8).
const PAYROLL_KEYWORDS = ['payroll', 'salary', 'salaries', 'wage', 'wages']
const CAPEX_KEYWORDS = ['maintenance', 'equipment', 'repair', 'repairs']

// ---------------------------------------------------------------------------
// SDE
// ---------------------------------------------------------------------------

export function sumAddBacks(deal: DealInput): number {
  return deal.addBacks.reduce((sum, ab) => sum + ab.amount, 0)
}

/** Claimed SDE = net income + owner comp + interest + D&A + Σ(all add-backs). */
export function claimedSDE(deal: DealInput): number {
  return (
    deal.reportedNetIncome +
    deal.ownerComp +
    deal.interestExpense +
    deal.depreciationAmort +
    sumAddBacks(deal)
  )
}

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

/** Auto-verdict a single add-back per the PRD §8 rules. */
export function verdictForAddBack(addBack: AddBack, claimedSdeValue: number): AddBackResult {
  const disallow = (rationale: string, lenderNote: string): AddBackResult => ({
    ...addBack,
    verdict: 'Disallowed',
    rationale,
    lenderNote,
  })
  const allow = (rationale: string, lenderNote: string): AddBackResult => ({
    ...addBack,
    verdict: 'Allowed',
    rationale,
    lenderNote,
  })

  // Structural disallowances apply regardless of the declared category.
  if (matchesAny(addBack.description, PAYROLL_KEYWORDS)) {
    return disallow(
      'Payroll for a role the buyer must replace — not a discretionary add-back.',
      'A lender will ask who performs this role after close and what it costs to replace them (role, W-2, market wage).',
    )
  }
  if (matchesAny(addBack.description, CAPEX_KEYWORDS)) {
    return disallow(
      'Capital expenditure (maintenance / equipment / repair), not an add-back.',
      'A lender will ask for a fixed-asset schedule and the expected annual maintenance capex.',
    )
  }
  if (addBack.category === 'Growth investment') {
    return disallow(
      'Recurring in nature — the business needs this spend to hold revenue.',
      'A lender will ask whether revenue holds if this spend stops.',
    )
  }
  if (addBack.category === 'Other' && addBack.amount > 0.1 * claimedSdeValue) {
    return disallow(
      'Large "Other" add-back (>10% of claimed SDE) — requires documentation a lender will not assume.',
      'A lender will ask for documentation substantiating this add-back before crediting it.',
    )
  }

  switch (addBack.category) {
    case 'Personal expense':
    case 'Owner perk':
      return allow(
        'Documented owner benefit; ceases at close.',
        'A lender will ask for receipts showing the expense is personal and ends at close.',
      )
    case 'One-time event':
      return allow(
        'Non-recurring, documented one-time item.',
        'A lender will ask for proof the item is truly one-time (e.g., the settlement or invoice).',
      )
    case 'Non-operating':
      return allow(
        'Non-operating item, outside the normal run-rate.',
        'A lender will ask for support that this sits outside normal operations.',
      )
    default:
      return allow(
        'Accepted as a documented, non-recurring add-back.',
        'A lender will ask for documentation supporting this add-back.',
      )
  }
}

export function normalizeAddBacks(deal: DealInput): AddBackResult[] {
  const claimed = claimedSDE(deal)
  return deal.addBacks.map((ab) => verdictForAddBack(ab, claimed))
}

export function sumDisallowedAddBacks(deal: DealInput): number {
  return normalizeAddBacks(deal)
    .filter((r) => r.verdict === 'Disallowed')
    .reduce((sum, r) => sum + r.amount, 0)
}

/**
 * Bank-normalized SDE = claimed SDE − Σ(disallowed add-backs) − non-recurring
 * adjustment (PRD §8, plus the §9 run-rate adjustment).
 */
export function normalizedSDE(deal: DealInput): number {
  return claimedSDE(deal) - sumDisallowedAddBacks(deal) - deal.nonRecurringAdjustment
}

/** Signed difference (normalized − claimed); negative when normalization cuts SDE. */
export function sdeDelta(deal: DealInput): number {
  return normalizedSDE(deal) - claimedSDE(deal)
}

// ---------------------------------------------------------------------------
// Red flags & screener (PRD §8 / §6.4)
// ---------------------------------------------------------------------------

/** All red flags that fire for this deal, severity-ordered (red before amber). */
export function redFlags(deal: DealInput): RedFlag[] {
  const flags: RedFlag[] = []

  const verifiedRatio =
    deal.claimedContracts > 0 ? deal.verifiedContracts / deal.claimedContracts : 1
  if (verifiedRatio < 0.85) {
    const unverifiedPct = Math.round((1 - verifiedRatio) * 100)
    flags.push({
      id: 'recurring-revenue-overstated',
      label: 'Recurring revenue overstated',
      severity: 'red',
      rule: 'Verified contracts / claimed contracts < 85%',
      detail: `Seller claims ${deal.claimedContracts} contracts; ${deal.verifiedContracts} provided — ${unverifiedPct}% unverified.`,
    })
  }

  if (deal.topCustomerPct > 20 || deal.top5CustomerPct > 50) {
    flags.push({
      id: 'customer-concentration',
      label: 'Customer concentration',
      severity: 'red',
      rule: 'Top customer > 20% or top 5 > 50% of revenue',
      detail: `Top customer ${deal.topCustomerPct}% of revenue; top 5 ${deal.top5CustomerPct}%.`,
    })
  }

  if (Math.abs(deal.largestYoyChangePct) > 30) {
    flags.push({
      id: 'revenue-spike',
      label: 'Revenue spike',
      severity: 'amber',
      rule: 'abs(largest single-year revenue change) > 30%',
      detail: `Largest single-year revenue change is ${deal.largestYoyChangePct}%.`,
    })
  }

  const claimed = claimedSDE(deal)
  const addBackDensity = claimed > 0 ? sumAddBacks(deal) / claimed : 0
  if (addBackDensity > 0.25) {
    flags.push({
      id: 'add-back-density',
      label: 'Add-back density',
      severity: 'amber',
      rule: 'Σ add-backs / claimed SDE > 25%',
      detail: `Add-backs are ${Math.round(addBackDensity * 100)}% of claimed SDE (lenders treat ~15% as routine).`,
    })
  }

  if (deal.reasonForSale === 'declining' || deal.reasonForSale === 'undisclosed') {
    flags.push({
      id: 'undisclosed-motivation',
      label: 'Seller motivation',
      severity: 'amber',
      rule: 'Reason for sale is declining or undisclosed',
      detail: `Reason for sale: ${deal.reasonForSale}.`,
    })
  }

  if (deal.yearsInBusiness < 5) {
    flags.push({
      id: 'thin-history',
      label: 'Thin operating history',
      severity: 'amber',
      rule: 'Years in business < 5',
      detail: `Only ${deal.yearsInBusiness} years in business.`,
    })
  }

  return flags
}

export function redFlagCounts(deal: DealInput): { red: number; amber: number } {
  const flags = redFlags(deal)
  return {
    red: flags.filter((f) => f.severity === 'red').length,
    amber: flags.filter((f) => f.severity === 'amber').length,
  }
}

/** Human-readable screener rule, shown alongside the verdict banner (PRD §6.4). */
export const SCREENER_VERDICT_RULE =
  '2+ red → RED · exactly 1 red → AMBER · 0 red & 3+ amber → AMBER · 0 red & ≤2 amber → GREEN'

/**
 * Map fired-flag counts to a screener verdict per PRD §6.4:
 *   2+ red → RED · exactly 1 red → AMBER
 *   0 red & 3+ amber → AMBER · 0 red & ≤2 amber → GREEN
 *
 * Pure policy, split out so the thresholds are testable without crafting deals.
 */
export function screenerVerdictFromCounts(red: number, amber: number): ScreenerVerdict {
  if (red >= 2) return 'RED'
  if (red === 1) return 'AMBER'
  if (amber >= 3) return 'AMBER'
  return 'GREEN'
}

/**
 * Screener verdict for a deal (PRD §6.4). For the demo deal (2 red, 2 amber)
 * this is RED, matching the §9 fixture.
 */
export function screenerVerdict(deal: DealInput): ScreenerVerdict {
  const { red, amber } = redFlagCounts(deal)
  return screenerVerdictFromCounts(red, amber)
}

// ---------------------------------------------------------------------------
// Screener heat map (PRD §6.4) — eight diligence signals, each green/amber/red.
// These are a richer diagnostic than the six §8 flags (which drive the
// verdict); a few tiles are derived views (earnings quality, price) that are
// not flags. Every tile carries the rule and the number behind its color.
// ---------------------------------------------------------------------------

export type TileStatus = 'green' | 'amber' | 'red'

export interface ScreenerTile {
  id: string
  label: string
  status: TileStatus
  /** The rule behind the color. */
  rule: string
  /** The number that produced it. */
  detail: string
}

export function screenerTiles(deal: DealInput, a: Assumptions = DEFAULT_ASSUMPTIONS): ScreenerTile[] {
  const claimed = claimedSDE(deal)
  const normalized = normalizedSDE(deal)
  const density = claimed > 0 ? sumAddBacks(deal) / claimed : 0
  const verifiedRatio = deal.claimedContracts > 0 ? deal.verifiedContracts / deal.claimedContracts : 1
  const yoy = Math.abs(deal.largestYoyChangePct)
  const surviving = claimed > 0 ? normalized / claimed : 1
  const impliedMultiple = normalized > 0 ? deal.askingPrice / normalized : Infinity

  const pct = (n: number) => `${Math.round(n * 100)}%`
  const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

  const missing: string[] = []
  if (deal.revenueTtm <= 0) missing.push('revenue')
  if (deal.askingPrice <= 0) missing.push('asking price')
  if (claimed <= 0) missing.push('earnings')
  if (deal.claimedContracts <= 0) missing.push('contract counts')

  return [
    {
      id: 'add-back-quality',
      label: 'Add-back quality',
      status: density <= 0.2 ? 'green' : density <= 0.4 ? 'amber' : 'red',
      rule: 'Add-backs ÷ claimed SDE (routine ≈ 15%)',
      detail: `Add-backs are ${pct(density)} of claimed SDE.`,
    },
    {
      id: 'customer-concentration',
      label: 'Customer concentration',
      status:
        deal.topCustomerPct > 20 || deal.top5CustomerPct > 50
          ? 'red'
          : deal.topCustomerPct > 15 || deal.top5CustomerPct > 40
            ? 'amber'
            : 'green',
      rule: 'Top customer > 20% or top 5 > 50% of revenue',
      detail: `Top customer ${deal.topCustomerPct}% of revenue; top 5 at ${deal.top5CustomerPct}%.`,
    },
    {
      id: 'recurring-revenue-verification',
      label: 'Recurring revenue verification',
      status: verifiedRatio >= 0.85 ? 'green' : verifiedRatio >= 0.7 ? 'amber' : 'red',
      rule: 'Contracts provided ÷ claimed (≥ 85%)',
      detail: `${deal.verifiedContracts} of ${deal.claimedContracts} claimed contracts provided (${pct(verifiedRatio)} verified).`,
    },
    {
      id: 'revenue-trend',
      label: 'Revenue trend',
      status: yoy <= 20 ? 'green' : yoy <= 50 ? 'amber' : 'red',
      rule: 'Largest single-year revenue swing',
      detail: `Largest single-year change is ${deal.largestYoyChangePct}%.`,
    },
    {
      id: 'earnings-quality',
      label: 'Earnings quality',
      status: surviving >= 0.8 ? 'green' : surviving >= 0.55 ? 'amber' : 'red',
      rule: 'Share of claimed SDE surviving normalization',
      detail: `${pct(surviving)} of claimed SDE survives (${usd(claimed)} → ${usd(normalized)}).`,
    },
    {
      id: 'price-vs-normalized',
      label: 'Price vs. normalized earnings',
      status:
        impliedMultiple <= a.maxMultiple
          ? 'green'
          : impliedMultiple <= a.maxMultiple * 1.25
            ? 'amber'
            : 'red',
      rule: `Asking ÷ normalized SDE vs. ${a.maxMultiple.toFixed(1)}× lender max`,
      detail: `Ask is ${impliedMultiple.toFixed(1)}× normalized SDE (lenders cap near ${a.maxMultiple.toFixed(1)}×).`,
    },
    {
      id: 'seller-motivation',
      label: 'Seller motivation',
      status:
        deal.reasonForSale === 'declining' ? 'red' : deal.reasonForSale === 'undisclosed' ? 'amber' : 'green',
      rule: 'Declining or undisclosed motivation is a flag',
      detail: `Reason for sale: ${deal.reasonForSale}.`,
    },
    {
      id: 'data-completeness',
      label: 'Data completeness',
      status: missing.length === 0 ? 'green' : missing.length <= 2 ? 'amber' : 'red',
      rule: 'Core diligence inputs present',
      detail: missing.length === 0 ? 'All core inputs provided.' : `Missing: ${missing.join(', ')}.`,
    },
  ]
}

// ---------------------------------------------------------------------------
// Bank Pencil Check (PRD §6.6 / §8)
// ---------------------------------------------------------------------------

export interface PencilResult {
  normalizedSDE: number
  cads: number
  annualLoanConstant: number
  maxAnnualDebtService: number
  maxLoan: number
  dscrMaxProjectCost: number
  dscrMaxPrice: number
  multipleMaxPrice: number
  pencilPrice: number
  bindingConstraint: 'dscr' | 'multiple'
  askingPrice: number
  gap: number
  gapPct: number
  totalProjectCost: number
  sbaLoan: number
  equityInjection: number
  maxSellerNoteCredit: number
  minBuyerCash: number
  lenderTypicalInjection: number
  residualLiquidity: number
}

/** Cash available for debt service = normalized SDE − buyer salary − capex. */
export function cads(normalizedSdeValue: number, a: Assumptions): number {
  return normalizedSdeValue - a.buyerSalary - a.annualCapex
}

/** Annualized monthly-amortizing loan constant (PRD §8). */
export function loanConstant(interestRate: number, termYears: number): number {
  const r = interestRate / 12
  const n = termYears * 12
  if (r === 0) return 12 / n
  const factor = r / (1 - Math.pow(1 + r, -n))
  return factor * 12
}

export function pencilCheck(deal: DealInput, a: Assumptions, buyerLiquidCash = 0): PencilResult {
  const nSde = normalizedSDE(deal)

  // Debt-service constraint.
  const cadsValue = cads(nSde, a)
  const maxAnnualDebtService = cadsValue / a.requiredDscr
  const annualLoanConstant = loanConstant(a.interestRate, a.termYears)
  const maxLoan = maxAnnualDebtService / annualLoanConstant
  const dscrMaxProjectCost = maxLoan / (1 - MIN_EQUITY_INJECTION_PCT)
  const dscrMaxPrice = round(dscrMaxProjectCost - WORKING_CAPITAL - CLOSING_COSTS)

  // Multiple constraint.
  const multipleMaxPrice = round(nSde * a.maxMultiple)

  // Lenders apply both; the lower binds.
  const pencilPrice = Math.min(dscrMaxPrice, multipleMaxPrice)
  const bindingConstraint = multipleMaxPrice <= dscrMaxPrice ? 'multiple' : 'dscr'

  const gap = deal.askingPrice - pencilPrice
  const gapPct = deal.askingPrice !== 0 ? gap / deal.askingPrice : 0

  // Sources & uses at the pencil price.
  const totalProjectCost = pencilPrice + WORKING_CAPITAL + CLOSING_COSTS
  const equityInjection = round(MIN_EQUITY_INJECTION_PCT * totalProjectCost)
  const sbaLoan = totalProjectCost - equityInjection
  const maxSellerNoteCredit = round(MAX_SELLER_NOTE_INJECTION_PCT * equityInjection)
  const minBuyerCash = equityInjection - maxSellerNoteCredit
  const lenderTypicalInjection = round(LENDER_TYPICAL_INJECTION_PCT * totalProjectCost)
  const residualLiquidity = buyerLiquidCash - lenderTypicalInjection

  return {
    normalizedSDE: nSde,
    cads: cadsValue,
    annualLoanConstant,
    maxAnnualDebtService,
    maxLoan: round(maxLoan),
    dscrMaxProjectCost: round(dscrMaxProjectCost),
    dscrMaxPrice,
    multipleMaxPrice,
    pencilPrice,
    bindingConstraint,
    askingPrice: deal.askingPrice,
    gap,
    gapPct,
    totalProjectCost,
    sbaLoan,
    equityInjection,
    maxSellerNoteCredit,
    minBuyerCash,
    lenderTypicalInjection,
    residualLiquidity,
  }
}

/**
 * DSCR the deal would carry at a given purchase price (PRD §6.6 sensitivity):
 * cash available for debt service ÷ annual debt service on a max-leverage loan
 * (10% injection) at that price. Falls as price rises.
 */
export function dscrAtPrice(deal: DealInput, a: Assumptions, price: number): number {
  const cadsValue = cads(normalizedSDE(deal), a)
  const projectCost = price + WORKING_CAPITAL + CLOSING_COSTS
  const loan = projectCost * (1 - MIN_EQUITY_INJECTION_PCT)
  const annualDebtService = loan * loanConstant(a.interestRate, a.termYears)
  return annualDebtService > 0 ? cadsValue / annualDebtService : 0
}

// ---------------------------------------------------------------------------
// Gut Check (PRD §8)
// ---------------------------------------------------------------------------

/**
 * KILL if ≥2 red flags or the pencil gap exceeds 25% of the ask.
 * PROCEED WITH CONDITIONS if 1 red flag or the gap is 10–25%.
 * GREENLIGHT otherwise.
 */
export function gutCheckVerdict(deal: DealInput, a: Assumptions): GutCheckVerdict {
  const redCount = redFlagCounts(deal).red
  const { gapPct } = pencilCheck(deal, a)
  if (redCount >= 2 || gapPct > 0.25) return 'KILL'
  if (redCount === 1 || (gapPct >= 0.1 && gapPct <= 0.25)) return 'PROCEED WITH CONDITIONS'
  return 'GREENLIGHT'
}

export interface GutCheckReport {
  verdict: GutCheckVerdict
  /** Explicit conditions that produced the verdict (PRD §6.7: 3–5 for a KILL). */
  killTriggers: string[]
  /** What would have to be true to flip the verdict. */
  whatWouldFlip: string[]
  /** Five concrete questions to ask the seller next. */
  questionsForSeller: string[]
}

/** Narrative Gut Check (PRD §6.7), derived from the flags and the pencil gap. */
export function gutCheckReport(deal: DealInput, a: Assumptions = DEFAULT_ASSUMPTIONS): GutCheckReport {
  const flags = redFlags(deal)
  const firedIds = new Set(flags.map((f) => f.id))
  const p = pencilCheck(deal, a)
  const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

  const killTriggers: string[] = []
  const whatWouldFlip: string[] = []

  if (firedIds.has('recurring-revenue-overstated')) {
    const verifiedPct =
      deal.claimedContracts > 0 ? Math.round((deal.verifiedContracts / deal.claimedContracts) * 100) : 0
    const threshold = Math.ceil(0.85 * deal.claimedContracts)
    killTriggers.push(
      `Recurring revenue cannot be verified above 85% of the seller's claim — only ${verifiedPct}% (${deal.verifiedContracts} of ${deal.claimedContracts}) are on paper.`,
    )
    whatWouldFlip.push(
      `Recurring revenue verifies above ${threshold} contracts (85% of the ${deal.claimedContracts} claimed).`,
    )
  }

  if (firedIds.has('customer-concentration')) {
    killTriggers.push(
      `Customer concentration is above a lender's comfort — the top customer is ${deal.topCustomerPct}% of revenue.`,
    )
    whatWouldFlip.push('The top-customer contract converts to a multi-year term agreement.')
  }

  if (p.gapPct > 0.25) {
    killTriggers.push(`The deal pencils ${Math.round(p.gapPct * 100)}% below the ask (${money(p.gap)} gap).`)
    whatWouldFlip.push(`The price is renegotiated toward the ${money(p.pencilPrice)} pencil price.`)
  }

  // Pad toward the §6.7 "3–5" range with the amber flags that also fired.
  for (const f of flags) {
    if (killTriggers.length >= 5) break
    if (f.severity === 'amber') killTriggers.push(`${f.label}: ${f.detail}`)
  }

  const questionsForSeller = [
    `Can you provide signed contracts for all ${deal.claimedContracts} recurring accounts?`,
    'What are the terms, tenure, and renewal history of your largest customer?',
    'Which add-backs will you document — payroll, deferred capex, and one-time items?',
    `What drove the ${deal.largestYoyChangePct}% revenue change, and is it repeatable?`,
    'Would you carry a larger seller note on full standby, or adjust the price?',
  ]

  return { verdict: gutCheckVerdict(deal, a), killTriggers, whatWouldFlip, questionsForSeller }
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

export interface DealComputation {
  claimedSDE: number
  normalizedSDE: number
  sdeDelta: number
  addBackResults: AddBackResult[]
  redFlags: RedFlag[]
  redCount: number
  amberCount: number
  screenerVerdict: ScreenerVerdict
  pencil: PencilResult
  gutCheck: GutCheckVerdict
}

/** Run the full deterministic analysis for a deal in one call. */
export function computeDeal(
  deal: DealInput,
  a: Assumptions = DEFAULT_ASSUMPTIONS,
  buyerLiquidCash = 0,
): DealComputation {
  const flags = redFlags(deal)
  return {
    claimedSDE: claimedSDE(deal),
    normalizedSDE: normalizedSDE(deal),
    sdeDelta: sdeDelta(deal),
    addBackResults: normalizeAddBacks(deal),
    redFlags: flags,
    redCount: flags.filter((f) => f.severity === 'red').length,
    amberCount: flags.filter((f) => f.severity === 'amber').length,
    screenerVerdict: screenerVerdict(deal),
    pencil: pencilCheck(deal, a, buyerLiquidCash),
    gutCheck: gutCheckVerdict(deal, a),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Round to the nearest whole dollar. */
function round(n: number): number {
  return Math.round(n)
}

import { supabase, isSupabaseConfigured } from './supabase'
import { ensureSession } from './auth'
import { demoDeal } from './demoDeal'
import {
  computeDeal,
  DEFAULT_ASSUMPTIONS,
  type AddBackCategory,
  type Assumptions,
  type DealInput,
  type ReasonForSale,
} from './calc'

/**
 * Persist a screener deal: the deal row, its add-backs (with computed
 * verdicts), its assumptions, and its computed results — then return the new
 * deal id. All financial values come from calc.ts; no math happens here.
 */
export async function saveScreenerDeal(
  input: DealInput,
  assumptions: Assumptions = DEFAULT_ASSUMPTIONS,
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }

  const userId = await ensureSession()
  const computation = computeDeal(input, assumptions)

  // 1. The deal.
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .insert({
      user_id: userId,
      business_name: input.businessName,
      industry: input.industry,
      location: input.location,
      asking_price: input.askingPrice,
      revenue_ttm: input.revenueTtm,
      years_in_business: input.yearsInBusiness,
      reason_for_sale: input.reasonForSale,
      reported_net_income: input.reportedNetIncome,
      owner_comp: input.ownerComp,
      interest_expense: input.interestExpense,
      depreciation_amort: input.depreciationAmort,
      non_recurring_adjustment: input.nonRecurringAdjustment,
      top_customer_pct: input.topCustomerPct,
      top5_customer_pct: input.top5CustomerPct,
      claimed_contracts: input.claimedContracts,
      verified_contracts: input.verifiedContracts,
      largest_yoy_change_pct: input.largestYoyChangePct,
      is_demo: false,
    })
    .select('id')
    .single()

  if (dealError || !deal) {
    throw new Error(`Could not save the deal: ${dealError?.message ?? 'unknown error'}`)
  }
  const dealId = deal.id as string

  // 2. Add-backs, with the auto-verdicts from the calc engine.
  if (computation.addBackResults.length > 0) {
    const { error } = await supabase.from('add_backs').insert(
      computation.addBackResults.map((r) => ({
        deal_id: dealId,
        description: r.description,
        amount: r.amount,
        category: r.category,
        verdict: r.verdict,
        rationale: r.rationale,
      })),
    )
    if (error) throw new Error(`Could not save add-backs: ${error.message}`)
  }

  // 3. Assumptions used for the pencil check.
  {
    const { error } = await supabase.from('assumptions').insert({
      deal_id: dealId,
      interest_rate: assumptions.interestRate,
      term_years: assumptions.termYears,
      buyer_salary: assumptions.buyerSalary,
      annual_capex: assumptions.annualCapex,
      required_dscr: assumptions.requiredDscr,
      max_multiple: assumptions.maxMultiple,
    })
    if (error) throw new Error(`Could not save assumptions: ${error.message}`)
  }

  // 4. Computed results.
  {
    const p = computation.pencil
    const { error } = await supabase.from('deal_results').insert({
      deal_id: dealId,
      claimed_sde: computation.claimedSDE,
      normalized_sde: computation.normalizedSDE,
      screener_verdict: computation.screenerVerdict,
      red_flags: computation.redFlags,
      dscr_max_price: p.dscrMaxPrice,
      multiple_max_price: p.multipleMaxPrice,
      pencil_price: p.pencilPrice,
      gut_check_verdict: computation.gutCheck,
    })
    if (error) throw new Error(`Could not save results: ${error.message}`)
  }

  return dealId
}

export interface LoadedDeal {
  id: string
  businessName: string
  isDemo: boolean
  /** Reconstructed calc input — the Deal Room recomputes results from this. */
  input: DealInput
}

/**
 * Load a deal (and its add-backs) and map it back to a DealInput. Returns null
 * when the deal does not exist or RLS hides it. Results are recomputed from the
 * input via calc.ts, so there is one source of truth for every number.
 */
export async function loadDeal(dealId: string): Promise<LoadedDeal | null> {
  const { data: deal, error } = await supabase.from('deals').select('*').eq('id', dealId).maybeSingle()
  if (error) throw new Error(`Could not load the deal: ${error.message}`)
  if (!deal) return null

  const { data: addBacks, error: abError } = await supabase
    .from('add_backs')
    .select('*')
    .eq('deal_id', dealId)
  if (abError) throw new Error(`Could not load add-backs: ${abError.message}`)

  const n = (v: unknown) => (v == null ? 0 : Number(v))
  const input: DealInput = {
    businessName: deal.business_name ?? '',
    industry: deal.industry ?? '',
    location: deal.location ?? '',
    askingPrice: n(deal.asking_price),
    revenueTtm: n(deal.revenue_ttm),
    yearsInBusiness: n(deal.years_in_business),
    reasonForSale: (deal.reason_for_sale ?? 'undisclosed') as ReasonForSale,
    reportedNetIncome: n(deal.reported_net_income),
    ownerComp: n(deal.owner_comp),
    interestExpense: n(deal.interest_expense),
    depreciationAmort: n(deal.depreciation_amort),
    addBacks: (addBacks ?? []).map((a) => ({
      description: a.description ?? '',
      amount: n(a.amount),
      category: (a.category ?? 'Other') as AddBackCategory,
    })),
    nonRecurringAdjustment: n(deal.non_recurring_adjustment),
    topCustomerPct: n(deal.top_customer_pct),
    top5CustomerPct: n(deal.top5_customer_pct),
    claimedContracts: n(deal.claimed_contracts),
    verifiedContracts: n(deal.verified_contracts),
    largestYoyChangePct: n(deal.largest_yoy_change_pct),
  }

  return {
    id: deal.id,
    businessName: deal.business_name ?? 'Untitled deal',
    isDemo: !!deal.is_demo,
    input,
  }
}

/** Create a deal from the Keystone demo seed and return its id (PRD §6.1 CTA). */
export async function loadDemoDeal(): Promise<string> {
  return saveScreenerDeal(demoDeal)
}

export interface DealSummary {
  id: string
  businessName: string
  askingPrice: number
  createdAt: string
}

/** The current session's deals, newest first (for the /deals pipeline). */
export async function listDeals(): Promise<DealSummary[]> {
  if (!isSupabaseConfigured) return []
  const { data } = await supabase.auth.getSession()
  if (!data.session) return []
  const { data: rows, error } = await supabase
    .from('deals')
    .select('id, business_name, asking_price, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Could not list deals: ${error.message}`)
  return (rows ?? []).map((r) => ({
    id: r.id,
    businessName: r.business_name ?? 'Untitled deal',
    askingPrice: r.asking_price == null ? 0 : Number(r.asking_price),
    createdAt: r.created_at,
  }))
}

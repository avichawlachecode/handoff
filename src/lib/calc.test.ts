import {
  DEFAULT_ASSUMPTIONS,
  claimedSDE,
  computeDeal,
  gutCheckVerdict,
  normalizeAddBacks,
  normalizedSDE,
  pencilCheck,
  redFlagCounts,
  redFlags,
  screenerVerdict,
  screenerVerdictFromCounts,
  sdeDelta,
  sumDisallowedAddBacks,
} from './calc'
import { DEMO_BUYER_LIQUID_CASH, demoDeal } from './demoDeal'

// The Keystone Air & Heat demo deal is the golden fixture from PRD §9. Every
// number below is asserted straight from that section.
describe('Keystone Air & Heat demo deal (PRD §9)', () => {
  // --- Required assertions (PRD §12 Task 2) ---
  it('claimed SDE is $752,000', () => {
    expect(claimedSDE(demoDeal)).toBe(752_000)
  })

  it('bank-normalized SDE is $455,000', () => {
    expect(normalizedSDE(demoDeal)).toBe(455_000)
  })

  it('multiple-max price is $1,365,000', () => {
    expect(pencilCheck(demoDeal, DEFAULT_ASSUMPTIONS).multipleMaxPrice).toBe(1_365_000)
  })

  it('pencil price is $1,365,000', () => {
    expect(pencilCheck(demoDeal, DEFAULT_ASSUMPTIONS).pencilPrice).toBe(1_365_000)
  })

  it('gut-check verdict is KILL', () => {
    expect(gutCheckVerdict(demoDeal, DEFAULT_ASSUMPTIONS)).toBe('KILL')
  })

  // --- The delta and the run-rate adjustment ---
  it('SDE delta is -$297,000', () => {
    expect(sdeDelta(demoDeal)).toBe(-297_000)
  })

  it('subtracts the $117,000 non-recurring adjustment on top of disallowed add-backs', () => {
    // 752,000 claimed − 180,000 disallowed add-backs = 572,000; then the
    // separate one-off new-construction margin brings it to 455,000.
    expect(sumDisallowedAddBacks(demoDeal)).toBe(180_000)
    expect(demoDeal.nonRecurringAdjustment).toBe(117_000)
    expect(claimedSDE(demoDeal) - sumDisallowedAddBacks(demoDeal)).toBe(572_000)
    expect(normalizedSDE(demoDeal)).toBe(455_000)
  })
})

describe('Add-back auto-verdicts (PRD §8)', () => {
  const results = normalizeAddBacks(demoDeal)

  it('returns one result per add-back with a rationale on every row', () => {
    expect(results).toHaveLength(5)
    for (const r of results) {
      expect(r.rationale.length).toBeGreaterThan(0)
    }
  })

  it('allows the personal-expense and one-time-event add-backs', () => {
    expect(results[0]).toMatchObject({ description: "Owner's personal vehicle & travel", verdict: 'Allowed' })
    expect(results[1]).toMatchObject({ description: 'One-time legal settlement', verdict: 'Allowed' })
  })

  it('disallows growth investment, payroll, and capex add-backs', () => {
    expect(results[2]).toMatchObject({ description: 'Marketing experiment', verdict: 'Disallowed' })
    expect(results[3]).toMatchObject({ description: "Owner's son on payroll", verdict: 'Disallowed' })
    expect(results[4]).toMatchObject({ description: 'Deferred equipment maintenance', verdict: 'Disallowed' })
  })
})

describe('Red flags and screener (PRD §8 / §6.4)', () => {
  it('fires exactly 2 red and 2 amber flags', () => {
    expect(redFlagCounts(demoDeal)).toEqual({ red: 2, amber: 2 })
  })

  it('marks recurring-revenue and concentration as red, spike and density as amber', () => {
    const byId = Object.fromEntries(redFlags(demoDeal).map((f) => [f.id, f]))
    expect(byId['recurring-revenue-overstated'].severity).toBe('red')
    expect(byId['customer-concentration'].severity).toBe('red')
    expect(byId['revenue-spike'].severity).toBe('amber')
    expect(byId['add-back-density'].severity).toBe('amber')
    // These do not fire for this deal (retiring seller, 18-year history).
    expect(byId['undisclosed-motivation']).toBeUndefined()
    expect(byId['thin-history']).toBeUndefined()
  })

  it('every fired flag carries the rule and the number that triggered it', () => {
    for (const f of redFlags(demoDeal)) {
      expect(f.rule.length).toBeGreaterThan(0)
      expect(f.detail.length).toBeGreaterThan(0)
    }
  })

  // PRD §6.4 (aligned to the §9 fixture): 2+ red → RED. The demo deal fires
  // 2 red, so the screener verdict is RED.
  it('screener verdict is RED (2+ red flags)', () => {
    expect(screenerVerdict(demoDeal)).toBe('RED')
  })
})

describe('Screener thresholds (PRD §6.4)', () => {
  it('2+ red → RED (no overlap at the 2-red boundary)', () => {
    expect(screenerVerdictFromCounts(2, 0)).toBe('RED')
    expect(screenerVerdictFromCounts(2, 2)).toBe('RED')
    expect(screenerVerdictFromCounts(3, 5)).toBe('RED')
  })

  it('exactly 1 red → AMBER', () => {
    expect(screenerVerdictFromCounts(1, 0)).toBe('AMBER')
    expect(screenerVerdictFromCounts(1, 9)).toBe('AMBER')
  })

  it('0 red & 3+ amber → AMBER', () => {
    expect(screenerVerdictFromCounts(0, 3)).toBe('AMBER')
  })

  it('0 red & ≤2 amber → GREEN', () => {
    expect(screenerVerdictFromCounts(0, 0)).toBe('GREEN')
    expect(screenerVerdictFromCounts(0, 2)).toBe('GREEN')
  })
})

describe('Bank Pencil Check (PRD §6.6 / §8)', () => {
  const p = pencilCheck(demoDeal, DEFAULT_ASSUMPTIONS, DEMO_BUYER_LIQUID_CASH)

  it('the multiple is the binding constraint', () => {
    expect(p.bindingConstraint).toBe('multiple')
    expect(p.dscrMaxPrice).toBeGreaterThan(p.multipleMaxPrice)
  })

  it('DSCR-max price is ~$1,475,000', () => {
    expect(p.dscrMaxPrice).toBeGreaterThan(1_470_000)
    expect(p.dscrMaxPrice).toBeLessThan(1_478_000)
  })

  it('gap to ask is $585,000 (30%)', () => {
    expect(p.gap).toBe(585_000)
    expect(p.gapPct).toBeCloseTo(0.3, 5)
  })

  it('sources & uses at the pencil price total $1,450,000', () => {
    expect(p.totalProjectCost).toBe(1_450_000)
    expect(p.sbaLoan).toBe(1_305_000)
    expect(p.equityInjection).toBe(145_000)
    expect(p.maxSellerNoteCredit).toBe(72_500)
    expect(p.minBuyerCash).toBe(72_500)
  })

  it('a lender-typical 20% injection ($290,000) leaves a $10,000 residual', () => {
    expect(p.lenderTypicalInjection).toBe(290_000)
    expect(p.residualLiquidity).toBe(10_000)
  })
})

describe('computeDeal aggregate', () => {
  it('bundles the full analysis for the demo deal', () => {
    const c = computeDeal(demoDeal, DEFAULT_ASSUMPTIONS, DEMO_BUYER_LIQUID_CASH)
    expect(c.claimedSDE).toBe(752_000)
    expect(c.normalizedSDE).toBe(455_000)
    expect(c.pencil.pencilPrice).toBe(1_365_000)
    expect(c.gutCheck).toBe('KILL')
    expect(c.addBackResults).toHaveLength(5)
    expect(c.redCount).toBe(2)
    expect(c.amberCount).toBe(2)
  })
})

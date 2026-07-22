import type { Assumptions, DealInput } from './calc'
import { DEFAULT_ASSUMPTIONS } from './calc'

/**
 * "Keystone Air & Heat" — the seed demo deal (PRD §9). Hard-coded so the demo
 * reproduces every expected number exactly. Do not let the numbers drift.
 */
export const demoDeal: DealInput = {
  // Listing
  businessName: 'Keystone Air & Heat',
  industry: 'Residential & light-commercial HVAC',
  location: 'Bucks County, PA',
  askingPrice: 1_950_000,
  revenueTtm: 2_400_000,
  yearsInBusiness: 18,
  reasonForSale: 'retiring',

  // Reported earnings
  reportedNetIncome: 205_000,
  ownerComp: 180_000,
  interestExpense: 22_000,
  depreciationAmort: 95_000,

  // Claimed add-backs ($250,000 total)
  addBacks: [
    { description: "Owner's personal vehicle & travel", amount: 30_000, category: 'Personal expense' },
    { description: 'One-time legal settlement', amount: 40_000, category: 'One-time event' },
    { description: 'Marketing experiment', amount: 75_000, category: 'Growth investment' },
    { description: "Owner's son on payroll", amount: 55_000, category: 'Other' },
    { description: 'Deferred equipment maintenance', amount: 50_000, category: 'Other' },
  ],

  // Additional non-recurring adjustment: one-off new-construction job margin,
  // excluded from run-rate. NOT an add-back row (PRD §9).
  nonRecurringAdjustment: 117_000,

  // Concentration & recurring
  topCustomerPct: 24,
  top5CustomerPct: 51,
  claimedContracts: 1_100,
  verifiedContracts: 640,
  largestYoyChangePct: 34,
}

/** Buyer profile fields from PRD §9 (these live on `profiles`, not `deals`). */
export const DEMO_BUYER_LIQUID_CASH = 300_000
export const DEMO_PG_COMFORT = 'Need to discuss with spouse'

/** The demo runs on the default assumptions (PRD §6.6). */
export const DEMO_ASSUMPTIONS: Assumptions = DEFAULT_ASSUMPTIONS

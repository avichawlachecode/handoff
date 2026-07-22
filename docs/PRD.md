# Handoff — MVP Prototype PRD
### Grounded in Assignment 1 & 2 canvases (real interviews)

---

## 0. How to use this document

Sections 1–11 are the spec — read them, share them with the team, submit them.
**Section 12 contains task prompts for Claude Code**, in build order. One task per phase, one pull request per phase. Merge each PR before starting the next task so the next sandbox clones the updated code.

Do not paste the whole PRD into a single task; the agent will hallucinate scope and you will lose control of the build. Reference sections by number instead — the agent reads this file from the repo.

**What this prototype is:** a clickable, demo-able prototype with realistic seeded data and deterministic (rule-based) logic that *looks and feels* like AI.
**What it is not:** a working AI product. There is no real document parsing, no bank integration, no live SBA rules engine. That is correct and intentional — see §4.

---

## 1. What we are building, and what it must prove

Handoff replaces the deal team a first-time buyer can't afford. The MVP prototype makes one part of that tangible: **the Messy Middle** — turning a seller's messy numbers into a bank-normalized, lender-ready view, and telling the buyer what the deal is actually worth to a lender.

The prototype is a **discovery instrument**, not just a demo. It exists to move these assumptions (from our CPS canvas) from claimed to evidenced:

| ID | Assumption | How the prototype tests it |
|---|---|---|
| **A1** | Buyers will pay $10k–$25k pre-close for a lender-ready package and verification | Paywall moment after the Pencil Price reveal; capture click-through at two price points |
| **A3** | An unbiased "Gut Check" materially reduces bad deals | Kill/greenlight verdict with explicit kill triggers; capture whether users agree with the verdict |
| **A5** | Early-stage buyers convert to the core package | Starter Track path with an upgrade prompt; capture upgrade intent |
| **CDP KPIs** | Landing CTR ≥3%, email capture ≥20%, purchase-intent clicks ≥10% | Landing page + waitlist + pricing CTAs, instrumented |

**Design consequence:** every screen must end in a measurable action. No dead ends.

---

## 2. Users

**Primary (build for this person):** Self-funded first-time SMB buyer, SBA-backed. 6–18 months into search, $200k–$400k equity, targeting recurring-revenue service businesses within 1–2 hours' drive, SBA 7(a) as the core financing path. Has a live target or is under LOI. Background in ops/sales/PM — comfortable with numbers, not with accounting.

**Secondary (light path only):** Early-stage part-time buyer, 0–6 months in, still employed, low "map literacy," highest anxiety in financing/accounting. Gets the Starter Track: buy-box, screener, education. Not the focus of the build.

**Negative persona (explicitly not served):** Corporate-run franchise candidates. Our interviews found corporate handles site/finance/ops, the process runs 2–5 years, and the candidate will not delegate.
→ **Therefore: no franchise features, no FDD/Item 19 module, no franchisor flows in this MVP.** If the agent suggests them, refuse.

---

## 3. The hero moment — build everything toward this

Our real interviews identified the single strongest buying trigger: **lender feedback that "this pencils at $X, not the ask."**

So the prototype's climax is one screen: **the Pencil Price.**

> Seller is asking **$1,950,000**.
> Based on bank-normalized earnings, this deal pencils at **$1,365,000**.
> **Gap: $585,000.**

Everything before it (intake, normalization, red flags) exists to earn credibility for that number. Everything after it (lender-ready pack, LOI protections, paywall) monetizes it.

If you build only one thing, build this.

---

## 4. Scope

### In scope (MVP v1)
1. Marketing landing page with pricing and waitlist capture
2. Buy-box setup (2-minute onboarding)
3. Deal list / pipeline
4. **10-Minute NO Screener** — fast go/no-go heat map
5. **Financials Normalizer + Red Flagger** — bank-normalized SDE with an add-back-by-add-back verdict
6. **Bank Pencil Check** — DSCR model, sources & uses, equity injection, **Pencil Price**
7. **Gut Check verdict** — kill / caution / greenlight with explicit triggers
8. **Lender-Ready Package preview** — gated behind the paywall (this is the A1 test)
9. Pricing / paywall screen with instrumented CTAs

### Stretch (only if time remains)
10. LOI Protection Pack — checklist of clauses with plain-English explanation
11. Managed Closing Checklist — stakeholder sequencing and timeline
12. Pre-LOI Verification Toolkit — request templates

### Explicitly out of scope
- Real PDF/Excel parsing of tax returns (users type numbers into a form, or load the demo deal)
- Any live SBA rules API, lender API, or listing-marketplace integration
- Real attorney review, real document generation, e-signature
- Payments. The "Buy" button records intent and shows a thank-you. **Never take money in a class prototype.**
- Multi-user collaboration, roles, notifications, mobile app

---

## 5. Information architecture

```
/                     Landing page (public)
/pricing              Pricing + intent capture (public)
/onboarding           Buy-box setup (3 steps)
/deals                Deal pipeline (list + "Add deal" + "Load demo deal")
/deals/new            10-Minute NO Screener (intake form)
/deals/:id            Deal Room shell with tabs:
   ?tab=screen           Screener result heat map
   ?tab=normalize        Financials Normalizer + Red Flags
   ?tab=pencil           Bank Pencil Check + PENCIL PRICE  ← hero
   ?tab=gutcheck         Gut Check verdict
   ?tab=package          Lender-Ready Package (gated)
/starter              Starter Track (secondary persona, light)
/thanks               Post-intent confirmation
/admin                Event counts (hard-coded admin email only)
```

Auth: Supabase email/password, but **allow a "Continue as guest / Try the demo deal" path**. In user testing, a login wall kills your funnel data.

---

## 6. Screen specifications

### 6.1 Landing page `/`

**Hero**
- H1: *The deal team you can't afford, delivered as AI.*
- Sub: *Handoff turns a seller's messy numbers into a bank-normalized, lender-ready package — and tells you what the deal actually pencils at before you sign a personal guarantee.*
- Primary CTA: **See it on a real deal** → `/deals` with demo deal loaded
- Secondary CTA: **Get early access** → email capture

**Section: the four messaging pillars** (from our CDP canvas — use this copy)
1. **Lender-ready in days, not weeks.** Normalize earnings, verify recurring revenue, and package structures banks actually fund.
2. **Kill bad deals fast.** An objective gut check with explicit kill triggers — because failing to acquire is cheaper than buying the wrong business.
3. **Close with confidence.** Sequenced checklist, LOI protections, and AI-drafted, attorney-reviewed documents.
4. **Built for first-timers.** Playbooks, 10-minute NO screeners, and clear milestones instead of months of drift.

**Section: before / after strip**
Two columns. Left "What the seller says": SDE $752,000 · Asking $1,950,000 · "1,100 recurring maintenance contracts."
Right "What the bank sees": Normalized SDE $455,000 · Pencils at $1,365,000 · 640 contracts on file.
Caption: *One deal. A $585,000 difference.*

**Section: pricing** (three cards, from our WTP interview data — see §10)

**Footer disclaimer:** *Handoff is decision support, not legal, accounting, or lending advice. All documents require attorney review. Not affiliated with the U.S. Small Business Administration.*

**Acceptance:** email capture writes to `leads`; every CTA fires an analytics event.

---

### 6.2 Onboarding `/onboarding` — 3 steps, skippable

1. **Where are you?** — Just exploring (0–6 mo) / Actively searching (6–18 mo) / **Under LOI or have a live target** *(this routes the secondary persona to `/starter`)*
2. **Your buy box** — industries (multi-select: HVAC, plumbing, electrical, commercial cleaning, pest control, landscaping, B2B services, other); max drive time; target SDE range; max purchase price
3. **Your capital** — liquid cash available; comfort with a personal guarantee (Yes / Nervous / Need to discuss with spouse)

The PG question is not decoration — spouse alignment surfaced in our interviews as a real decision gate, and "Nervous"/"Need to discuss" should later trigger the PG Risk Brief.

**Acceptance:** writes to `profiles`; skippable; pre-fills the demo deal if skipped.

---

### 6.3 10-Minute NO Screener `/deals/new`

Single scrolling form, four cards, ~15 fields. Must be completable in under 10 minutes — that promise is the product name.

**Card A — The listing:** business name, industry, location, asking price, revenue (TTM), years in business, reason for sale (dropdown: retiring / health / relocating / other venture / declining / undisclosed)

**Card B — Reported earnings:** reported net income, owner compensation, interest, depreciation & amortization

**Card C — Add-backs (repeating rows):** description + amount + category (Personal expense / One-time event / Non-operating / Owner perk / Growth investment / Other). "Add another" button. This is the heart of the normalizer — make it pleasant.

**Card D — Concentration & recurring:** top customer % of revenue, top 5 customers % of revenue, seller-claimed recurring contracts (count), contracts actually provided (count), largest single-year revenue change (%)

Submit → runs the rules → routes to `/deals/:id?tab=screen`.

**Acceptance:** validation on required numerics; a persistent **"Load demo deal"** button fills every field with the seed data in §9.

---

### 6.4 Screener result `?tab=screen`

Heat map: a grid of 8 tiles, each **green / amber / red**, each with a one-line plain-English reason.

Tiles: Add-back quality · Customer concentration · Recurring revenue verification · Revenue trend · Earnings quality · Price vs. normalized earnings · Seller motivation · Data completeness

Above the grid, a single verdict banner:
- 2+ red → **RED — likely a 10-minute NO**
- exactly 1 red → **AMBER — proceed only if these resolve**
- 0 red, 3+ amber → **AMBER — proceed only if these resolve**
- 0 red, ≤2 amber → **GREEN — worth real diligence**

Below: `Continue to Financial Normalizer →`

**Acceptance:** each tile shows the *rule* that fired and the *number* that triggered it. Never show a verdict without showing the math — trust is the entire product.

---

### 6.5 Financials Normalizer `?tab=normalize`

**Top:** two large numbers side by side —
`Seller-claimed SDE $752,000` → `Bank-normalized SDE $455,000` with the delta in red: `−$297,000`.

**Middle — the add-back ledger.** A table, one row per add-back:

| Add-back | Amount | Verdict | Why |
|---|---|---|---|
| Owner's personal vehicle & travel | $30,000 | ✅ Allowed | Documented personal expense; ceases at close |
| One-time legal settlement | $40,000 | ✅ Allowed | Non-recurring, documented |
| Marketing experiment | $75,000 | ❌ Disallowed | Recurring in nature — the business needs marketing to hold revenue |
| Owner's son on payroll | $55,000 | ❌ Disallowed | He is the dispatcher; the role must be replaced |
| Deferred equipment maintenance | $50,000 | ❌ Disallowed | This is capex, not an add-back |
| One-off new-construction job margin | $117,000 | ❌ Disallowed | Non-repeatable; excluded from run-rate |

Each row expandable with a short "what a lender will ask for" note.

**Bottom — Red Flags,** severity-ordered, plain English:
- 🔴 **Recurring revenue overstated.** Seller claims 1,100 maintenance agreements; 640 contracts provided. 42% unverified.
- 🔴 **Customer concentration.** Top customer is 24% of revenue on a month-to-month property-management contract.
- 🟠 **Revenue spike.** 2024 revenue up 34%, driven by a single new-construction job that will not repeat.
- 🟠 **Add-back density.** Claimed add-backs are 33% of claimed SDE — well above the ~15% a lender treats as routine.

CTA: `See what this pencils at →`

---

### 6.6 Bank Pencil Check `?tab=pencil` ← **the hero screen**

**Block 1 — The headline.** Full-width, high contrast:
> **Asking $1,950,000 · Pencils at $1,365,000 · Gap $585,000**

**Block 2 — Why.** Show *both* binding constraints as two cards, and state which one binds:
- **Debt service constraint:** at 1.25× DSCR the deal supports a $1,475,000 price
- **Multiple constraint:** at 3.0× normalized SDE the deal supports a $1,365,000 price
- Caption: *The multiple is the binding constraint. Lenders apply both.*

**Block 3 — Sources & Uses**, at the pencil price, as a table:

| Uses | | Sources | |
|---|---|---|---|
| Purchase price | $1,365,000 | SBA 7(a) loan | $1,305,000 |
| Working capital | $50,000 | Buyer cash injection | $72,500 |
| Closing costs & fees | $35,000 | Seller note (full standby) | $72,500 |
| **Total project cost** | **$1,450,000** | **Total** | **$1,450,000** |

**Block 4 — The cash reality** (this is the emotional core; do not skip it):
- Minimum equity injection (10% of project cost): **$145,000**
- Maximum that a full-standby seller note may cover (50%): **$72,500**
- **Minimum cash from you: $72,500**
- Lender-typical injection (20%): **$290,000**
- Your stated liquidity: **$300,000** → residual after a typical injection: **$10,000**
- ⚠️ *At a lender-typical injection this leaves you almost no operating cushion. Most lenders will want to see reserves.*

**Block 5 — DSCR sensitivity.** Recharts line chart: purchase price on X, DSCR on Y, with a horizontal threshold line at 1.25 and a marker where the ask sits (DSCR ≈ 0.9 → visibly under water).

**Block 6 — Adjustable assumptions** (sliders, live recalculation): interest rate (default 11.0%), term (default 10 yrs), buyer salary (default $120,000), annual capex (default $45,000), required DSCR (default 1.25), max multiple (default 3.0×).

Making these adjustable is what turns a static demo into something a real buyer will play with for ten minutes — which is exactly the behavior you want to observe in testing.

CTA: `Get the lender-ready package →` (to the paywall)

---

### 6.7 Gut Check `?tab=gutcheck`

A single verdict card — **KILL / PROCEED WITH CONDITIONS / GREENLIGHT** — with:
- 3–5 explicit **kill triggers** that fired, each stated as a condition ("Recurring revenue cannot be verified above 70% of seller claim")
- A **"What would have to be true"** list: the specific things that, if resolved, would flip the verdict
- A **"What to ask the seller next"** list of 5 concrete questions

Framing line, straight from our positioning: *We get paid whether or not you buy. Your broker doesn't.*

---

### 6.8 Lender-Ready Package `?tab=package` — **the paywall / A1 test**

Show a **blurred or watermarked preview** of the package contents, with a clear list of what's inside:
- Bank-normalized EBITDA memo with the full add-back ledger
- SBA-compliant structure memo (seller-note standby, injection, DSCR)
- Red-flag report in plain English
- Sources & uses and pro-forma debt schedule
- Draft LOI language with protections
- Lender submission checklist

Then the offer, with **two price variants A/B tested at random**:
- Variant A: **$10,000** flat, paid at LOI
- Variant B: **$25,000** flat, paid at LOI

Below the button, three plain-text options that capture honest signal instead of a fake purchase:
- `I'd pay this` → `/thanks`
- `I'd pay, but less` → prompt: *What would you pay?* (free-text number)
- `I wouldn't pay for this` → prompt: *What's missing?* (free text)

**This is the single most valuable screen in the prototype for your assignment.** It converts a demo into data on A1. Log the variant shown, the choice made, and the free-text answer.

---

### 6.9 Starter Track `/starter` (secondary persona, keep light)

One page: buy-box builder, the 10-minute NO screener, three educational cards (What a lender actually looks at · What "add-backs" really mean · What a personal guarantee means for your household), and a single upgrade CTA: *Have a live deal? Run a full Pencil Check →*. Log upgrade clicks — that is your A5 signal.

---

## 7. Data model (Supabase)

```sql
profiles      id, email, stage, industries[], max_drive_time, target_sde_min,
              target_sde_max, max_price, liquid_cash, pg_comfort, created_at

deals         id, user_id, business_name, industry, location, asking_price,
              revenue_ttm, years_in_business, reason_for_sale,
              reported_net_income, owner_comp, interest_expense, depreciation_amort,
              top_customer_pct, top5_customer_pct,
              claimed_contracts, verified_contracts, largest_yoy_change_pct,
              is_demo, created_at

add_backs     id, deal_id, description, amount, category, verdict, rationale

deal_results  id, deal_id, claimed_sde, normalized_sde, screener_verdict,
              red_flags jsonb, dscr_max_price, multiple_max_price, pencil_price,
              gut_check_verdict, computed_at

assumptions   id, deal_id, interest_rate, term_years, buyer_salary, annual_capex,
              required_dscr, max_multiple

leads         id, email, source, created_at

events        id, session_id, user_id, event_name, properties jsonb, created_at
```

Row-level security: users see only their own rows. The demo deal is readable by all.

---

## 8. Calculation spec (deterministic — no AI required)

Implement these as pure functions in `src/lib/calc.ts`. Every output must be traceable to a rule.

**Claimed SDE** = reported net income + owner comp + interest + D&A + Σ(all claimed add-backs)

**Normalized SDE** = claimed SDE − Σ(disallowed add-backs)

**Add-back auto-verdict rules:**
- `Personal expense`, `Owner perk`, `One-time event` → Allowed
- `Growth investment` → Disallowed *(recurring in nature)*
- `Other` where amount > 10% of claimed SDE → Disallowed *(requires documentation)*
- Any add-back described with payroll/salary/wage keywords → Disallowed *(role must be replaced)*
- Any add-back described with maintenance/equipment/repair keywords → Disallowed *(capex, not add-back)*

**Red-flag rules:**
| Flag | Trigger |
|---|---|
| Recurring revenue overstated | verified_contracts / claimed_contracts < 0.85 |
| Customer concentration | top_customer_pct > 20% **or** top5_customer_pct > 50% |
| Revenue spike | abs(largest_yoy_change_pct) > 30% |
| Add-back density | Σ add-backs / claimed SDE > 0.25 |
| Undisclosed motivation | reason_for_sale ∈ {declining, undisclosed} |
| Thin history | years_in_business < 5 |

Severity: red for the first two, amber for the rest. Screener verdict per §6.4.

**Cash available for debt service (CADS)** = normalized SDE − buyer salary − annual capex

**Max annual debt service** = CADS / required DSCR

**Loan constant** (monthly amortization, annualized):
```
r = interest_rate / 12
factor = r / (1 − (1 + r)^(−term_years × 12))
annual_constant = factor × 12
```

**Max loan** = max annual debt service / annual_constant
**DSCR-max project cost** = max loan / 0.90  *(SBA 7(a): 10% minimum equity injection)*
**DSCR-max price** = DSCR-max project cost − working capital − closing costs
**Multiple-max price** = normalized SDE × max_multiple
**PENCIL PRICE** = MIN(DSCR-max price, Multiple-max price) — and report which one binds

**Equity injection** = 0.10 × total project cost
**Max seller-note credit toward injection** = 0.50 × equity injection *(full standby)*
**Minimum buyer cash** = equity injection − max seller-note credit
**Residual liquidity** = user liquid_cash − (0.20 × project cost)

**Gut Check verdict:** KILL if ≥2 red flags or pencil gap > 25% of ask. PROCEED WITH CONDITIONS if 1 red or gap 10–25%. GREENLIGHT otherwise.

> ⚠️ **Guardrail for the team:** these thresholds are modeling defaults for a prototype, not verified current SBA policy. SOP 50 10 rules changed in June 2025 and again in March 2026. Label the app's outputs as illustrative, and re-verify every rule before anything real is built on it.

---

## 9. Seed demo deal — "Keystone Air & Heat"

Hard-code this in `src/lib/demoDeal.ts` and expose it via a **"Load demo deal"** button everywhere. A great demo lives or dies on the seed data; do not let the agent invent its own.

**Listing:** Keystone Air & Heat · Residential & light-commercial HVAC · Bucks County, PA · Asking **$1,950,000** · TTM revenue **$2,400,000** · 18 years in business · Reason for sale: retiring

**Reported earnings:** net income $205,000 · owner comp $180,000 · interest $22,000 · D&A $95,000

**Claimed add-backs ($250,000 total):**
| Description | Amount | Category |
|---|---|---|
| Owner's personal vehicle & travel | $30,000 | Personal expense |
| One-time legal settlement | $40,000 | One-time event |
| Marketing experiment | $75,000 | Growth investment |
| Owner's son on payroll | $55,000 | Other |
| Deferred equipment maintenance | $50,000 | Other |

**Concentration & recurring:** top customer 24% · top 5 customers 51% · claimed contracts 1,100 · verified contracts 640 · largest YoY change +34%

**Additional non-recurring adjustment:** one-off new-construction job margin $117,000 (excluded from run-rate)

**Buyer profile:** liquid cash $300,000 · PG comfort: "Need to discuss with spouse"

**Expected outputs (the test suite must assert these):**
- Claimed SDE **$752,000** · Normalized SDE **$455,000** · Delta **−$297,000**
- Screener: **RED** (2 red, 2 amber)
- DSCR-max price ≈ **$1,475,000** · Multiple-max price **$1,365,000** · **Pencil Price $1,365,000** (multiple binds)
- Gap to ask **$585,000** (30%)
- Minimum buyer cash **$72,500** · lender-typical injection **$290,000** · residual **$10,000**
- Gut Check: **KILL** — *unless recurring revenue verifies above 935 contracts and the concentration contract converts to a term agreement*

---

## 10. Pricing displayed in the prototype

Use the numbers from our real interviews, not generic SaaS pricing. Interview WTP signals: **$10k–$15k** for an independent gut check; **$40k–$50k (~1–2% of deal)** for verification of truth plus lender-ready packaging; a five-figure check "to hand off the messy middle."

| Tier | Price | What it is |
|---|---|---|
| **Deal Triage** | $500 per deal | 48-hour kill check with a lender's point of view |
| **Lender-Ready Pack** | $10,000 / $25,000 (A/B) | Normalized financials, red flags, SBA structure memo, draft LOI language |
| **Closing Navigator** | $2,500 / month | Weekly checklist, stakeholder sequencing, document and contingency tracking |

**Fee-structure guardrail to state in the footer:** the Lender-Ready Pack fee is tied to the **business acquisition**, not to the SBA loan, and is a flat fee for work performed. This matters — SBA's agent rules (Form 159 / 13 CFR Part 103) prohibit compensation contingent on loan approval and require fees to reflect services actually rendered. Keep any success-fee experiment tied to the acquisition and disclosed. Run the final structure past counsel before it is ever real.

---

## 11. Design direction

This product asks someone to trust it with the largest financial decision of their life. It should feel like a **bank memo written by someone on your side** — not a fintech toy.

- **Palette:** deep navy `#1F3864` primary; white and `#F7F8FA` surfaces; verdicts use restrained semantic colors — green `#2E7D46`, amber `#B4690E`, red `#C0392B`. No gradients, no neon, no glassmorphism.
- **Typography:** one clean sans (Inter). Financial figures in **tabular numerals**, right-aligned, always with thousands separators and a `$`.
- **Density:** tables over cards for anything numeric. Generous whitespace around the hero numbers.
- **Never show a verdict without the rule and the number that produced it.** Every red flag and every disallowed add-back gets a "why."
- Persistent footer disclaimer: *Decision support only. Not legal, accounting, or lending advice. All documents require attorney review. Not affiliated with the SBA.*

---

## 12. Build order — task prompts for Claude Code

One task per phase. Review the PR and its Vercel preview, merge, then start the next task. Do not run these in parallel — the phases depend on each other, and parallel tasks consume rate limits proportionately.

---

**Task 1 — Scaffold**
> Scaffold a Vite + React + TypeScript app at the repo root. Add Tailwind, shadcn/ui, Recharts, @supabase/supabase-js, and Vitest. Configure the design tokens from CLAUDE.md. Add a .gitignore that excludes .env. Create empty route stubs for all routes in PRD §5, plus the app shell with top navigation and the persistent footer disclaimer. Do not build any features yet.

**Task 2 — Calculation engine, test-first**
> Read docs/PRD.md sections 8 and 9. Write src/lib/calc.ts as pure TypeScript functions and src/lib/demoDeal.ts with the Keystone Air & Heat seed data. Write src/lib/calc.test.ts FIRST, asserting the demo deal produces claimedSDE 752000, normalizedSDE 455000, multipleMaxPrice 1365000, pencilPrice 1365000, and gutCheckVerdict "KILL". Then implement until the tests pass. Run npx vitest run and paste the output into the PR description. No UI in this PR.

**Task 3 — Database**
> Read docs/PRD.md section 7. Write the SQL migration for those tables with row-level security so users only see their own rows, and make demo deals readable by everyone including guests. Put it in supabase/migrations/. Wire src/lib/supabase.ts reading from import.meta.env, and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.example only. Never commit real keys.

**Task 4 — Screener intake**
> Implement docs/PRD.md section 6.3 at /deals/new. Four cards, repeating add-back rows with an "Add another" button, and a prominent "Load demo deal" button that fills every field from src/lib/demoDeal.ts. On submit, save the deal, run the calc engine, save results, and navigate to /deals/:id?tab=screen.

**Task 5 — Deal Room shell and screener result**
> Implement the tabbed Deal Room at /deals/:id and the Screen tab per docs/PRD.md section 6.4. Eight-tile heat map, each tile showing the rule that fired and the number that triggered it, with a verdict banner above and a continue button below.

**Task 6 — Normalizer**
> Implement docs/PRD.md section 6.5. Claimed vs bank-normalized SDE as two large side-by-side figures with the delta in red; the add-back ledger table with an Allowed/Disallowed verdict and a "why" on every row, each expandable; and the severity-ordered red-flag list below.

**Task 7 — Pencil Check (the hero — give it its own task)**
> Implement docs/PRD.md section 6.6 in full. The headline showing asking price, pencil price, and gap; the two constraint cards stating which one binds; the Sources & Uses table; the cash-reality block with the equity-injection math and residual-liquidity warning; a Recharts line chart of DSCR versus purchase price with a threshold line at 1.25 and a marker at the asking price; and six sliders that recalculate everything live via calc.ts.

**Task 8 — Gut Check and paywall**
> Implement docs/PRD.md sections 6.7 and 6.8. On the Package tab, show a blurred preview with the contents list, then randomly show one of two price variants ($10,000 or $25,000) and log which was shown. Below the buy button add three options: "I'd pay this", "I'd pay, but less" (prompts for a number), and "I wouldn't pay for this" (prompts for free text). Record every response in the events table. No payment integration — route to /thanks.

**Task 9 — Landing, pricing, onboarding, starter**
> Implement docs/PRD.md sections 6.1, 6.2, 6.9, and 10. Route users who select "Just exploring" to /starter.

**Task 10 — Instrumentation**
> Add a lightweight analytics helper writing to the events table: page views, all CTA clicks with their label, time spent on the Pencil Check tab, slider interactions, price variant shown, and paywall response. Build /admin, accessible only to a hard-coded admin email, showing counts per event and a table of free-text responses.

---

## 13. Guardrails — reject these if the agent proposes them

- **Fake AI narration.** No chatbot, no "AI is analyzing…" theater. The logic is rule-based; presenting it as a black box destroys the trust the product depends on.
- **Real document upload/parsing.** Out of scope. A file input that does nothing is worse than no file input.
- **Payments.** Never. Intent capture only.
- **Franchise features.** Our negative persona. Refuse.
- **Marketplace/listing aggregation.** Not the wedge; our interviews put the pain downstream of sourcing.
- **Scope creep** into the LOI Wizard and Closing Checklist before the Pencil Check is finished and demo-ready.

---

## 14. Demo script (5 minutes, for the assignment presentation)

1. **Land on the homepage.** Read the before/after strip aloud — $752k claimed vs $455k normalized. *(15 sec)*
2. **Click "See it on a real deal."** Open Keystone Air & Heat. *(10 sec)*
3. **Screener tab.** Two red tiles. "Forty-two percent of the recurring contracts don't exist on paper." *(45 sec)*
4. **Normalize tab.** Walk the add-back ledger. Land on the son-on-payroll row: "He's the dispatcher. The buyer has to replace him. That's not an add-back." *(90 sec)*
5. **Pencil Check.** The reveal: asking $1.95M, pencils at $1.365M, gap $585,000. Then drag the interest-rate slider up and watch the pencil price fall. *(90 sec)*
6. **Cash reality block.** "After a typical injection, this buyer has $10,000 left. That's the conversation he needs to have with his spouse before he signs a personal guarantee." *(30 sec)*
7. **Gut Check → Package → paywall.** "And this is our test: at this exact moment, we ask what it's worth." *(30 sec)*

Close on the framing that separates you from every incumbent: **we get paid whether or not you buy — your broker doesn't.**

---

## 15. Definition of done

- [ ] Demo deal loads in one click from anywhere and reproduces every number in §9
- [ ] `npx vitest run` passes
- [ ] All five Deal Room tabs render with real computed values, no placeholders
- [ ] Pencil Check sliders recalculate live without a page reload
- [ ] Every verdict displays the rule and the number behind it
- [ ] Paywall logs price variant, choice, and free text to `events`
- [ ] A new user can complete the screener from a blank form in under 10 minutes
- [ ] Disclaimer visible on every page
- [ ] `/admin` shows event counts for the assignment write-up

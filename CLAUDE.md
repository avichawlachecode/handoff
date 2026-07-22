# Handoff — MVP Prototype

Spec: `docs/PRD.md`. Read it before implementing anything. It is authoritative.

Handoff is a decision-support tool for first-time buyers of small businesses using
SBA 7(a) financing. It turns a seller's messy numbers into a bank-normalized view
and tells the buyer what the deal actually pencils at before they sign a personal
guarantee. This repo is a class prototype and a customer-discovery instrument —
not a production product.

## Stack

Vite + React + TypeScript + Tailwind + shadcn/ui. Recharts for charts.
Supabase for persistence and auth. Vitest for tests.

## Non-negotiable rules

- All financial logic lives in `src/lib/calc.ts` as pure, testable functions.
  No calculations inside components. Ever.
- No AI, no LLM calls, no external APIs. All logic is deterministic and rule-based.
- Never show a verdict without displaying the rule and the number that produced it.
- No payment integration. The buy button records intent only.
- No franchise features (FDD, Item 19, franchisor flows) — this is our negative persona.
- No file upload or document parsing — out of scope.
- No listing/marketplace aggregation — not the wedge.
- Every page shows the footer disclaimer: "Decision support only. Not legal,
  accounting, or lending advice. All documents require attorney review. Not
  affiliated with the SBA."

## Design

Navy `#1F3864` primary. White and `#F7F8FA` surfaces. Inter font.
Verdict colors: green `#2E7D46`, amber `#B4690E`, red `#C0392B`.
Tabular numerals for all money. Money always renders with `$` and thousands
separators. Tables over cards for numeric content. No gradients, no glassmorphism.
This product asks someone to trust it with the largest financial decision of their
life — it should read like a bank memo written by someone on their side.

## Working style

- Use plan mode for anything touching more than two files. Show the plan first.
- One PRD phase per task. Do not scope-creep into later phases — ask first.
- Write the test before the implementation for anything in `calc.ts`.
- Prefer editing existing files over creating new ones.

## Environment

Node 20+. Install with `npm install`.
Run tests with `npx vitest run`. Dev server: `npm run dev`.
Always run the test suite before opening a PR and include the output in the PR description.

## Pull requests

One PRD phase per PR. Title the PR with the phase name.
Never commit `.env` or real Supabase keys.

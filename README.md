# Handoff

Decision-support tool for first-time buyers of small businesses using SBA 7(a)
financing. Class prototype and customer-discovery instrument — see `PRD.md` (the
authoritative spec) and `CLAUDE.md` (working rules).

## Stack

Vite + React + TypeScript + Tailwind + shadcn/ui, Recharts for charts, Supabase
for persistence and auth, Vitest for tests.

## Getting started

Requires Node 20+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm run test     # run the Vitest suite
npm run build    # typecheck + production build
```

## Status

Task 1 (Scaffold) — tooling, design tokens, app shell (top nav + persistent
footer disclaimer), and empty route stubs for every PRD §5 route. No features
are built yet; each subsequent PRD §12 phase adds one.

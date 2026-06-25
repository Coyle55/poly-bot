# Polymarket Dashboard — Design Spec
**Date:** 2026-06-25
**Status:** Approved

## Overview

A Next.js dashboard app ("PolyBot") that fetches Polymarket's top 50 highest earners from their leaderboard and displays all of their open positions. Intended for both personal use and public deployment (Vercel). The app gives users a signal on where smart money is positioned across prediction markets.

---

## Architecture

**Stack:** Next.js (latest stable, targeting v16 if available), TypeScript, Tailwind CSS. No UI component library — raw Tailwind keeps the bundle lean.

**Pattern:** API routes as a server-side proxy to Polymarket APIs. The browser never calls Polymarket directly — it calls our own `/api` route handlers, which fan out to Polymarket server-side. This avoids CORS issues and centralizes all data transformation.

**Data fetching:** On-demand. Data loads when the user visits the page and can be manually refreshed. No polling or background caching in this version.

---

## API Routes

### `GET /api/leaderboard`
- Calls Polymarket's data API to fetch the top 50 traders by total profit
- Returns: `{ traders: [{ rank, username, address, totalProfit }] }`
- Note: Polymarket does not publish an official public API. Exact endpoint URLs will be reverse-engineered from network calls on polymarket.com/leaderboard during implementation.

### `GET /api/positions/all`
- Accepts: `?addresses=0x1,0x2,...` (comma-separated list of 50 wallet addresses)
- Fans out with `Promise.all` — 50 parallel position fetches to Polymarket's API
- Returns two shapes in one response:
  - `byTrader`: map of address → array of open positions
  - `byMarket`: array of unique markets with a list of which traders hold them
- Individual trader failures are caught and returned as `{ address, error: true }` — they do not abort the entire response

### Position shape (basics)
```ts
{
  marketId: string
  marketName: string
  side: "YES" | "NO"
  price: number        // current market price, 0–1 (e.g. 0.62 = 62¢)
  size: number         // trader's position size in USD
}
```

---

## Frontend

### Layout

Single page at `/`. Dark theme.

```
┌─────────────────────────────────────────────┐
│  PolyBot                [Refresh]  Last updated X min ago │
├─────────────────────────────────────────────┤
│  [Traders]  [Positions]                      │
├─────────────────────────────────────────────┤
│  (active view renders here)                  │
└─────────────────────────────────────────────┘
```

### Traders View (default tab)
- Sortable table: Rank | Name/Address | Total Profit | # Open Positions
- Each row is expandable — clicking a row reveals an inline sub-table of that trader's open positions (market name, side, price, size)
- Sorted by rank (total profit) descending by default

### Positions View
- Flat table: Market | Side | Price | # Traders Holding
- Sorted by "# Traders Holding" descending — consensus bets surface at the top
- Each row represents a unique market+side combination
- Shows how many of the top 50 hold that position

---

## Loading & Error States

### Loading
- On page load, both API calls trigger immediately (leaderboard first, then positions)
- Skeleton rows shown in both tables while fetching
- Header shows "Loading..." until data resolves
- Positions fetch (50 parallel calls) is expected to be slower — a subtle progress indicator is shown

### Errors
- If `/api/leaderboard` fails: full-page error banner with retry button
- If individual trader position fetches fail: that trader's row shows "Positions unavailable" on expand; other traders render normally
- All errors logged server-side for debugging

### Empty States
- Trader with no open positions: "No open positions" shown on row expand
- Zero results from leaderboard: "No leaderboard data available" with retry

---

## Deployment

- Deploy to Vercel via standard Next.js deployment (no special config needed)
- No environment variables required for v1 (all Polymarket endpoints are public)
- No database, no auth, no user accounts in this version

---

## Out of Scope (v1)

- Caching / TTL / background refresh
- User accounts or saved watchlists
- Historical position tracking
- Mobile-optimized layout (responsive but not mobile-first)
- Enriched position data (entry price, P&L, close date)
- Notifications or alerts

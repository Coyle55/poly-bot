# Polymarket Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js dashboard that fetches Polymarket's top 50 earners and displays all of their open positions in two views: trader-centric (expandable rows) and position-centric (consensus table).

**Architecture:** Next.js API route handlers proxy all Polymarket API calls server-side. The single-page frontend fetches on-demand via `/api/leaderboard` and `/api/positions/all`, then combines results client-side and renders a dark-themed tabbed dashboard.

**Tech Stack:** Next.js (latest stable), TypeScript, Tailwind CSS, Jest, React Testing Library, `@testing-library/jest-dom`

---

## File Map

```
poly-bot/
├── app/
│   ├── layout.tsx                    # Root layout, dark background, metadata
│   ├── page.tsx                      # Renders <Dashboard /> — no data fetching here
│   ├── globals.css                   # Tailwind directives + dark theme base
│   └── api/
│       ├── leaderboard/
│       │   └── route.ts              # GET /api/leaderboard → proxies Polymarket leaderboard
│       └── positions/
│           └── all/
│               └── route.ts          # GET /api/positions/all?addresses=0x1,0x2,...
├── lib/
│   ├── types.ts                      # All shared TypeScript types
│   └── polymarket.ts                 # fetch() wrappers for Polymarket APIs + response mapping
├── components/
│   ├── Dashboard.tsx                 # 'use client' — tab state, refresh, data fetch orchestration
│   ├── TradersView.tsx               # Sortable trader table, delegates rows to TraderRow
│   ├── PositionsView.tsx             # Flat positions table sorted by trader count
│   ├── TraderRow.tsx                 # Single expandable trader row + inline positions sub-table
│   ├── SkeletonTable.tsx             # Animated pulse skeleton for loading state
│   └── ErrorBanner.tsx              # Error message + retry callback button
├── __tests__/
│   ├── lib/
│   │   └── polymarket.test.ts        # Unit tests for fetch wrappers and buildMarketConsensus
│   └── components/
│       ├── Dashboard.test.tsx
│       ├── TradersView.test.tsx
│       └── PositionsView.test.tsx
├── jest.config.ts
└── jest.setup.ts
```

---

### Task 1: Scaffold Next.js project and configure Jest

**Files:**
- Create: all generated Next.js files
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

- [ ] **Step 1: Scaffold the app inside the existing repo**

From `/Users/coyle/Documents/marketing/poly-bot`, run:

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

This creates the App Router structure with TypeScript and Tailwind. It will not overwrite `.git` or the `docs/` folder.

If prompted about an existing directory, confirm you want to proceed.

- [ ] **Step 2: Install test dependencies**

```bash
npm install -D jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.{ts,tsx}'],
}

export default createJestConfig(config)
```

- [ ] **Step 4: Create `jest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test scripts to `package.json`**

In the `"scripts"` object, add:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Verify Jest runs**

```bash
npm test -- --passWithNoTests
```

Expected output: exits 0, prints "Test Suites: 0 passed, 0 total"

- [ ] **Step 7: Clear generated boilerplate**

Replace `app/page.tsx` with a temporary placeholder (we'll replace it fully in Task 11):

```typescript
export default function Page() {
  return <div>Loading...</div>
}
```

Delete any placeholder SVGs in `public/` if present.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Jest and RTL"
```

---

### Task 2: Define shared TypeScript types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```typescript
export interface Trader {
  rank: number
  address: string
  name: string | null
  totalProfit: number
}

export interface Position {
  marketId: string
  marketName: string
  side: 'YES' | 'NO'
  price: number  // 0–1, e.g. 0.62 = 62¢
  size: number   // USD value of position
}

export interface TraderWithPositions extends Trader {
  positions: Position[]
  positionsError: boolean
}

export interface MarketConsensus {
  marketId: string
  marketName: string
  side: 'YES' | 'NO'
  price: number
  traderCount: number
  traders: Array<{ address: string; name: string | null; size: number }>
}

// Raw Polymarket API shapes — verified against actual API in Task 3 Step 1
export interface RawPolyTrader {
  proxyWallet: string
  name: string | null
  pseudonym: string | null
  profitAndLoss: number
}

export interface RawPolyPosition {
  conditionId: string
  market: string
  outcome: string       // "Yes" or "No" (Polymarket uses title case)
  outcomeIndex: number
  size: number
  currentPrice: number
}

export interface LeaderboardApiResponse {
  traders: Trader[]
}

export interface PositionsAllApiResponse {
  positions: Record<string, Position[] | { error: true }>
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: Discover Polymarket endpoints and build API client

**Files:**
- Create: `lib/polymarket.ts`
- Create: `__tests__/lib/polymarket.test.ts`

- [ ] **Step 1: Discover actual Polymarket API endpoints and response shapes**

Run these curl commands to inspect the live API:

```bash
# Leaderboard
curl -s "https://data-api.polymarket.com/leaderboard?window=all&limit=3&offset=0" | python3 -m json.tool | head -60

# Positions for a known active wallet (top leaderboard address from above)
# Replace 0xTOP_ADDRESS with the proxyWallet from the first leaderboard result
curl -s "https://data-api.polymarket.com/positions?user=0xTOP_ADDRESS&sizeThreshold=0" | python3 -m json.tool | head -60
```

Compare the actual field names to `RawPolyTrader` and `RawPolyPosition` in `lib/types.ts`. Common discrepancies:
- Leaderboard field might be `pnl` instead of `profitAndLoss`
- Wallet field might be `address` instead of `proxyWallet`
- Position outcome might use different casing or field names

Update `RawPolyTrader` and `RawPolyPosition` in `lib/types.ts` to match the actual response before proceeding.

- [ ] **Step 2: Write failing tests**

Create `__tests__/lib/polymarket.test.ts`:

```typescript
import { fetchLeaderboard, fetchTraderPositions, buildMarketConsensus } from '@/lib/polymarket'

const mockRawLeaderboard = [
  { proxyWallet: '0xabc', name: 'bigtrader', pseudonym: null, profitAndLoss: 100000 },
  { proxyWallet: '0xdef', name: null, pseudonym: 'anon1', profitAndLoss: 80000 },
]

const mockRawPositions = [
  { conditionId: 'mkt1', market: 'Will X happen?', outcome: 'Yes', outcomeIndex: 0, size: 5000, currentPrice: 0.62 },
  { conditionId: 'mkt2', market: 'Will Y happen?', outcome: 'No', outcomeIndex: 1, size: 2000, currentPrice: 0.35 },
]

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('fetchLeaderboard', () => {
  it('returns mapped traders with rank and totalProfit', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRawLeaderboard,
    })

    const traders = await fetchLeaderboard(2)

    expect(traders).toHaveLength(2)
    expect(traders[0]).toEqual({
      rank: 1,
      address: '0xabc',
      name: 'bigtrader',
      totalProfit: 100000,
    })
    expect(traders[1]).toMatchObject({ rank: 2, address: '0xdef', name: 'anon1' })
  })

  it('throws when Polymarket returns non-ok status', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 503 })
    await expect(fetchLeaderboard()).rejects.toThrow('Leaderboard fetch failed: 503')
  })
})

describe('fetchTraderPositions', () => {
  it('maps raw positions to Position shape', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRawPositions,
    })

    const positions = await fetchTraderPositions('0xabc')

    expect(positions).toHaveLength(2)
    expect(positions[0]).toEqual({
      marketId: 'mkt1',
      marketName: 'Will X happen?',
      side: 'YES',
      price: 0.62,
      size: 5000,
    })
    expect(positions[1].side).toBe('NO')
  })

  it('throws when fetch fails', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(fetchTraderPositions('0xabc')).rejects.toThrow('Positions fetch failed for 0xabc: 404')
  })
})

describe('buildMarketConsensus', () => {
  it('groups positions by market+side and sorts by traderCount descending', () => {
    const traders = [
      {
        rank: 1, address: '0xabc', name: 'alice', totalProfit: 100000, positionsError: false,
        positions: [
          { marketId: 'mkt1', marketName: 'Will X?', side: 'YES' as const, price: 0.62, size: 5000 },
        ],
      },
      {
        rank: 2, address: '0xdef', name: 'bob', totalProfit: 80000, positionsError: false,
        positions: [
          { marketId: 'mkt1', marketName: 'Will X?', side: 'YES' as const, price: 0.62, size: 3000 },
          { marketId: 'mkt2', marketName: 'Will Y?', side: 'NO' as const, price: 0.35, size: 2000 },
        ],
      },
    ]

    const consensus = buildMarketConsensus(traders)

    expect(consensus).toHaveLength(2)
    const mkt1 = consensus.find(m => m.marketId === 'mkt1')!
    expect(mkt1.traderCount).toBe(2)
    expect(mkt1.traders).toHaveLength(2)
    expect(consensus[0].traderCount).toBeGreaterThanOrEqual(consensus[1].traderCount)
  })

  it('skips traders with positionsError', () => {
    const traders = [
      {
        rank: 1, address: '0xabc', name: 'alice', totalProfit: 100000, positionsError: true,
        positions: [],
      },
    ]
    expect(buildMarketConsensus(traders)).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Run tests — confirm they fail**

```bash
npm test -- __tests__/lib/polymarket.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/polymarket'"

- [ ] **Step 4: Create `lib/polymarket.ts`**

```typescript
import type { Trader, Position, TraderWithPositions, MarketConsensus, RawPolyTrader, RawPolyPosition } from '@/lib/types'

const DATA_API = 'https://data-api.polymarket.com'

export async function fetchLeaderboard(limit = 50): Promise<Trader[]> {
  const res = await fetch(`${DATA_API}/leaderboard?window=all&limit=${limit}&offset=0`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`)
  const raw: RawPolyTrader[] = await res.json()
  return raw.map((entry, i) => ({
    rank: i + 1,
    address: entry.proxyWallet,
    name: entry.name ?? entry.pseudonym ?? null,
    totalProfit: entry.profitAndLoss,
  }))
}

export async function fetchTraderPositions(address: string): Promise<Position[]> {
  const res = await fetch(`${DATA_API}/positions?user=${address}&sizeThreshold=0`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Positions fetch failed for ${address}: ${res.status}`)
  const raw: RawPolyPosition[] = await res.json()
  return raw.map(p => ({
    marketId: p.conditionId,
    marketName: p.market,
    side: p.outcome.toLowerCase() === 'yes' ? 'YES' : 'NO',
    price: p.currentPrice,
    size: p.size,
  }))
}

export function buildMarketConsensus(traders: TraderWithPositions[]): MarketConsensus[] {
  const map = new Map<string, MarketConsensus>()

  for (const trader of traders) {
    if (trader.positionsError) continue
    for (const pos of trader.positions) {
      const key = `${pos.marketId}:${pos.side}`
      if (!map.has(key)) {
        map.set(key, {
          marketId: pos.marketId,
          marketName: pos.marketName,
          side: pos.side,
          price: pos.price,
          traderCount: 0,
          traders: [],
        })
      }
      const entry = map.get(key)!
      entry.traderCount++
      entry.traders.push({ address: trader.address, name: trader.name, size: pos.size })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.traderCount - a.traderCount)
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
npm test -- __tests__/lib/polymarket.test.ts
```

Expected: PASS — all 5 tests green

- [ ] **Step 6: Commit**

```bash
git add lib/polymarket.ts __tests__/lib/polymarket.test.ts lib/types.ts
git commit -m "feat: add Polymarket API client with tests"
```

---

### Task 4: Build `/api/leaderboard` route

**Files:**
- Create: `app/api/leaderboard/route.ts`

- [ ] **Step 1: Create `app/api/leaderboard/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { fetchLeaderboard } from '@/lib/polymarket'

export async function GET() {
  try {
    const traders = await fetchLeaderboard(50)
    return NextResponse.json({ traders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
```

- [ ] **Step 2: Smoke test the route**

```bash
npm run dev &
sleep 4
curl -s http://localhost:3000/api/leaderboard | python3 -m json.tool | head -30
kill %1
```

Expected: JSON with `{ "traders": [ { "rank": 1, "address": "0x...", "name": "...", "totalProfit": ... }, ... ] }`

If field names in the response are wrong (e.g., `address` is `null` or `totalProfit` is `0`), the raw type mapping in `lib/polymarket.ts` needs to be corrected to match the actual API response discovered in Task 3 Step 1.

- [ ] **Step 3: Commit**

```bash
git add app/api/leaderboard/route.ts
git commit -m "feat: add /api/leaderboard route"
```

---

### Task 5: Build `/api/positions/all` route

**Files:**
- Create: `app/api/positions/all/route.ts`

- [ ] **Step 1: Create `app/api/positions/all/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchTraderPositions } from '@/lib/polymarket'
import type { Position } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('addresses')

  if (!raw) {
    return NextResponse.json({ error: 'addresses param required' }, { status: 400 })
  }

  const addresses = raw.split(',').filter(Boolean)

  const results = await Promise.allSettled(
    addresses.map(address => fetchTraderPositions(address))
  )

  const positions: Record<string, Position[] | { error: true }> = {}
  addresses.forEach((address, i) => {
    const result = results[i]
    positions[address] = result.status === 'fulfilled'
      ? result.value
      : { error: true }
  })

  return NextResponse.json({ positions })
}
```

- [ ] **Step 2: Smoke test the route**

First get a real address from the leaderboard:

```bash
npm run dev &
sleep 4
# Get top trader address
TOP_ADDR=$(curl -s http://localhost:3000/api/leaderboard | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['traders'][0]['address'])")
echo "Top trader: $TOP_ADDR"
# Fetch their positions
curl -s "http://localhost:3000/api/positions/all?addresses=$TOP_ADDR" | python3 -m json.tool | head -40
kill %1
```

Expected: JSON with `{ "positions": { "0x...": [ { "marketId": "...", "marketName": "...", "side": "YES"|"NO", "price": ..., "size": ... } ] } }`

- [ ] **Step 3: Commit**

```bash
git add app/api/positions/all/route.ts
git commit -m "feat: add /api/positions/all route with parallel fetching"
```

---

### Task 6: Build `ErrorBanner` and `SkeletonTable` components

**Files:**
- Create: `components/ErrorBanner.tsx`
- Create: `components/SkeletonTable.tsx`

- [ ] **Step 1: Create `components/ErrorBanner.tsx`**

```typescript
interface ErrorBannerProps {
  message: string
  onRetry: () => void
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-red-300">
      <span className="text-sm">{message}</span>
      <button
        onClick={onRetry}
        className="ml-4 rounded bg-red-800 px-3 py-1 text-xs text-red-100 hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/SkeletonTable.tsx`**

```typescript
interface SkeletonTableProps {
  rows?: number
  cols?: number
}

export default function SkeletonTable({ rows = 10, cols = 4 }: SkeletonTableProps) {
  return (
    <div className="w-full space-y-2" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-8 flex-1 animate-pulse rounded bg-gray-800"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ErrorBanner.tsx components/SkeletonTable.tsx
git commit -m "feat: add ErrorBanner and SkeletonTable components"
```

---

### Task 7: Build `TraderRow` component

**Files:**
- Create: `components/TraderRow.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/TraderRow.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import TraderRow from '@/components/TraderRow'
import type { TraderWithPositions } from '@/lib/types'

const trader: TraderWithPositions = {
  rank: 1,
  address: '0xabc123def456',
  name: 'bigtrader',
  totalProfit: 142300,
  positionsError: false,
  positions: [
    { marketId: 'mkt1', marketName: 'Will X happen?', side: 'YES', price: 0.62, size: 5000 },
    { marketId: 'mkt2', marketName: 'Will Y happen?', side: 'NO', price: 0.35, size: 2000 },
  ],
}

it('shows rank, name, profit, and position count', () => {
  render(<table><tbody><TraderRow trader={trader} /></tbody></table>)
  expect(screen.getByText('1')).toBeInTheDocument()
  expect(screen.getByText('bigtrader')).toBeInTheDocument()
  expect(screen.getByText(/142,300/)).toBeInTheDocument()
  expect(screen.getByText('2')).toBeInTheDocument()
})

it('expands to show positions on click', () => {
  render(<table><tbody><TraderRow trader={trader} /></tbody></table>)
  expect(screen.queryByText('Will X happen?')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('row'))
  expect(screen.getByText('Will X happen?')).toBeInTheDocument()
  expect(screen.getByText('YES')).toBeInTheDocument()
  expect(screen.getByText('62%')).toBeInTheDocument()
})

it('shows error state when positionsError is true', () => {
  const errTrader = { ...trader, positionsError: true, positions: [] }
  render(<table><tbody><TraderRow trader={errTrader} /></tbody></table>)
  fireEvent.click(screen.getByRole('row'))
  expect(screen.getByText(/positions unavailable/i)).toBeInTheDocument()
})

it('shows empty message when trader has no positions', () => {
  const emptyTrader = { ...trader, positions: [] }
  render(<table><tbody><TraderRow trader={emptyTrader} /></tbody></table>)
  fireEvent.click(screen.getByRole('row'))
  expect(screen.getByText(/no open positions/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test -- __tests__/components/TraderRow.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/TraderRow'"

- [ ] **Step 3: Create `components/TraderRow.tsx`**

```typescript
'use client'

import { useState } from 'react'
import type { TraderWithPositions } from '@/lib/types'

interface TraderRowProps {
  trader: TraderWithPositions
}

export default function TraderRow({ trader }: TraderRowProps) {
  const [expanded, setExpanded] = useState(false)

  const shortAddress = `${trader.address.slice(0, 6)}…${trader.address.slice(-4)}`
  const displayName = trader.name ?? shortAddress

  return (
    <>
      <tr
        role="row"
        onClick={() => setExpanded(e => !e)}
        className="cursor-pointer border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
      >
        <td className="px-4 py-3 text-gray-400 text-sm">{trader.rank}</td>
        <td className="px-4 py-3 text-white text-sm font-medium">{displayName}</td>
        <td className="px-4 py-3 text-green-400 text-sm">
          ${trader.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </td>
        <td className="px-4 py-3 text-gray-300 text-sm">
          {trader.positionsError ? '—' : trader.positions.length}
          <span className="ml-2 text-gray-600">{expanded ? '▲' : '▼'}</span>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-900">
          <td colSpan={4} className="px-6 py-3">
            {trader.positionsError ? (
              <p className="text-sm text-red-400">Positions unavailable</p>
            ) : trader.positions.length === 0 ? (
              <p className="text-sm text-gray-500">No open positions</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase">
                    <th className="py-1 text-left font-normal">Market</th>
                    <th className="py-1 text-left font-normal">Side</th>
                    <th className="py-1 text-left font-normal">Price</th>
                    <th className="py-1 text-left font-normal">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {trader.positions.map(pos => (
                    <tr key={`${pos.marketId}:${pos.side}`} className="border-t border-gray-800">
                      <td className="py-1.5 text-gray-200 pr-4">{pos.marketName}</td>
                      <td className={`py-1.5 font-medium ${pos.side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.side}
                      </td>
                      <td className="py-1.5 text-gray-300">{Math.round(pos.price * 100)}%</td>
                      <td className="py-1.5 text-gray-300">
                        ${pos.size.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- __tests__/components/TraderRow.test.tsx
```

Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add components/TraderRow.tsx __tests__/components/TraderRow.test.tsx
git commit -m "feat: add TraderRow expandable component with tests"
```

---

### Task 8: Build `TradersView` component

**Files:**
- Create: `components/TradersView.tsx`
- Create: `__tests__/components/TradersView.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/TradersView.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import TradersView from '@/components/TradersView'
import type { TraderWithPositions } from '@/lib/types'

const traders: TraderWithPositions[] = [
  {
    rank: 1, address: '0xaaa', name: 'alice', totalProfit: 100000,
    positionsError: false,
    positions: [{ marketId: 'm1', marketName: 'Will X?', side: 'YES', price: 0.6, size: 5000 }],
  },
  {
    rank: 2, address: '0xbbb', name: 'bob', totalProfit: 80000,
    positionsError: false,
    positions: [],
  },
]

it('renders a row for each trader', () => {
  render(<TradersView traders={traders} />)
  expect(screen.getByText('alice')).toBeInTheDocument()
  expect(screen.getByText('bob')).toBeInTheDocument()
})

it('renders column headers', () => {
  render(<TradersView traders={traders} />)
  expect(screen.getByText(/rank/i)).toBeInTheDocument()
  expect(screen.getByText(/trader/i)).toBeInTheDocument()
  expect(screen.getByText(/profit/i)).toBeInTheDocument()
  expect(screen.getByText(/positions/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test -- __tests__/components/TradersView.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/TradersView'"

- [ ] **Step 3: Create `components/TradersView.tsx`**

```typescript
import type { TraderWithPositions } from '@/lib/types'
import TraderRow from '@/components/TraderRow'

interface TradersViewProps {
  traders: TraderWithPositions[]
}

export default function TradersView({ traders }: TradersViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700 text-xs uppercase text-gray-500">
            <th className="px-4 py-3 font-normal">Rank</th>
            <th className="px-4 py-3 font-normal">Trader</th>
            <th className="px-4 py-3 font-normal">Total Profit</th>
            <th className="px-4 py-3 font-normal">Positions</th>
          </tr>
        </thead>
        <tbody>
          {traders.map(trader => (
            <TraderRow key={trader.address} trader={trader} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- __tests__/components/TradersView.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/TradersView.tsx __tests__/components/TradersView.test.tsx
git commit -m "feat: add TradersView component with tests"
```

---

### Task 9: Build `PositionsView` component

**Files:**
- Create: `components/PositionsView.tsx`
- Create: `__tests__/components/PositionsView.test.tsx`

- [ ] **Step 1: Write failing test**

Create `__tests__/components/PositionsView.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import PositionsView from '@/components/PositionsView'
import type { MarketConsensus } from '@/lib/types'

const markets: MarketConsensus[] = [
  {
    marketId: 'mkt1', marketName: 'Will X happen?', side: 'YES', price: 0.62,
    traderCount: 31,
    traders: [{ address: '0xaaa', name: 'alice', size: 5000 }],
  },
  {
    marketId: 'mkt2', marketName: 'Will Y happen?', side: 'NO', price: 0.35,
    traderCount: 18,
    traders: [{ address: '0xbbb', name: null, size: 2000 }],
  },
]

it('renders a row for each market consensus entry', () => {
  render(<PositionsView markets={markets} />)
  expect(screen.getByText('Will X happen?')).toBeInTheDocument()
  expect(screen.getByText('Will Y happen?')).toBeInTheDocument()
})

it('shows the trader count for each market', () => {
  render(<PositionsView markets={markets} />)
  expect(screen.getByText('31')).toBeInTheDocument()
  expect(screen.getByText('18')).toBeInTheDocument()
})

it('shows the price as a percentage', () => {
  render(<PositionsView markets={markets} />)
  expect(screen.getByText('62%')).toBeInTheDocument()
  expect(screen.getByText('35%')).toBeInTheDocument()
})

it('colors YES green and NO red', () => {
  render(<PositionsView markets={markets} />)
  const yesEl = screen.getByText('YES')
  const noEl = screen.getByText('NO')
  expect(yesEl).toHaveClass('text-green-400')
  expect(noEl).toHaveClass('text-red-400')
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npm test -- __tests__/components/PositionsView.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/PositionsView'"

- [ ] **Step 3: Create `components/PositionsView.tsx`**

```typescript
import type { MarketConsensus } from '@/lib/types'

interface PositionsViewProps {
  markets: MarketConsensus[]
}

export default function PositionsView({ markets }: PositionsViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700 text-xs uppercase text-gray-500">
            <th className="px-4 py-3 font-normal">Market</th>
            <th className="px-4 py-3 font-normal">Side</th>
            <th className="px-4 py-3 font-normal">Price</th>
            <th className="px-4 py-3 font-normal"># Traders</th>
          </tr>
        </thead>
        <tbody>
          {markets.map(market => (
            <tr
              key={`${market.marketId}:${market.side}`}
              className="border-b border-gray-800 hover:bg-gray-800/30"
            >
              <td className="px-4 py-3 text-gray-200 text-sm max-w-md">
                {market.marketName}
              </td>
              <td className={`px-4 py-3 text-sm font-medium ${market.side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                {market.side}
              </td>
              <td className="px-4 py-3 text-gray-300 text-sm">
                {Math.round(market.price * 100)}%
              </td>
              <td className="px-4 py-3 text-gray-300 text-sm">
                {market.traderCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- __tests__/components/PositionsView.test.tsx
```

Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add components/PositionsView.tsx __tests__/components/PositionsView.test.tsx
git commit -m "feat: add PositionsView component with tests"
```

---

### Task 10: Build `Dashboard` component

**Files:**
- Create: `components/Dashboard.tsx`
- Create: `__tests__/components/Dashboard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/Dashboard.test.tsx`:

```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import Dashboard from '@/components/Dashboard'

const mockTraders = [
  { rank: 1, address: '0xaaa', name: 'alice', totalProfit: 100000 },
  { rank: 2, address: '0xbbb', name: 'bob', totalProfit: 80000 },
]

const mockPositions = {
  '0xaaa': [{ marketId: 'm1', marketName: 'Will X?', side: 'YES', price: 0.6, size: 5000 }],
  '0xbbb': [],
}

beforeEach(() => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ traders: mockTraders }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ positions: mockPositions }),
    })
})

afterEach(() => {
  jest.resetAllMocks()
})

it('shows skeleton while loading', () => {
  render(<Dashboard />)
  expect(screen.getByLabelText('Loading data')).toBeInTheDocument()
})

it('renders trader names after loading', async () => {
  render(<Dashboard />)
  await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())
  expect(screen.getByText('bob')).toBeInTheDocument()
})

it('switches to positions view on tab click', async () => {
  render(<Dashboard />)
  await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /positions/i }))
  expect(screen.getByText('Will X?')).toBeInTheDocument()
})

it('shows error banner when leaderboard fetch fails', async () => {
  jest.resetAllMocks()
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 502 })
  render(<Dashboard />)
  await waitFor(() => expect(screen.getByText(/failed to fetch leaderboard/i)).toBeInTheDocument())
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- __tests__/components/Dashboard.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/Dashboard'"

- [ ] **Step 3: Create `components/Dashboard.tsx`**

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Trader, TraderWithPositions, MarketConsensus } from '@/lib/types'
import { buildMarketConsensus } from '@/lib/polymarket'
import TradersView from '@/components/TradersView'
import PositionsView from '@/components/PositionsView'
import SkeletonTable from '@/components/SkeletonTable'
import ErrorBanner from '@/components/ErrorBanner'

type Tab = 'traders' | 'positions'

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('traders')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tradersWithPositions, setTradersWithPositions] = useState<TraderWithPositions[]>([])
  const [byMarket, setByMarket] = useState<MarketConsensus[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const lbRes = await fetch('/api/leaderboard')
      if (!lbRes.ok) throw new Error('Failed to fetch leaderboard')
      const { traders }: { traders: Trader[] } = await lbRes.json()

      const addresses = traders.map(t => t.address).join(',')
      const posRes = await fetch(`/api/positions/all?addresses=${addresses}`)
      if (!posRes.ok) throw new Error('Failed to fetch positions')
      const { positions }: { positions: Record<string, unknown> } = await posRes.json()

      const withPositions: TraderWithPositions[] = traders.map(trader => {
        const raw = positions[trader.address]
        const isError = !Array.isArray(raw)
        return {
          ...trader,
          positions: isError ? [] : (raw as TraderWithPositions['positions']),
          positionsError: isError,
        }
      })

      setTradersWithPositions(withPositions)
      setByMarket(buildMarketConsensus(withPositions))
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">PolyBot</h1>
        <div className="flex items-center gap-4">
          {formattedTime && (
            <span className="text-xs text-gray-500">Updated {formattedTime}</span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="rounded bg-gray-800 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="px-6 py-6 max-w-7xl mx-auto">
        {error ? (
          <ErrorBanner message={error} onRetry={fetchData} />
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              <button
                role="button"
                aria-label="Traders"
                onClick={() => setTab('traders')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  tab === 'traders'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Traders
              </button>
              <button
                role="button"
                aria-label="Positions"
                onClick={() => setTab('positions')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  tab === 'positions'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Positions
              </button>
            </div>

            {loading ? (
              <SkeletonTable rows={10} cols={4} />
            ) : tab === 'traders' ? (
              <TradersView traders={tradersWithPositions} />
            ) : (
              <PositionsView markets={byMarket} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- __tests__/components/Dashboard.test.tsx
```

Expected: PASS — all 4 tests green

- [ ] **Step 5: Run all tests to check for regressions**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add components/Dashboard.tsx __tests__/components/Dashboard.test.tsx
git commit -m "feat: add Dashboard component with data fetching and tab switching"
```

---

### Task 11: Wire up `layout.tsx` and `page.tsx`

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update `app/globals.css`**

Replace the file content with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  color-scheme: dark;
}
```

- [ ] **Step 2: Update `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PolyBot — Polymarket Leaderboard Tracker',
  description: 'Track open positions of Polymarket\'s top 50 traders',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950`}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Update `app/page.tsx`**

```typescript
import Dashboard from '@/components/Dashboard'

export default function Page() {
  return <Dashboard />
}
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/page.tsx app/globals.css
git commit -m "feat: wire up layout and page with Dashboard"
```

---

### Task 12: End-to-end smoke test and Vercel prep

**Files:**
- No new files

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 2: Run dev server and manually verify the dashboard**

```bash
npm run dev
```

Open http://localhost:3000 in a browser.

Verify:
- [ ] Page loads with skeleton while fetching
- [ ] Traders tab renders top 50 with ranks, names/addresses, profits, position counts
- [ ] Clicking a trader row expands to show their positions
- [ ] Switching to Positions tab shows aggregated table sorted by trader count
- [ ] Refresh button re-fetches data
- [ ] "Updated HH:MM" timestamp appears in header

If any data is missing or fields show `null`/`0`, the raw type mapping in `lib/polymarket.ts` needs updating to match the actual Polymarket API response (refer back to Task 3 Step 1).

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: exits 0 with no TypeScript or build errors

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify build and manual smoke test passing"
```

- [ ] **Step 5: Deploy to Vercel**

```bash
npx vercel
```

Follow the prompts to link to your Vercel account and deploy. No environment variables are required.

After deploy, open the production URL and verify the dashboard loads and fetches real Polymarket data.

---

## Notes for Implementers

- **Polymarket API field names** — the raw type mappings in `lib/polymarket.ts` are based on the most likely field names from the Polymarket data API. Task 3 Step 1 must be completed before writing the mapping code; incorrect field names will cause silent `null`/`undefined` values rather than errors.
- **Rate limiting** — fetching 50 traders' positions in parallel may trigger rate limiting from Polymarket. If you see 429 responses, add a concurrency limit (e.g., process addresses in batches of 10) in `app/api/positions/all/route.ts`.
- **`setupFilesAfterFramework`** — if Jest reports this as an unknown config key, check the installed Jest version's documentation for the correct option name (it may be `setupFilesAfterFramework` in some versions).

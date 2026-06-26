import type { Trader, Position, TraderWithPositions, MarketConsensus, RawPolyTrader, RawPolyPosition, TraderStats } from '@/lib/types'

const DATA_API = 'https://data-api.polymarket.com'

export async function fetchLeaderboard(limit = 50): Promise<Trader[]> {
  const res = await fetch(`${DATA_API}/v1/leaderboard?window=all&limit=${limit}&offset=0`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`)
  const raw: RawPolyTrader[] = await res.json()
  return raw.map((entry, i) => ({
    rank: i + 1,
    address: entry.proxyWallet,
    name: entry.userName ?? null,
    totalProfit: entry.pnl,
  }))
}

export interface TraderPositionResult {
  positions: Position[]
  stats: TraderStats
}

export async function fetchTraderPositions(address: string): Promise<TraderPositionResult> {
  const url = new URL(`${DATA_API}/positions`)
  url.searchParams.set('user', address)
  url.searchParams.set('sizeThreshold', '0')
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Positions fetch failed for ${address}: ${res.status}`)
  const raw: RawPolyPosition[] = await res.json()

  let wins = 0
  let losses = 0
  const positions: Position[] = []

  for (const p of raw) {
    if (p.redeemable) {
      if (p.cashPnl > 0) wins++
      else losses++
    } else if (p.curPrice > 0.01) {
      positions.push({
        marketId: p.conditionId,
        marketName: p.title,
        side: p.outcome.toLowerCase() === 'yes' ? 'YES' : 'NO',
        price: p.curPrice,
        avgPrice: p.avgPrice,
        size: p.size,
      })
    }
  }

  const total = wins + losses
  return {
    positions,
    stats: {
      winRate: total > 0 ? wins / total : null,
      wins,
      losses,
    },
  }
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
      entry.price = pos.price
      entry.traders.push({ address: trader.address, name: trader.name, size: pos.size })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.traderCount - a.traderCount)
}

import type { Trader, Position, TraderWithPositions, MarketConsensus, RawPolyTrader, RawPolyPosition } from '@/lib/types'

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

export async function fetchTraderPositions(address: string): Promise<Position[]> {
  const url = new URL(`${DATA_API}/positions`)
  url.searchParams.set('user', address)
  url.searchParams.set('sizeThreshold', '0')
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Positions fetch failed for ${address}: ${res.status}`)
  const raw: RawPolyPosition[] = await res.json()
  return raw
    .filter(p => p.curPrice > 0.01)
    .map(p => ({
      marketId: p.conditionId,
      marketName: p.title,
      side: p.outcome.toLowerCase() === 'yes' ? 'YES' : 'NO',
      price: p.curPrice,
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
      entry.price = pos.price  // use most-recently-seen price
      entry.traders.push({ address: trader.address, name: trader.name, size: pos.size })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.traderCount - a.traderCount)
}

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

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Trader, TraderWithPositions, MarketConsensus, TraderStats } from '@/lib/types'
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
      const { positions, stats }: {
        positions: Record<string, unknown>
        stats: Record<string, TraderStats>
      } = await posRes.json()

      const withPositions: TraderWithPositions[] = traders.map(trader => {
        const raw = positions[trader.address]
        const isError = !Array.isArray(raw)
        const traderStats = stats?.[trader.address] ?? { winRate: null, wins: 0, losses: 0 }
        return {
          ...trader,
          positions: isError ? [] : (raw as TraderWithPositions['positions']),
          positionsError: isError,
          winRate: traderStats.winRate,
          wins: traderStats.wins,
          losses: traderStats.losses,
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData()
  }, [fetchData])

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'linear-gradient(180deg, #0B0B18 0%, rgba(7,7,14,0.96) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px' }}>

          {/* Brand row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 0 10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(18px, 3.5vw, 24px)',
                letterSpacing: '-0.03em',
                color: 'var(--text-1)',
                margin: 0,
              }}>
                POLYBOT
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--accent-glow)',
                border: '1px solid rgba(240,165,0,0.25)',
                borderRadius: 5,
                padding: '2px 7px',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--accent)',
                fontFamily: 'Syne, sans-serif',
              }}>
                <span
                  className="animate-pulse-dot"
                  style={{
                    width: 5,
                    height: 5,
                    background: 'var(--accent)',
                    borderRadius: '50%',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                LIVE
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {formattedTime && (
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  color: 'var(--text-3)',
                  letterSpacing: '0.04em',
                }}>
                  {formattedTime}
                </span>
              )}
              <button
                aria-label="Refresh"
                onClick={fetchData}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-2)',
                  borderRadius: 7,
                  padding: '7px 13px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: loading ? 'var(--text-3)' : 'var(--text-1)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  transition: 'all 0.15s',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <svg
                  width="11" height="11" viewBox="0 0 12 12" fill="none"
                  className={loading ? 'animate-spin' : ''}
                  style={{ color: loading ? 'var(--text-3)' : 'var(--accent)', flexShrink: 0 }}
                >
                  <path
                    d="M10 6A4 4 0 1 1 6.5 2.03V.5L9.5 3 6.5 5.5V4.03A2.97 2.97 0 1 0 9 6H10Z"
                    fill="currentColor"
                  />
                </svg>
                {loading ? 'LOADING' : 'REFRESH'}
              </button>
            </div>
          </div>

          {/* Tab bar */}
          {!error && (
            <div style={{ display: 'flex', marginBottom: -1 }}>
              {(['traders', 'positions'] as Tab[]).map(t => (
                <button
                  key={t}
                  aria-label={t === 'traders' ? 'Traders' : 'Positions'}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    borderBottom: tab === t
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                    padding: '9px 16px',
                    fontSize: 10,
                    fontWeight: tab === t ? 700 : 500,
                    letterSpacing: '0.12em',
                    color: tab === t ? 'var(--accent)' : 'var(--text-2)',
                    cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif',
                    textTransform: 'uppercase',
                    transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '16px 16px 80px' }}>
        {error ? (
          <ErrorBanner message={error} onRetry={fetchData} />
        ) : loading ? (
          <SkeletonTable rows={8} cols={4} />
        ) : tab === 'traders' ? (
          <TradersView traders={tradersWithPositions} />
        ) : (
          <PositionsView markets={byMarket} />
        )}
      </main>
    </div>
  )
}

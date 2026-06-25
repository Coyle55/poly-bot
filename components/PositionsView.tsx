import type { MarketConsensus } from '@/lib/types'

interface PositionsViewProps {
  markets: MarketConsensus[]
}

export default function PositionsView({ markets }: PositionsViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {markets.map(market => {
        const pct = Math.round(market.price * 100)
        const barWidth = Math.min((market.traderCount / 50) * 100, 100)

        return (
          <div
            key={`${market.marketId}:${market.side}`}
            className="position-card animate-fade-up"
            style={{ padding: '14px 16px' }}
          >
            {/* Market name */}
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--text-1)',
              lineHeight: 1.4,
              marginBottom: 10,
            }}>
              {market.marketName}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Side badge */}
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                fontFamily: 'Syne, sans-serif',
                letterSpacing: '0.1em',
                padding: '2px 7px',
                borderRadius: 3,
                border: `1px solid ${market.side === 'YES' ? 'var(--yes-border)' : 'var(--no-border)'}`,
                background: market.side === 'YES' ? 'var(--yes-bg)' : 'var(--no-bg)',
                color: market.side === 'YES' ? 'var(--yes)' : 'var(--no)',
              }}>
                {market.side}
              </span>

              {/* Price */}
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: 'var(--text-2)',
              }}>
                {pct}%
              </span>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Trader count */}
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: 'var(--accent)',
                fontWeight: 600,
              }}>
                {market.traderCount}
              </span>
              <span style={{
                fontSize: 10,
                color: 'var(--text-3)',
                fontFamily: 'Syne, sans-serif',
              }}>
                traders
              </span>
            </div>

            {/* Progress bar */}
            <div style={{
              marginTop: 10,
              height: 2,
              background: 'var(--border)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${barWidth}%`,
                background: market.side === 'YES' ? 'var(--yes)' : 'var(--no)',
                borderRadius: 2,
                opacity: 0.6,
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

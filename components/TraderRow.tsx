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
  const profitColor = trader.totalProfit >= 0 ? 'var(--profit)' : 'var(--loss)'
  const profitSign = trader.totalProfit >= 0 ? '+' : ''

  return (
    <div
      className="trader-card animate-fade-up"
      data-testid="trader-card"
      onClick={() => setExpanded(e => !e)}
      style={{ marginBottom: 8, animationDelay: `${(trader.rank - 1) * 0.04}s`, cursor: 'pointer' }}
    >
      {/* Ghost rank watermark */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 14,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 56,
          fontWeight: 600,
          color: 'var(--border-2)',
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {String(trader.rank).padStart(2, '0')}
      </div>

      {/* Header row */}
      <div
        style={{
          position: 'relative',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Visible rank */}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          color: 'var(--text-3)',
          minWidth: 18,
          flexShrink: 0,
        }}>
          {trader.rank}
        </span>

        {/* Name + profit */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--text-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {displayName}
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: profitColor,
            marginTop: 3,
          }}>
            {profitSign}${trader.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Position count + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-2)',
            borderRadius: 4,
            padding: '2px 8px',
            color: 'var(--text-2)',
          }}>
            {trader.positionsError ? '—' : trader.positions.length}
          </span>
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{
              color: 'var(--text-3)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              flexShrink: 0,
            }}
          >
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Expanded positions */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 16px',
          background: 'rgba(7,7,14,0.4)',
        }}>
          {trader.positionsError ? (
            <p style={{ fontSize: 12, color: 'var(--loss)', margin: 0 }}>Positions unavailable</p>
          ) : trader.positions.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>No open positions</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trader.positions.map((pos, idx) => (
                <div
                  key={`${pos.marketId}:${pos.side}:${idx}`}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
                >
                  <span style={{
                    flexShrink: 0,
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: 'Syne, sans-serif',
                    letterSpacing: '0.1em',
                    padding: '2px 6px',
                    borderRadius: 3,
                    border: `1px solid ${pos.side === 'YES' ? 'var(--yes-border)' : 'var(--no-border)'}`,
                    background: pos.side === 'YES' ? 'var(--yes-bg)' : 'var(--no-bg)',
                    color: pos.side === 'YES' ? 'var(--yes)' : 'var(--no)',
                    marginTop: 1,
                  }}>
                    {pos.side}
                  </span>

                  <span style={{
                    flex: 1,
                    fontSize: 12,
                    color: 'var(--text-2)',
                    lineHeight: 1.45,
                  }}>
                    {pos.marketName}
                  </span>

                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      color: 'var(--text-1)',
                    }}>
                      {Math.round(pos.price * 100)}%
                    </div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      color: 'var(--text-3)',
                      marginTop: 1,
                    }}>
                      ${pos.size.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

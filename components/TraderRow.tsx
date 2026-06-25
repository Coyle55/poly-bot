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

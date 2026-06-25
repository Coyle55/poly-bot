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

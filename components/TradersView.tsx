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

import type { TraderWithPositions } from '@/lib/types'
import TraderRow from '@/components/TraderRow'

interface TradersViewProps {
  traders: TraderWithPositions[]
}

export default function TradersView({ traders }: TradersViewProps) {
  return (
    <div>
      {traders.map(trader => (
        <TraderRow key={trader.address} trader={trader} />
      ))}
    </div>
  )
}

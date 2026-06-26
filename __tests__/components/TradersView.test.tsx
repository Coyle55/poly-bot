import { render, screen } from '@testing-library/react'
import TradersView from '@/components/TradersView'
import type { TraderWithPositions } from '@/lib/types'

const traders: TraderWithPositions[] = [
  {
    rank: 1, address: '0xaaa', name: 'alice', totalProfit: 100000,
    positionsError: false, winRate: 0.7, wins: 7, losses: 3,
    positions: [{ marketId: 'm1', marketName: 'Will X?', side: 'YES', price: 0.6, avgPrice: 0.4, size: 5000 }],
  },
  {
    rank: 2, address: '0xbbb', name: 'bob', totalProfit: 80000,
    positionsError: false, winRate: null, wins: 0, losses: 0,
    positions: [],
  },
]

it('renders a card for each trader', () => {
  render(<TradersView traders={traders} />)
  expect(screen.getByText('alice')).toBeInTheDocument()
  expect(screen.getByText('bob')).toBeInTheDocument()
})

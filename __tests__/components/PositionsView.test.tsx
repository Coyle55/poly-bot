import { render, screen } from '@testing-library/react'
import PositionsView from '@/components/PositionsView'
import type { MarketConsensus } from '@/lib/types'

const markets: MarketConsensus[] = [
  {
    marketId: 'mkt1', marketName: 'Will X happen?', side: 'YES', price: 0.62,
    traderCount: 31,
    traders: [{ address: '0xaaa', name: 'alice', size: 5000 }],
  },
  {
    marketId: 'mkt2', marketName: 'Will Y happen?', side: 'NO', price: 0.35,
    traderCount: 18,
    traders: [{ address: '0xbbb', name: null, size: 2000 }],
  },
]

it('renders a card for each market consensus entry', () => {
  render(<PositionsView markets={markets} />)
  expect(screen.getByText('Will X happen?')).toBeInTheDocument()
  expect(screen.getByText('Will Y happen?')).toBeInTheDocument()
})

it('shows the trader count for each market', () => {
  render(<PositionsView markets={markets} />)
  expect(screen.getByText('31')).toBeInTheDocument()
  expect(screen.getByText('18')).toBeInTheDocument()
})

it('shows the price as a percentage', () => {
  render(<PositionsView markets={markets} />)
  expect(screen.getByText('62%')).toBeInTheDocument()
  expect(screen.getByText('35%')).toBeInTheDocument()
})

it('shows YES and NO side labels', () => {
  render(<PositionsView markets={markets} />)
  expect(screen.getByText('YES')).toBeInTheDocument()
  expect(screen.getByText('NO')).toBeInTheDocument()
})

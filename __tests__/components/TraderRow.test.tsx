import { render, screen, fireEvent } from '@testing-library/react'
import TraderRow from '@/components/TraderRow'
import type { TraderWithPositions } from '@/lib/types'

const trader: TraderWithPositions = {
  rank: 1,
  address: '0xabc123def456',
  name: 'bigtrader',
  totalProfit: 142300,
  positionsError: false,
  winRate: 0.68,
  wins: 17,
  losses: 8,
  positions: [
    { marketId: 'mkt1', marketName: 'Will X happen?', side: 'YES', price: 0.62, avgPrice: 0.40, size: 5000 },
    { marketId: 'mkt2', marketName: 'Will Y happen?', side: 'NO', price: 0.35, avgPrice: 0.30, size: 2000 },
  ],
}

it('shows rank, name, profit, and position count', () => {
  render(<TraderRow trader={trader} />)
  expect(screen.getByText('1')).toBeInTheDocument()
  expect(screen.getByText('bigtrader')).toBeInTheDocument()
  expect(screen.getByText(/142,300/)).toBeInTheDocument()
  expect(screen.getByText('2')).toBeInTheDocument()
})

it('expands to show positions on click', () => {
  render(<TraderRow trader={trader} />)
  expect(screen.queryByText('Will X happen?')).not.toBeInTheDocument()
  fireEvent.click(screen.getByTestId('trader-card'))
  expect(screen.getByText('Will X happen?')).toBeInTheDocument()
  expect(screen.getByText('YES')).toBeInTheDocument()
  expect(screen.getByText('40% → 62%')).toBeInTheDocument()
})

it('shows error state when positionsError is true', () => {
  const errTrader = { ...trader, positionsError: true, positions: [], winRate: null, wins: 0, losses: 0 }
  render(<TraderRow trader={errTrader} />)
  fireEvent.click(screen.getByTestId('trader-card'))
  expect(screen.getByText(/positions unavailable/i)).toBeInTheDocument()
})

it('shows empty message when trader has no positions', () => {
  const emptyTrader = { ...trader, positions: [], winRate: null, wins: 0, losses: 0 }
  render(<TraderRow trader={emptyTrader} />)
  fireEvent.click(screen.getByTestId('trader-card'))
  expect(screen.getByText(/no open positions/i)).toBeInTheDocument()
})

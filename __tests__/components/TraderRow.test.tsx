import { render, screen, fireEvent } from '@testing-library/react'
import TraderRow from '@/components/TraderRow'
import type { TraderWithPositions } from '@/lib/types'

const trader: TraderWithPositions = {
  rank: 1,
  address: '0xabc123def456',
  name: 'bigtrader',
  totalProfit: 142300,
  positionsError: false,
  positions: [
    { marketId: 'mkt1', marketName: 'Will X happen?', side: 'YES', price: 0.62, size: 5000 },
    { marketId: 'mkt2', marketName: 'Will Y happen?', side: 'NO', price: 0.35, size: 2000 },
  ],
}

it('shows rank, name, profit, and position count', () => {
  render(<table><tbody><TraderRow trader={trader} /></tbody></table>)
  expect(screen.getByText('1')).toBeInTheDocument()
  expect(screen.getByText('bigtrader')).toBeInTheDocument()
  expect(screen.getByText(/142,300/)).toBeInTheDocument()
  expect(screen.getByText('2')).toBeInTheDocument()
})

it('expands to show positions on click', () => {
  render(<table><tbody><TraderRow trader={trader} /></tbody></table>)
  expect(screen.queryByText('Will X happen?')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('row'))
  expect(screen.getByText('Will X happen?')).toBeInTheDocument()
  expect(screen.getByText('YES')).toBeInTheDocument()
  expect(screen.getByText('62%')).toBeInTheDocument()
})

it('shows error state when positionsError is true', () => {
  const errTrader = { ...trader, positionsError: true, positions: [] }
  render(<table><tbody><TraderRow trader={errTrader} /></tbody></table>)
  fireEvent.click(screen.getByRole('row'))
  expect(screen.getByText(/positions unavailable/i)).toBeInTheDocument()
})

it('shows empty message when trader has no positions', () => {
  const emptyTrader = { ...trader, positions: [] }
  render(<table><tbody><TraderRow trader={emptyTrader} /></tbody></table>)
  fireEvent.click(screen.getByRole('row'))
  expect(screen.getByText(/no open positions/i)).toBeInTheDocument()
})

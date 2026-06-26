export interface Trader {
  rank: number
  address: string
  name: string | null
  totalProfit: number
}

export interface Position {
  marketId: string
  marketName: string
  side: 'YES' | 'NO'
  price: number     // current price 0–1
  avgPrice: number  // average entry price 0–1
  size: number      // USD value of position
}

export interface TraderWithPositions extends Trader {
  positions: Position[]
  positionsError: boolean
  winRate: number | null  // null = no resolved bets yet
  wins: number
  losses: number
}

export interface MarketConsensus {
  marketId: string
  marketName: string
  side: 'YES' | 'NO'
  price: number
  traderCount: number
  traders: Array<{ address: string; name: string | null; size: number }>
}

// Raw Polymarket API shapes — field names verified against live API
export interface RawPolyTrader {
  proxyWallet: string
  userName: string | null
  rank: number
  pnl: number
}

export interface RawPolyPosition {
  conditionId: string
  title: string
  outcome: string
  outcomeIndex: number
  size: number
  curPrice: number
  avgPrice: number
  cashPnl: number
  redeemable: boolean
}

export interface LeaderboardApiResponse {
  traders: Trader[]
}

export interface TraderStats {
  winRate: number | null
  wins: number
  losses: number
}

export interface PositionsAllApiResponse {
  positions: Record<string, Position[] | { error: true }>
  stats: Record<string, TraderStats>
}

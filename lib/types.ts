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
  price: number  // 0–1, e.g. 0.62 = 62¢
  size: number   // USD value of position
}

export interface TraderWithPositions extends Trader {
  positions: Position[]
  positionsError: boolean
}

export interface MarketConsensus {
  marketId: string
  marketName: string
  side: 'YES' | 'NO'
  price: number
  traderCount: number
  traders: Array<{ address: string; name: string | null; size: number }>
}

// Raw Polymarket API shapes — field names verified in Task 3
export interface RawPolyTrader {
  proxyWallet: string
  name: string | null
  pseudonym: string | null
  profitAndLoss: number
}

export interface RawPolyPosition {
  conditionId: string
  market: string
  outcome: string
  outcomeIndex: number
  size: number
  currentPrice: number
}

export interface LeaderboardApiResponse {
  traders: Trader[]
}

export interface PositionsAllApiResponse {
  positions: Record<string, Position[] | { error: true }>
}

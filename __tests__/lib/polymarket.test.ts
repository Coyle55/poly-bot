import { fetchLeaderboard, fetchTraderPositions, buildMarketConsensus } from '@/lib/polymarket'

const mockRawLeaderboard = [
  { proxyWallet: '0xabc', userName: 'bigtrader', rank: 1, pnl: 100000 },
  { proxyWallet: '0xdef', userName: 'anon1', rank: 2, pnl: 80000 },
]

const mockRawPositions = [
  { conditionId: 'mkt1', title: 'Will X happen?', outcome: 'Yes', outcomeIndex: 0, size: 5000, curPrice: 0.62 },
  { conditionId: 'mkt2', title: 'Will Y happen?', outcome: 'No', outcomeIndex: 1, size: 2000, curPrice: 0.35 },
]

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('fetchLeaderboard', () => {
  it('returns mapped traders with rank and totalProfit', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRawLeaderboard,
    })

    const traders = await fetchLeaderboard(2)

    expect(traders).toHaveLength(2)
    expect(traders[0]).toEqual({
      rank: 1,
      address: '0xabc',
      name: 'bigtrader',
      totalProfit: 100000,
    })
    expect(traders[1]).toMatchObject({ rank: 2, address: '0xdef', name: 'anon1' })
  })

  it('throws when Polymarket returns non-ok status', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 503 })
    await expect(fetchLeaderboard()).rejects.toThrow('Leaderboard fetch failed: 503')
  })
})

describe('fetchTraderPositions', () => {
  it('maps raw positions to Position shape', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRawPositions,
    })

    const positions = await fetchTraderPositions('0xabc')

    expect(positions).toHaveLength(2)
    expect(positions[0]).toEqual({
      marketId: 'mkt1',
      marketName: 'Will X happen?',
      side: 'YES',
      price: 0.62,
      size: 5000,
    })
    expect(positions[1].side).toBe('NO')
  })

  it('throws when fetch fails', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(fetchTraderPositions('0xabc')).rejects.toThrow('Positions fetch failed for 0xabc: 404')
  })
})

describe('buildMarketConsensus', () => {
  it('groups positions by market+side and sorts by traderCount descending', () => {
    const traders = [
      {
        rank: 1, address: '0xabc', name: 'alice', totalProfit: 100000, positionsError: false,
        positions: [
          { marketId: 'mkt1', marketName: 'Will X?', side: 'YES' as const, price: 0.62, size: 5000 },
        ],
      },
      {
        rank: 2, address: '0xdef', name: 'bob', totalProfit: 80000, positionsError: false,
        positions: [
          { marketId: 'mkt1', marketName: 'Will X?', side: 'YES' as const, price: 0.62, size: 3000 },
          { marketId: 'mkt2', marketName: 'Will Y?', side: 'NO' as const, price: 0.35, size: 2000 },
        ],
      },
    ]

    const consensus = buildMarketConsensus(traders)

    expect(consensus).toHaveLength(2)
    const mkt1 = consensus.find(m => m.marketId === 'mkt1')!
    expect(mkt1.traderCount).toBe(2)
    expect(mkt1.traders).toHaveLength(2)
    expect(consensus[0].traderCount).toBeGreaterThanOrEqual(consensus[1].traderCount)
  })

  it('skips traders with positionsError', () => {
    const traders = [
      {
        rank: 1, address: '0xabc', name: 'alice', totalProfit: 100000, positionsError: true,
        positions: [],
      },
    ]
    expect(buildMarketConsensus(traders)).toHaveLength(0)
  })
})

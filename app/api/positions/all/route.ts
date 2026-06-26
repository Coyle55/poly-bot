import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchTraderPositions } from '@/lib/polymarket'
import type { Position, TraderStats } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('addresses')

  if (!raw) {
    return NextResponse.json({ error: 'addresses param required' }, { status: 400 })
  }

  const addresses = raw.split(',').filter(Boolean)

  if (addresses.length > 50) {
    return NextResponse.json({ error: 'Maximum 50 addresses allowed' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    addresses.map(address => fetchTraderPositions(address))
  )

  const positions: Record<string, Position[] | { error: true }> = {}
  const stats: Record<string, TraderStats> = {}

  addresses.forEach((address, i) => {
    const result = results[i]
    if (result.status === 'fulfilled') {
      positions[address] = result.value.positions
      stats[address] = result.value.stats
    } else {
      positions[address] = { error: true }
      stats[address] = { winRate: null, wins: 0, losses: 0 }
    }
  })

  return NextResponse.json({ positions, stats })
}

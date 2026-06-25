import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchTraderPositions } from '@/lib/polymarket'
import type { Position } from '@/lib/types'

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
  addresses.forEach((address, i) => {
    const result = results[i]
    positions[address] = result.status === 'fulfilled'
      ? result.value
      : { error: true }
  })

  return NextResponse.json({ positions })
}

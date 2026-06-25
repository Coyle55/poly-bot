import { NextResponse } from 'next/server'
import { fetchLeaderboard } from '@/lib/polymarket'

export async function GET() {
  try {
    const traders = await fetchLeaderboard(50)
    return NextResponse.json({ traders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

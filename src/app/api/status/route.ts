import { NextResponse } from 'next/server'
import { fetchCodingMinutes, fetchCommitsToday, fetchHealth, logSourceFailure } from '@/lib/status-sources'

export const dynamic = 'force-dynamic'

const CACHE_MS = 15 * 60 * 1000

interface StatusResponse {
  restingHeartRate: number | null
  steps: number | null
  sleepMinutes: number | null
  commits: number | null
  codingMinutes: number | null
  updatedAt: string
}

let cache: { data: StatusResponse; expiresAt: number } | null = null

/**
 * All four sources are queried concurrently and are each individually defensive
 * (timeouts, missing env vars, bad shapes all resolve to null rather than reject).
 * `Promise.allSettled` is a second line of defense in case one throws anyway — this
 * route must never propagate an upstream failure to the client.
 */
async function computeStatus(): Promise<StatusResponse> {
  const [healthResult, commitsResult, codingResult] = await Promise.allSettled([
    fetchHealth(),
    fetchCommitsToday(),
    fetchCodingMinutes(),
  ])

  const health =
    healthResult.status === 'fulfilled' ? healthResult.value : { restingHeartRate: null, steps: null, sleepMinutes: null }
  if (healthResult.status === 'rejected') logSourceFailure('health', healthResult.reason)

  const commits = commitsResult.status === 'fulfilled' ? commitsResult.value : null
  if (commitsResult.status === 'rejected') logSourceFailure('commits', commitsResult.reason)

  const codingMinutes = codingResult.status === 'fulfilled' ? codingResult.value : null
  if (codingResult.status === 'rejected') logSourceFailure('coding', codingResult.reason)

  return {
    restingHeartRate: health.restingHeartRate,
    steps: health.steps,
    sleepMinutes: health.sleepMinutes,
    commits,
    codingMinutes,
    updatedAt: new Date().toISOString(),
  }
}

export async function GET() {
  const now = Date.now()
  if (cache && cache.expiresAt > now) {
    return NextResponse.json(cache.data)
  }

  const data = await computeStatus()
  cache = { data, expiresAt: now + CACHE_MS }
  return NextResponse.json(data)
}

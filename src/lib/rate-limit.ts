/**
 * In-process rate limiting for /api/chat. Single instance, in-memory — a restart
 * resets both counters. That is accepted and intentional (see the design doc's
 * "Bremse" section).
 */

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const PER_IP_LIMIT = 15
const DEFAULT_DAILY_CAP = 500

export interface RateLimitRejection {
  code: string
  text: string
}

/** Rolling window: one timestamp array per IP, pruned to the last hour on each check. */
const perIpHits = new Map<string, number[]>()

/** Calendar-day counter, reset whenever the day key changes. */
let dailyCount = 0
let dailyKey = ''

function todayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

function dailyCap(): number {
  const raw = process.env.CHAT_DAILY_CAP
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_CAP
}

/** Drops IPs with no hits left in the rolling window so the map stays bounded. */
function evictExpired(now: number): void {
  for (const [ip, hits] of perIpHits) {
    const kept = hits.filter((t) => now - t < HOUR_MS)
    if (kept.length === 0) perIpHits.delete(ip)
    else perIpHits.set(ip, kept)
  }
}

/** Reads the client IP from the reverse proxy's headers. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const real = headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

/**
 * Checks and, if allowed, records one message against both limits. Returns null when
 * allowed, or the error payload to send back when rejected.
 */
export function checkRateLimit(ip: string): RateLimitRejection | null {
  const now = Date.now()

  const key = todayKey(now)
  if (key !== dailyKey) {
    dailyKey = key
    dailyCount = 0
  }
  if (dailyCount >= dailyCap()) {
    return { code: 'daily_cap', text: "That's today's budget spent. Try tomorrow." }
  }

  evictExpired(now)
  const hits = perIpHits.get(ip) ?? []
  const recent = hits.filter((t) => now - t < HOUR_MS)
  if (recent.length >= PER_IP_LIMIT) {
    perIpHits.set(ip, recent)
    return {
      code: 'rate_limit',
      text: "You've used up this hour's questions. Come back later, or read the articles.",
    }
  }

  recent.push(now)
  perIpHits.set(ip, recent)
  dailyCount += 1
  return null
}

// Exposed for tests / diagnostics only — not part of the public contract.
export const __internal = { HOUR_MS, DAY_MS }

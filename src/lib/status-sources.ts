/**
 * Fetches the raw numbers behind the terminal's status line. Every function here is
 * defensive by construction: an unset env var, a timeout, a non-200 response or an
 * unexpected JSON shape all collapse to `null` (or, for health, to a set of `null`
 * fields) instead of throwing. `src/app/api/status/route.ts` is what turns these
 * into the always-200 response.
 */

// WakaTime's summaries endpoint can run past 3s under concurrent load; the route
// already runs every source through Promise.allSettled, so a slower timeout here
// only delays the first uncached request and never blocks the others.
const SOURCE_TIMEOUT_MS = 8_000

const asObject = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
const asString = (v: unknown): string => (typeof v === 'string' ? v : '')
const asNumber = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

const berlinDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * The fitness briefing's `day` values are Europe/Berlin calendar days (see
 * `berlinDay()` in fitness-scpx/src/lib/briefing.ts), not UTC ones — between 22:00
 * and 24:00 UTC a raw `toISOString().slice(0, 10)` would ask for a day Berlin has
 * already left. Every "is this today" check in this file goes through this one
 * function so they all agree.
 */
function berlinDayOf(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return berlinDayFormatter.format(d)
}

function todayIso(): string {
  return berlinDayOf(new Date())
}

/**
 * One log line per failure, never the raw error object — logging a DOMException (an
 * AbortSignal.timeout rejection) directly dumps its whole constant table
 * (NETWORK_ERR, ABORT_ERR, …) and buries which source actually failed. Never
 * includes a response body or header, only the error's own name/message.
 */
export function logSourceFailure(source: string, e: unknown): void {
  const name = e instanceof Error ? e.name : 'Error'
  const timedOut = name === 'AbortError' || name === 'TimeoutError'
  const message = timedOut ? `timeout after ${SOURCE_TIMEOUT_MS}ms` : e instanceof Error ? e.message : String(e)
  console.error(`status-source ${source} failed: ${name}: ${message}`)
}

// ---------------------------------------------------------------- health / fitness

export interface HealthResult {
  restingHeartRate: number | null
  steps: number | null
  sleepMinutes: number | null
}

const emptyHealth: HealthResult = { restingHeartRate: null, steps: null, sleepMinutes: null }

/**
 * Reads exactly three fields from the fitness briefing endpoint and discards the
 * rest: `lastNight.restingHr`, `lastNight.sleepMinutes`, and the entry of
 * `trends7d.steps` whose `day` is today.
 */
export async function fetchHealth(): Promise<HealthResult> {
  const url = process.env.FITNESS_BRIEFING_URL
  const token = process.env.FITNESS_AGENT_TOKEN
  if (!url || !token) return emptyHealth

  try {
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.error('status: fitness briefing responded', res.status)
      return emptyHealth
    }
    const data = asObject(await res.json())
    const lastNight = asObject(data.lastNight)
    const restingHeartRate = asNumber(lastNight.restingHr)
    const sleepMinutes = asNumber(lastNight.sleepMinutes)

    const trends7d = asObject(data.trends7d)
    const stepsEntries = Array.isArray(trends7d.steps) ? trends7d.steps : []
    const today = todayIso()
    let steps: number | null = null
    for (const raw of stepsEntries) {
      const entry = asObject(raw)
      if (asString(entry.day) === today) {
        steps = asNumber(entry.value)
        break
      }
    }

    return { restingHeartRate, steps, sleepMinutes }
  } catch (e) {
    logSourceFailure('health', e)
    return emptyHealth
  }
}

// ---------------------------------------------------------------- commits

/**
 * Read GitHub's actual contribution calendar, including the user's visible
 * private contribution totals. PushEvent payloads no longer contain commit counts.
 * Keep the legacy API field name `commits`, but count contributions as labelled.
 */
export async function fetchCommitsToday(now: Date = new Date()): Promise<number | null> {
  const token = process.env.GITHUB_TOKEN
  const user = process.env.GITHUB_USER
  if (!token || !user) return null

  const today = berlinDayOf(now)
  if (!today) return null

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: `query DailyContributions($user: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $user) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar { weeks { contributionDays { date contributionCount } } }
            }
          }
        }`,
        variables: {
          user,
          from: `${today}T00:00:00Z`,
          to: `${today}T23:59:59Z`,
        },
      }),
      // The day-specific request is shared by the homepage and status endpoint.
      cache: 'force-cache',
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.error('status: github contributions responded', res.status)
      return null
    }
    const data = asObject(await res.json())
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      console.error('status: github contribution query failed')
      return null
    }
    const userData = asObject(asObject(data.data).user)
    const calendar = asObject(asObject(userData.contributionsCollection).contributionCalendar)
    if (!Array.isArray(calendar.weeks)) return null
    for (const rawWeek of calendar.weeks) {
      const week = asObject(rawWeek)
      if (!Array.isArray(week.contributionDays)) continue
      for (const rawDay of week.contributionDays) {
        const day = asObject(rawDay)
        if (day.date !== today) continue
        const count = asNumber(day.contributionCount)
        return count !== null && Number.isSafeInteger(count) && count >= 0 ? count : null
      }
    }
    return null
  } catch (e) {
    logSourceFailure('github', e)
    return null
  }
}

// ---------------------------------------------------------------- coding time

/** WakaTime's daily summary, total coding minutes for today across all projects. */
export async function fetchCodingMinutes(): Promise<number | null> {
  const key = process.env.WAKATIME_API_KEY
  if (!key) return null

  try {
    const basic = Buffer.from(`${key}:`).toString('base64')
    const today = todayIso()
    const params = new URLSearchParams({ start: today, end: today, timezone: 'Europe/Berlin' })
    const res = await fetch(`https://wakatime.com/api/v1/users/current/summaries?${params.toString()}`, {
      headers: { authorization: `Basic ${basic}` },
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.error('status: wakatime responded', res.status)
      return null
    }
    const data = asObject(await res.json())
    const days = Array.isArray(data.data) ? data.data : []
    let totalSeconds = 0
    let sawAny = false
    for (const raw of days) {
      const day = asObject(raw)
      const grandTotal = asObject(day.grand_total)
      const seconds = asNumber(grandTotal.total_seconds)
      if (seconds !== null) {
        totalSeconds += seconds
        sawAny = true
      }
    }
    if (!sawAny) return null
    return Math.round(totalSeconds / 60)
  } catch (e) {
    logSourceFailure('wakatime', e)
    return null
  }
}

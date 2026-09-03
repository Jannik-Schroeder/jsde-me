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
 * GitHub's public events feed, newest first: sum the commit counts of today's
 * PushEvents. Good enough for a single day without pagination.
 */
async function fetchGithubCommitsToday(): Promise<number | null> {
  const token = process.env.GITHUB_TOKEN
  const user = process.env.GITHUB_USER
  if (!token || !user) return null

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/events?per_page=100`, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
      },
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.error('status: github events responded', res.status)
      return null
    }
    const data: unknown = await res.json()
    if (!Array.isArray(data)) return null

    const today = todayIso()
    let total = 0
    for (const raw of data) {
      const event = asObject(raw)
      if (asString(event.type) !== 'PushEvent') continue
      if (berlinDayOf(asString(event.created_at)) !== today) continue
      const payload = asObject(event.payload)
      if (Array.isArray(payload.commits)) total += payload.commits.length
      else if (typeof payload.size === 'number') total += payload.size
    }
    return total
  } catch (e) {
    logSourceFailure('github', e)
    return null
  }
}

/**
 * Forgejo mirrors the Gitea API: the user activity feed returns Action objects,
 * filtered here to `op_type === "commit_repo"`. Each such action carries a `content`
 * field that is itself a JSON *string* of shape `{ Commits: [...], Len: number }`;
 * `Len` is the push's commit count (falls back to `Commits.length` if absent). The
 * `date` query param should already scope the feed to today, but older Forgejo
 * versions ignore it, so `created` is re-checked defensively.
 */
async function fetchForgejoCommitsToday(): Promise<number | null> {
  const url = process.env.FORGEJO_URL
  const token = process.env.FORGEJO_TOKEN
  const user = process.env.FORGEJO_USER
  if (!url || !token || !user) return null

  try {
    const today = todayIso()
    const endpoint = `${url.replace(/\/+$/, '')}/api/v1/users/${encodeURIComponent(user)}/activities/feeds?only-performed-by=true&date=${today}&limit=50`
    const res = await fetch(endpoint, {
      headers: { authorization: `token ${token}` },
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.error('status: forgejo activities responded', res.status)
      return null
    }
    const data: unknown = await res.json()
    if (!Array.isArray(data)) return null

    let total = 0
    for (const raw of data) {
      const action = asObject(raw)
      if (asString(action.op_type) !== 'commit_repo') continue
      if (berlinDayOf(asString(action.created)) !== today) continue

      const contentRaw = action.content
      if (typeof contentRaw !== 'string') continue
      let content: Record<string, unknown>
      try {
        content = asObject(JSON.parse(contentRaw) as unknown)
      } catch {
        continue
      }

      const len = asNumber(content.Len)
      if (len !== null) {
        total += len
      } else if (Array.isArray(content.Commits)) {
        total += content.Commits.length
      }
    }
    return total
  } catch (e) {
    logSourceFailure('forgejo', e)
    return null
  }
}

/** Sum of GitHub and Forgejo commits today, counting only the sources that answered. */
export async function fetchCommitsToday(): Promise<number | null> {
  const [github, forgejo] = await Promise.allSettled([fetchGithubCommitsToday(), fetchForgejoCommitsToday()])
  const githubCount = github.status === 'fulfilled' ? github.value : null
  const forgejoCount = forgejo.status === 'fulfilled' ? forgejo.value : null
  if (githubCount === null && forgejoCount === null) return null
  return (githubCount ?? 0) + (forgejoCount ?? 0)
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

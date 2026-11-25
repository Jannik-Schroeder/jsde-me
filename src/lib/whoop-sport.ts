import 'server-only'
import { getWhoopAccessToken, hasWhoopConnection } from '@/lib/whoop-connection'

const API = 'https://api.prod.whoop.com/developer/v2'
const DAY_MS = 86_400_000
const MAX_WORKOUT_PAGES = 4
const MAX_RECENT_RUNS = 5
const CACHE_MS = 5 * 60_000
const RETRY_MS = 15_000
const TIMEOUT_MS = 4_000
const berlin = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export type WhoopRun = {
  day: string
  elapsedSeconds: number
  distanceMeters: number | null
}

export type WhoopSport =
  | { status: 'disconnected' | 'unavailable' }
  | {
      status: 'ready'
      recentRuns: WhoopRun[] | null
      last7Days: {
        runCount: number
        elapsedSeconds: number
        distanceMeters: number | null
      } | null
      today: {
        day: string
        strain: number | null
        recoveryPercent: number | null
      }
    }

type Ready = Extract<WhoopSport, { status: 'ready' }>
type RequestState = {
  token: string
  signal: AbortSignal
  cacheMs: number
  retryAt: number
  unauthorized: boolean
  failed: boolean
}

type Snapshot = {
  token: string
  day: string
  pending?: Promise<WhoopSport>
  value?: WhoopSport
  expiration?: ReturnType<typeof setTimeout>
  expiresAt: number
  retryAt: number
}

let snapshot: Snapshot | undefined

function replaceSnapshot(next: Snapshot | undefined) {
  if (snapshot?.expiration) clearTimeout(snapshot.expiration)
  snapshot = next
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function instant(value: unknown) {
  return typeof value === 'string' ? Date.parse(value) : NaN
}

function dayOffset(day: string, offset: number) {
  return new Date(Date.parse(day) + offset * DAY_MS).toISOString().slice(0, 10)
}

function numberInRange(value: unknown, max = Infinity): number | null {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= max
    ? value
    : null
}

function seconds(value: string | null): number | null {
  return value !== null && /^\d+$/.test(value.trim()) ? Number(value) : null
}

function applyCacheHeaders(state: RequestState, headers: Headers) {
  const control = headers.get('cache-control') ?? ''
  if (/(?:^|,)\s*(?:no-store|no-cache)\b/i.test(control)) {
    state.cacheMs = 0
    return
  }

  const maxAge = /(?:^|,)\s*max-age\s*=\s*"?(\d+)/i.exec(control)?.[1]
  const sharedMaxAge = /(?:^|,)\s*s-maxage\s*=\s*"?(\d+)/i.exec(control)?.[1]
  const expires = Date.parse(headers.get('expires') ?? '')
  const age = seconds(headers.get('age')) ?? 0
  const ttl = Math.min(
    Number(maxAge ?? Infinity),
    Number(sharedMaxAge ?? Infinity),
  )
  if (Number.isFinite(ttl)) {
    state.cacheMs = Math.min(state.cacheMs, Math.max(0, (ttl - age) * 1000))
  } else if (Number.isFinite(expires)) {
    state.cacheMs = Math.min(state.cacheMs, Math.max(0, expires - Date.now()))
  }
}

async function get(state: RequestState, path: string, query?: URLSearchParams) {
  if (state.retryAt > Date.now()) return null

  try {
    const url = new URL(`${API}/${path}`)
    if (query) url.search = query.toString()
    const response = await fetch(url, {
      cache: 'no-store',
      redirect: 'error',
      headers: {
        Authorization: `Bearer ${state.token}`,
        Accept: 'application/json',
      },
      signal: state.signal,
    })
    applyCacheHeaders(state, response.headers)
    if (response.status === 401) state.unauthorized = true

    if (
      response.status === 429 ||
      response.headers.get('x-ratelimit-remaining') === '0'
    ) {
      const retryAfter = response.headers.get('retry-after')
      const waitSeconds =
        seconds(retryAfter) ??
        seconds(response.headers.get('x-ratelimit-reset'))
      const now = Date.now()
      const retryAt =
        waitSeconds === null
          ? Date.parse(retryAfter ?? '')
          : now + waitSeconds * 1000
      state.retryAt = Math.max(
        state.retryAt,
        Number.isFinite(retryAt) ? retryAt : now + RETRY_MS,
      )
    }
    if (response.status === 404) return { notFound: true }
    if (response.ok) {
      const body = record(await response.json())
      if (body) return body
    }
  } catch {
    // Individual data sources can fail independently.
  }

  state.cacheMs = Math.min(state.cacheMs, RETRY_MS)
  state.failed = true
  return null
}

async function getRuns(
  state: RequestState,
  now: number,
  day: string,
): Promise<Pick<Ready, 'recentRuns' | 'last7Days'>> {
  const oldestDay = dayOffset(day, -29)
  const summaryStart = dayOffset(day, -6)
  const query = new URLSearchParams({
    start: new Date(Date.parse(oldestDay) - DAY_MS).toISOString(),
    end: new Date(now).toISOString(),
    limit: '25',
  })
  const seen = new Set<string>()
  const tokens = new Set<string>()
  const runs: { start: number; value: WhoopRun }[] = []
  let complete = false
  let summaryComplete = false
  let valid = true

  for (let page = 0; page < MAX_WORKOUT_PAGES; page++) {
    const body = await get(state, 'activity/workout', query)
    if (!Array.isArray(body?.records)) break

    for (const item of body.records) {
      const workout = record(item)
      if (!workout || typeof workout.sport_name !== 'string') {
        valid = false
        continue
      }
      const start = instant(workout.start)
      const runDay = Number.isFinite(start) ? berlin.format(start) : null
      // WHOOP orders by start time. An earlier entry closes the seven-day window.
      if (runDay && runDay < summaryStart) summaryComplete = true
      if (workout.sport_name.toLowerCase() !== 'running') continue
      if (workout.end === null || workout.end === undefined) continue

      const end = instant(workout.end)
      if (
        !runDay ||
        !Number.isFinite(end) ||
        end <= start ||
        typeof workout.id !== 'string' ||
        !workout.id
      ) {
        valid = false
        continue
      }
      if (end > now || seen.has(workout.id)) continue
      if (runDay < oldestDay || runDay > day) continue

      seen.add(workout.id)
      runs.push({
        start,
        value: {
          day: runDay,
          elapsedSeconds: Math.round((end - start) / 1000),
          distanceMeters: numberInRange(record(workout.score)?.distance_meter),
        },
      })
    }

    if (body.next_token == null || body.next_token === '') {
      complete = true
      break
    }
    if (summaryComplete && runs.length >= MAX_RECENT_RUNS) break
    if (typeof body.next_token !== 'string' || tokens.has(body.next_token))
      break
    tokens.add(body.next_token)
    query.set('nextToken', body.next_token)
  }

  runs.sort((a, b) => b.start - a.start)
  const week = runs.filter(({ value }) => value.day >= summaryStart)
  return {
    recentRuns:
      (complete && valid) || runs.length > 0
        ? runs.slice(0, MAX_RECENT_RUNS).map(({ value }) => value)
        : null,
    last7Days:
      (complete || summaryComplete) && valid
        ? {
            runCount: week.length,
            elapsedSeconds: week.reduce(
              (total, { value }) => total + value.elapsedSeconds,
              0,
            ),
            distanceMeters: week.some(
              ({ value }) => value.distanceMeters === null,
            )
              ? null
              : week.reduce(
                  (total, { value }) => total + (value.distanceMeters ?? 0),
                  0,
                ),
          }
        : null,
  }
}

async function getToday(
  state: RequestState,
  now: number,
  day: string,
): Promise<Ready['today']> {
  // WHOOP returns the newest cycle first. The active cycle may start the prior evening.
  const body = await get(
    state,
    'cycle',
    new URLSearchParams({ end: new Date(now).toISOString(), limit: '1' }),
  )
  const cycle = Array.isArray(body?.records) ? record(body.records[0]) : null
  const today = { day, strain: null, recoveryPercent: null }
  if (
    !cycle ||
    cycle.end != null ||
    typeof cycle.id !== 'number' ||
    !Number.isSafeInteger(cycle.id) ||
    cycle.id <= 0
  ) {
    return today
  }

  const start = instant(cycle.start)
  if (
    !Number.isFinite(start) ||
    start > now ||
    berlin.format(start) < dayOffset(day, -1)
  )
    return today

  const recovery = await get(state, `cycle/${cycle.id}/recovery`)
  const createdAt = instant(recovery?.created_at)
  const currentRecovery =
    recovery?.cycle_id === cycle.id &&
    createdAt >= start &&
    createdAt <= now &&
    berlin.format(createdAt) === day
  const recoveryScore =
    currentRecovery && recovery.score_state === 'SCORED'
      ? record(recovery.score)
      : null

  return {
    day,
    strain:
      (berlin.format(start) === day || currentRecovery) &&
      cycle.score_state === 'SCORED'
        ? numberInRange(record(cycle.score)?.strain, 21)
        : null,
    recoveryPercent:
      recoveryScore && recoveryScore.user_calibrating !== true
        ? numberInRange(recoveryScore.recovery_score, 100)
        : null,
  }
}

async function load(entry: Snapshot, now: number): Promise<WhoopSport> {
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  const fetchSnapshot = async (token: string) => {
    const state: RequestState = {
      token,
      signal,
      cacheMs: CACHE_MS,
      retryAt: 0,
      unauthorized: false,
      failed: false,
    }
    const [runs, today] = await Promise.all([
      getRuns(state, now, entry.day),
      getToday(state, now, entry.day),
    ])
    const value: WhoopSport =
      runs.recentRuns === null &&
      runs.last7Days === null &&
      today.strain === null &&
      today.recoveryPercent === null
        ? { status: 'unavailable' }
        : { status: 'ready', ...runs, today }
    return { state, value }
  }

  let { state, value } = await fetchSnapshot(entry.token)
  if (
    state.unauthorized &&
    !signal.aborted &&
    !state.retryAt &&
    snapshot === entry
  ) {
    const renewed = await getWhoopAccessToken(entry.token)
    if (renewed && renewed !== entry.token) {
      entry.token = renewed
      const refreshed = await fetchSnapshot(renewed)
      state = refreshed.state
      value = refreshed.value
    }
  }

  const current = await getWhoopAccessToken()
  if (snapshot !== entry || current !== entry.token) {
    if (snapshot === entry) replaceSnapshot(undefined)
    return {
      status:
        current || (await hasWhoopConnection())
          ? 'unavailable'
          : 'disconnected',
    }
  }

  entry.expiresAt = now + state.cacheMs
  entry.retryAt = Math.max(state.failed ? now + RETRY_MS : 0, state.retryAt)
  const remaining = entry.expiresAt - Date.now()
  if (remaining > 0) {
    entry.value = value
    entry.expiration = setTimeout(() => {
      entry.value = undefined
    }, remaining)
    entry.expiration.unref()
  }
  return value
}

export async function getWhoopSport(): Promise<WhoopSport> {
  try {
    const token = await getWhoopAccessToken()
    if (!token) {
      replaceSnapshot(undefined)
      return {
        status: (await hasWhoopConnection()) ? 'unavailable' : 'disconnected',
      }
    }

    const now = Date.now()
    const day = berlin.format(now)
    if (snapshot?.token === token) {
      if (snapshot.day === day && snapshot.pending)
        return await snapshot.pending
      if (snapshot.day === day && snapshot.value && snapshot.expiresAt > now)
        return snapshot.value
      snapshot.value = undefined
      if (snapshot.retryAt > now) return { status: 'unavailable' }
    }

    const entry: Snapshot = {
      token,
      day,
      expiresAt: 0,
      retryAt: now + RETRY_MS,
    }
    replaceSnapshot(entry)
    entry.pending = load(entry, now).finally(() => {
      entry.pending = undefined
    })
    return await entry.pending
  } catch {
    return { status: 'unavailable' }
  }
}

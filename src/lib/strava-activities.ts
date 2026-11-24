import 'server-only'
import { stravaAthleteId } from './me'

const ACTIVITIES_ENDPOINT = 'https://www.strava.com/api/v3/athlete/activities'
const PAGE_SIZE = 30
const MAX_PAGES = 3
const MAX_ACTIVITIES = 5
const REQUEST_TIMEOUT_MS = 4_000

export type StravaActivity = {
  id: number
  sportType: string
  day: string | null
  distanceMeters: number
  movingSeconds: number
}

export type StravaActivitiesResult =
  | { status: 'ready'; activities: StravaActivity[] }
  | { status: 'expired' | 'limited' | 'unavailable' }

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function activityDay(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value))
    return null

  const day = value.slice(0, 10)
  const midnight = new Date(`${day}T00:00:00Z`)
  return Number.isFinite(midnight.getTime()) &&
    midnight.toISOString().startsWith(day)
    ? day
    : null
}

function publicActivity(value: unknown): StravaActivity | null {
  const activity = record(value)
  if (
    !activity ||
    activity.visibility !== 'everyone' ||
    activity.private === true
  ) {
    return null
  }
  if (record(activity.athlete)?.id !== stravaAthleteId) return null

  const {
    id,
    sport_type: sportType,
    distance: distanceMeters,
    moving_time: movingSeconds,
  } = activity
  if (
    typeof id !== 'number' ||
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    typeof sportType !== 'string' ||
    !/^[A-Za-z][A-Za-z0-9]{0,39}$/.test(sportType) ||
    typeof distanceMeters !== 'number' ||
    !Number.isFinite(distanceMeters) ||
    distanceMeters < 0 ||
    typeof movingSeconds !== 'number' ||
    !Number.isSafeInteger(movingSeconds) ||
    movingSeconds < 0
  ) {
    return null
  }

  return {
    id,
    sportType,
    day:
      activityDay(activity.start_date_local) ??
      activityDay(activity.start_date),
    distanceMeters,
    movingSeconds,
  }
}

export async function getStravaActivities(
  token: string,
): Promise<StravaActivitiesResult> {
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const activities: StravaActivity[] = []
  const seen = new Set<number>()

  try {
    for (
      let page = 1;
      page <= MAX_PAGES && activities.length < MAX_ACTIVITIES;
      page++
    ) {
      const url = new URL(ACTIVITIES_ENDPOINT)
      url.searchParams.set('page', String(page))
      url.searchParams.set('per_page', String(PAGE_SIZE))
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        redirect: 'error',
        signal,
      })

      if (response.status === 401) return { status: 'expired' }
      if (response.status === 429) return { status: 'limited' }
      if (!response.ok) return { status: 'unavailable' }

      const body: unknown = await response.json()
      if (!Array.isArray(body)) return { status: 'unavailable' }
      if (body.length === 0) break

      for (const item of body) {
        const activity = publicActivity(item)
        if (!activity || seen.has(activity.id)) continue

        activities.push(activity)
        seen.add(activity.id)
        if (activities.length === MAX_ACTIVITIES) break
      }
    }

    return { status: 'ready', activities }
  } catch {
    return { status: 'unavailable' }
  }
}

import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'

let accessToken = null
let refreshToken
globalThis.whoopTestToken = async (rejected) => {
  if (rejected && refreshToken) accessToken = refreshToken
  return accessToken
}
globalThis.whoopTestConnection = async () => accessToken !== null

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only')
      return nextResolve('data:text/javascript,export%20{}', context)
    if (specifier === '@/lib/whoop-connection') {
      return nextResolve(
        'data:text/javascript,export const getWhoopAccessToken = globalThis.whoopTestToken%3B export const hasWhoopConnection = globalThis.whoopTestConnection',
        context,
      )
    }
    return nextResolve(specifier, context)
  },
})
const { getWhoopSport } = await import('../src/lib/whoop-sport.ts')
hooks.deregister()
delete globalThis.whoopTestToken
delete globalThis.whoopTestConnection

const now = Date.parse('2026-11-25T08:00:00Z')
const run = (id, overrides = {}) => ({
  id,
  user_id: 12345,
  sport_name: 'running',
  start: '2026-11-24T23:15:00Z',
  end: '2026-11-24T23:45:00Z',
  score: { distance_meter: 5400, average_heart_rate: 160 },
  ...overrides,
})
const cycle = (overrides = {}) => ({
  id: 88,
  user_id: 12345,
  start: '2026-11-24T22:00:00Z',
  end: null,
  score_state: 'SCORED',
  score: { strain: 4.3, step_count: 893, average_heart_rate: 70 },
  ...overrides,
})
const recovery = (overrides = {}) => ({
  cycle_id: 88,
  sleep_id: 'sensitive-sleep-id',
  created_at: '2026-11-25T06:40:00Z',
  score_state: 'SCORED',
  score: { recovery_score: 72, hrv_rmssd_milli: 65, spo2_percentage: 98 },
  ...overrides,
})

test('no WHOOP fetch when disconnected', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () =>
    assert.fail('unauthorized fetch'),
  )
  assert.deepEqual(await getWhoopSport(), { status: 'disconnected' })
  assert.equal(fetch.mock.callCount(), 0)
})

test('deduplicates workouts and only emits public fields and two current scores', async (t) => {
  accessToken = 'owner-1'
  t.mock.method(Date, 'now', () => now)
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.origin, 'https://api.prod.whoop.com')
    assert.equal(options.cache, 'no-store')
    assert.equal(options.redirect, 'error')
    assert.equal(options.headers.Authorization, 'Bearer owner-1')

    if (url.pathname.endsWith('/workout')) {
      assert.equal(url.searchParams.get('end'), '2026-11-25T08:00:00.000Z')
      assert.ok(url.searchParams.get('start'))
      if (url.searchParams.get('nextToken')) {
        assert.equal(url.searchParams.get('nextToken'), 'next')
        return Response.json({
          records: [
            run('a'),
            run('b', {
              start: '2026-11-19T08:00:00Z',
              end: '2026-11-19T08:15:00Z',
              score: null,
            }),
            run('old', {
              start: '2026-11-18T08:00:00Z',
              end: '2026-11-18T08:30:00Z',
            }),
          ],
          next_token: null,
        })
      }
      return Response.json({
        records: [
          run('a'),
          run('cycling', { sport_name: 'cycling' }),
          run('active', { end: null }),
          run('future', { end: '2026-11-25T09:00:00Z' }),
        ],
        next_token: 'next',
      })
    }
    if (url.pathname.endsWith('/cycle'))
      return Response.json({ records: [cycle()] })
    assert.ok(url.pathname.endsWith('/cycle/88/recovery'))
    return Response.json(recovery())
  })

  const [a, b] = await Promise.all([getWhoopSport(), getWhoopSport()])
  const expected = {
    status: 'ready',
    recentRuns: [
      { day: '2026-11-25', elapsedSeconds: 1800, distanceMeters: 5400 },
      { day: '2026-11-19', elapsedSeconds: 900, distanceMeters: null },
      { day: '2026-11-18', elapsedSeconds: 1800, distanceMeters: 5400 },
    ],
    last7Days: { runCount: 2, elapsedSeconds: 2700, distanceMeters: null },
    today: { day: '2026-11-25', strain: 4.3, recoveryPercent: 72 },
  }
  assert.deepEqual(a, expected)
  assert.deepEqual(b, expected)
  assert.deepEqual(await getWhoopSport(), expected)
  assert.equal(fetch.mock.callCount(), 4)

  accessToken = null
  assert.deepEqual(await getWhoopSport(), { status: 'disconnected' })
  assert.equal(fetch.mock.callCount(), 4)
})

test('retains runs from a bounded response with no verified total and rejects mismatched recovery', async (t) => {
  accessToken = 'owner-2'
  t.mock.method(Date, 'now', () => now)
  let pages = 0
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.pathname.endsWith('/workout')) {
      return Response.json({ records: [run('a')], next_token: String(++pages) })
    }
    if (url.pathname.endsWith('/cycle')) {
      return Response.json({
        records: [cycle({ start: '2026-11-25T06:00:00Z' })],
      })
    }
    return Response.json(recovery({ cycle_id: 99 }))
  })

  assert.deepEqual(await getWhoopSport(), {
    status: 'ready',
    recentRuns: [
      { day: '2026-11-25', elapsedSeconds: 1800, distanceMeters: 5400 },
    ],
    last7Days: null,
    today: { day: '2026-11-25', strain: 4.3, recoveryPercent: null },
  })
  assert.equal(pages, 4)
})

test('keeps a verified seven-day total when older workout pages fail', async (t) => {
  accessToken = 'owner-verified-week'
  t.mock.method(Date, 'now', () => now)
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.pathname.endsWith('/cycle')) return Response.json({ records: [] })
    if (url.searchParams.has('nextToken'))
      return new Response(null, { status: 500 })
    return Response.json({
      records: [
        run('older', {
          sport_name: 'cycling',
          start: '2026-11-18T12:00:00Z',
          end: '2026-11-18T12:30:00Z',
        }),
      ],
      next_token: 'older',
    })
  })

  const value = await getWhoopSport()
  assert.equal(value.status, 'ready')
  assert.deepEqual(value.last7Days, {
    runCount: 0,
    elapsedSeconds: 0,
    distanceMeters: 0,
  })
  assert.equal(value.recentRuns, null)
})

test('honors no-store and rate limits errors without re-serving the discarded snapshot', async (t) => {
  accessToken = 'owner-3'
  let time = now
  t.mock.method(Date, 'now', () => time)
  const fetch = t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.pathname.endsWith('/workout')) {
      return Response.json(
        { records: [] },
        { headers: { 'cache-control': 'no-store' } },
      )
    }
    return new Response(null, { status: 429, headers: { 'retry-after': '60' } })
  })

  assert.deepEqual(await getWhoopSport(), {
    status: 'ready',
    recentRuns: [],
    last7Days: { runCount: 0, elapsedSeconds: 0, distanceMeters: 0 },
    today: { day: '2026-11-25', strain: null, recoveryPercent: null },
  })
  time += 30_000
  assert.deepEqual(await getWhoopSport(), { status: 'unavailable' })
  assert.equal(fetch.mock.callCount(), 2)
  time += 31_000
  assert.equal((await getWhoopSport()).status, 'ready')
  assert.equal(fetch.mock.callCount(), 4)
})

test('serves successive successful requests when upstream forbids caching', async (t) => {
  accessToken = 'owner-no-cache'
  t.mock.method(Date, 'now', () => now)
  const fetch = t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.pathname.endsWith('/workout')) {
      return Response.json(
        { records: [] },
        { headers: { 'cache-control': 'no-store' } },
      )
    }
    return Response.json({ records: [] })
  })
  const first = await getWhoopSport()
  assert.equal(first.status, 'ready')
  assert.deepEqual(await getWhoopSport(), first)
  assert.equal(fetch.mock.callCount(), 4)
})

test('refreshes once for an API 401 and keeps recovery when workouts fail', async (t) => {
  accessToken = 'expired'
  refreshToken = 'renewed'
  t.mock.method(Date, 'now', () => now)
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (options.headers.Authorization === 'Bearer expired')
      return new Response(null, { status: 401 })
    if (url.pathname.endsWith('/workout'))
      return new Response(null, { status: 500 })
    if (url.pathname.endsWith('/cycle'))
      return Response.json({
        records: [cycle({ score_state: 'PENDING_SCORE', score: null })],
      })
    return Response.json(recovery())
  })
  assert.deepEqual(await getWhoopSport(), {
    status: 'ready',
    recentRuns: null,
    last7Days: null,
    today: { day: '2026-11-25', strain: null, recoveryPercent: 72 },
  })
  assert.equal(
    fetch.mock.calls.filter(
      ({ arguments: [, options] }) =>
        options.headers.Authorization === 'Bearer expired',
    ).length,
    2,
  )
  refreshToken = undefined
})

test('uses the shortest upstream cache lifetime and hides previous Berlin-day scores', async (t) => {
  accessToken = 'owner-5'
  let time = now
  t.mock.method(Date, 'now', () => time)
  const fetch = t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.pathname.endsWith('/workout')) {
      return Response.json(
        { records: [] },
        { headers: { 'cache-control': 'max-age=90', age: '60' } },
      )
    }
    if (url.pathname.endsWith('/cycle'))
      return Response.json({ records: [cycle()] })
    return Response.json(recovery())
  })
  assert.equal((await getWhoopSport()).today.recoveryPercent, 72)
  time += 29_000
  assert.equal((await getWhoopSport()).today.recoveryPercent, 72)
  assert.equal(fetch.mock.callCount(), 3)
  time += 2_000
  assert.equal((await getWhoopSport()).today.recoveryPercent, 72)
  assert.equal(fetch.mock.callCount(), 6)
  time = Date.parse('2026-11-25T23:01:00Z')
  assert.deepEqual((await getWhoopSport()).today, {
    day: '2026-11-26',
    strain: null,
    recoveryPercent: null,
  })
})

test('discards a completed upstream response if disconnected while it was in flight', async (t) => {
  accessToken = 'owner-6'
  t.mock.method(Date, 'now', () => now)
  const fetch = t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.pathname.endsWith('/workout')) {
      accessToken = null
      return Response.json({ records: [run('a')] })
    }
    return Response.json({ records: [cycle()] })
  })
  assert.deepEqual(await getWhoopSport(), { status: 'disconnected' })
  const count = fetch.mock.callCount()
  assert.deepEqual(await getWhoopSport(), { status: 'disconnected' })
  assert.equal(fetch.mock.callCount(), count)
})

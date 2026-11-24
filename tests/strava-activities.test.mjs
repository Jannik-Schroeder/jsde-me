import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'

// Next resolves this marker during its build, outside Node's standalone test runner.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only')
      return { url: 'data:text/javascript,export%20{}', shortCircuit: true }
    return nextResolve(specifier === './me' ? './me.ts' : specifier, context)
  },
})
const { getStravaActivities } = await import('../src/lib/strava-activities.ts')
hooks.deregister()

const fakeToken = 'test-token'
const activity = (id, overrides = {}) => ({
  id,
  visibility: 'everyone',
  private: false,
  athlete: { id: 1360964105 },
  sport_type: 'MountainBikeRide',
  distance: 18403.7,
  moving_time: 3505,
  start_date_local: '2026-11-24T00:10:42Z',
  start_date: '2026-11-23T23:10:42Z',
  ...overrides,
})

test('only returns explicitly public owner activities with reduced fields', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(
      url.href,
      'https://www.strava.com/api/v3/athlete/activities?page=1&per_page=30',
    )
    assert.equal(options.headers.Authorization, `Bearer ${fakeToken}`)
    assert.equal(options.cache, 'no-store')
    assert.equal(options.redirect, 'error')
    assert.equal(options.signal.aborted, false)

    return Response.json([
      activity(1, { visibility: 'followers_only' }),
      activity(2, { visibility: 'only_me' }),
      activity(3, { visibility: undefined }),
      activity(4, { athlete: { id: 42 } }),
      activity(5, { athlete: undefined }),
      activity(6, { private: true }),
      activity(7, { distance: -1 }),
      activity(8, { sport_type: 'Name with address' }),
      activity(9, {
        name: 'Private title',
        description: 'Private description',
        start_latlng: [51, 8],
        map: { summary_polyline: 'private route' },
        average_heartrate: 145,
      }),
      activity(10, { start_date_local: '2026-02-30T00:15:00Z' }),
      activity(11, { start_date_local: null, start_date: null }),
      activity(12),
      activity(13),
      activity(14),
    ])
  })

  const expected = (id, day) => ({
    id,
    sportType: 'MountainBikeRide',
    day,
    distanceMeters: 18403.7,
    movingSeconds: 3505,
  })
  assert.deepEqual(await getStravaActivities(fakeToken), {
    status: 'ready',
    activities: [
      expected(9, '2026-11-24'),
      expected(10, '2026-11-23'),
      expected(11, null),
      expected(12, '2026-11-24'),
      expected(13, '2026-11-24'),
    ],
  })
})

test('continues through short pages, deduplicates and shares a deadline', async (t) => {
  const pages = [
    [activity(1), activity(2, { visibility: 'followers_only' })],
    [activity(1), activity(3)],
    [],
  ]
  const request = t.mock.method(globalThis, 'fetch', async (url) => {
    return Response.json(pages[Number(url.searchParams.get('page')) - 1])
  })

  const result = await getStravaActivities(fakeToken)
  assert.equal(result.status, 'ready')
  assert.deepEqual(
    result.activities.map(({ id }) => id),
    [1, 3],
  )
  assert.equal(request.mock.callCount(), 3)
  assert.equal(
    request.mock.calls[0].arguments[1].signal,
    request.mock.calls[2].arguments[1].signal,
  )
})

test('bounds paging when no activities qualify and succeeds with an empty list', async (t) => {
  const request = t.mock.method(globalThis, 'fetch', async () => {
    return Response.json([activity(1, { visibility: 'followers_only' })])
  })

  assert.deepEqual(await getStravaActivities(fakeToken), {
    status: 'ready',
    activities: [],
  })
  assert.equal(request.mock.callCount(), 3)
})

test('maps upstream statuses and failures without exposing response details', async (t) => {
  const cases = [
    ['expired', () => new Response('private response', { status: 401 })],
    ['limited', () => new Response('private response', { status: 429 })],
    ['unavailable', () => new Response('private response', { status: 403 })],
    ['unavailable', () => new Response('private response', { status: 503 })],
    ['unavailable', () => new Response('not JSON')],
    ['unavailable', () => Response.json({ unexpected: true })],
    [
      'unavailable',
      () => {
        throw new DOMException('The request timed out', 'TimeoutError')
      },
    ],
  ]
  for (const [status, response] of cases) {
    await t.test(status, async (subtest) => {
      subtest.mock.method(globalThis, 'fetch', response)
      assert.deepEqual(await getStravaActivities(fakeToken), { status })
    })
  }
})

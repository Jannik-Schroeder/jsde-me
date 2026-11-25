import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { fetchCommitsToday } from '../src/lib/status-sources.ts'

const keys = ['GITHUB_TOKEN', 'GITHUB_USER', 'FORGEJO_URL', 'FORGEJO_TOKEN', 'FORGEJO_USER']
let original
beforeEach(() => {
  original = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  process.env.GITHUB_TOKEN = 'fixture-token'
  process.env.GITHUB_USER = 'example-user'
})
afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key]
    else process.env[key] = original[key]
  }
})
const now = new Date('2026-11-25T18:00:00Z')
const calendar = (days) => ({ data: { user: { contributionsCollection: {
  totalCommitContributions: 145,
  contributionCalendar: { totalContributions: 148, weeks: [{ contributionDays: days }] },
} } } })
const day = (contributionCount, date = '2026-11-25') => ({ date, contributionCount })

test('reads only today from the contribution calendar, including private aggregate activity', async (t) => {
  process.env.FORGEJO_URL = 'https://retired.invalid'
  process.env.FORGEJO_TOKEN = 'obsolete-fixture'
  process.env.FORGEJO_USER = 'old-user'
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.github.com/graphql')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.authorization, 'Bearer fixture-token')
    assert.equal(options.cache, 'force-cache')
    assert.equal(options.next.revalidate, 300)
    const body = JSON.parse(options.body)
    assert.match(body.query, /contributionCalendar/)
    assert.deepEqual(body.variables, { user: 'example-user', from: '2026-11-25T00:00:00Z', to: '2026-11-25T23:59:59Z' })
    return Response.json(calendar([day(122, '2026-11-24'), day(26)]))
  })
  assert.equal(await fetchCommitsToday(now), 26)
  assert.equal(fetch.mock.callCount(), 1, 'never queries the retired Forgejo source')
})

for (const [instant, date] of [
  ['2026-11-24T23:30:00Z', '2026-11-25'],
  ['2026-07-10T22:30:00Z', '2026-07-11'],
]) {
  test(`uses the Berlin calendar date at ${instant}`, async (t) => {
    t.mock.method(globalThis, 'fetch', async (_, options) => {
      assert.equal(JSON.parse(options.body).variables.from, date + 'T00:00:00Z')
      return Response.json(calendar([day(41, date)]))
    })
    assert.equal(await fetchCommitsToday(new Date(instant)), 41)
  })
}

test('a valid zero contribution day remains zero', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json(calendar([day(0)])))
  assert.equal(await fetchCommitsToday(now), 0)
})
for (const key of ['GITHUB_TOKEN', 'GITHUB_USER']) {
  test(`missing ${key} is unavailable without a request`, async (t) => {
    delete process.env[key]
    t.mock.method(globalThis, 'fetch', () => assert.fail('must not fetch'))
    assert.equal(await fetchCommitsToday(now), null)
  })
}
for (const value of [-1, 1.5, '26', null]) {
  test(`invalid contribution count ${JSON.stringify(value)} is unavailable, not zero`, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => Response.json(calendar([day(value)])))
    assert.equal(await fetchCommitsToday(now), null)
  })
}
for (const payload of [
  {},
  { data: { user: null } },
  calendar([day(122, '2026-11-24')]),
  { errors: [{ message: 'private upstream details' }], ...calendar([day(26)]) },
]) {
  test('incomplete or failed GraphQL results are unavailable', async (t) => {
    const messages = []
    t.mock.method(console, 'error', (...args) => messages.push(args.join(' ')))
    t.mock.method(globalThis, 'fetch', async () => Response.json(payload))
    assert.equal(await fetchCommitsToday(now), null)
    assert.ok(!messages.join(' ').includes('private upstream details'))
  })
}
test('HTTP and transport failures never masquerade as zero contributions', async (t) => {
  t.mock.method(console, 'error', () => {})
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 401 }))
  assert.equal(await fetchCommitsToday(now), null)
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('network unavailable') })
  assert.equal(await fetchCommitsToday(now), null)
})

import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { registerHooks } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { NextResponse } from 'next/server.js'

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'server-only') {
      return { url: 'data:text/javascript,export%20{}', shortCircuit: true }
    }
    if (specifier === 'next/headers') {
      return {
        url: 'data:text/javascript,export%20const%20cookies%20%3D%20async%20()%20%3D%3E%20globalThis.testWhoopCookies',
        shortCircuit: true,
      }
    }
    if (specifier === 'next/server')
      return nextResolve('next/server.js', context)
    if (specifier === './strava-session') {
      return nextResolve('./strava-session.ts', context)
    }
    if (specifier.startsWith('@/lib/')) {
      return nextResolve(
        new URL(`../src/lib/${specifier.slice(6)}.ts`, import.meta.url).href,
        context,
      )
    }
    return nextResolve(specifier, context)
  },
})

const { POST: connect } = await import('../src/app/api/whoop/connect/route.ts')
const { GET: callback } = await import('../src/app/api/whoop/callback/route.ts')
const { POST: disconnect } =
  await import('../src/app/api/whoop/disconnect/route.ts')
const { getWhoopAccessToken, hasWhoopConnection } =
  await import('../src/lib/whoop-connection.ts')
const { setOwnerAccessToken } = await import('../src/lib/strava-session.ts')
hooks.deregister()

const origin = 'https://jsde.me'
const cookieName = '__Host-whoop-state'
const requestedScopes = 'offline read:workout read:cycles read:recovery'

function request(action, originHeader = origin) {
  return new Request(`${origin}/api/whoop/${action}`, {
    method: 'POST',
    headers: { origin: originHeader },
  })
}

function tokenResponse(suffix, { scope, expiresIn = 3600 } = {}) {
  return Response.json({
    access_token: `test-access-${suffix}`,
    refresh_token: `test-refresh-${suffix}`,
    expires_in: expiresIn,
    scope,
    token_type: 'bearer',
  })
}

function status(response) {
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  const target = new URL(response.headers.get('location'))
  assert.equal(target.origin, origin)
  assert.equal(target.pathname, '/training')
  return target.searchParams.get('whoop')
}

test('owner-only WHOOP OAuth, rotation, invalidation and disconnect', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'jsde-whoop-test-'))
  const path = join(directory, 'tokens.json')
  const previousEnv = process.env
  const cookieJar = new Map()
  process.env = {
    ...previousEnv,
    NEXT_PUBLIC_SITE_URL: origin,
    STRAVA_CLIENT_ID: 'test-strava-client',
    STRAVA_CLIENT_SECRET: 'test-strava-secret',
    WHOOP_CLIENT_ID: 'test-whoop-client',
    WHOOP_CLIENT_SECRET: 'test-whoop-secret',
    WHOOP_DATA_DIR: directory,
  }
  globalThis.testWhoopCookies = cookieJar
  t.after(async () => {
    process.env = previousEnv
    delete globalThis.testWhoopCookies
    await rm(directory, { recursive: true, force: true })
  })

  const attempts = []
  let reply = () => tokenResponse('initial')
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(init.cache, 'no-store')
    assert.equal(init.redirect, 'error')
    assert.equal(init.signal.aborted, false)
    attempts.push({
      url,
      method: init.method,
      token: init.headers?.Authorization,
    })
    if (init.method === 'DELETE') {
      assert.equal(url, 'https://api.prod.whoop.com/developer/v2/user/access')
    } else {
      assert.equal(url, 'https://api.prod.whoop.com/oauth/oauth2/token')
      assert.equal(init.body.get('client_id'), 'test-whoop-client')
      assert.equal(init.body.get('client_secret'), 'test-whoop-secret')
    }
    return reply(init)
  })

  function signIn(owner) {
    const response = new NextResponse()
    setOwnerAccessToken(response, owner, Math.floor(Date.now() / 1000) + 3600)
    const cookie = response.cookies.get('__Host-strava-session')
    cookieJar.set(cookie.name, cookie)
  }

  async function authorize() {
    const response = await connect(request('connect'))
    assert.equal(response.status, 303)
    const to = new URL(response.headers.get('location'))
    assert.equal(to.origin, 'https://api.prod.whoop.com')
    assert.equal(to.pathname, '/oauth/oauth2/auth')
    assert.equal(to.searchParams.get('client_id'), 'test-whoop-client')
    assert.equal(to.searchParams.get('scope'), requestedScopes)
    assert.equal(
      to.searchParams.get('redirect_uri'),
      origin + '/api/whoop/callback',
    )
    assert(!to.href.includes('test-whoop-secret'))
    const state = to.searchParams.get('state')
    assert.match(state, /^[A-Za-z0-9_-]{8}$/)
    const cookie = response.cookies.get(cookieName)
    assert(cookie.httpOnly && cookie.secure && cookie.sameSite === 'lax')
    assert.notEqual(cookie.value, state)
    cookieJar.set(cookieName, cookie)
    return state
  }

  function grant(state) {
    const url = new URL('/api/whoop/callback', origin)
    url.search = new URLSearchParams({
      state,
      code: 'test-auth-code',
    }).toString()
    return callback(new Request(url))
  }

  assert.equal((await connect(request('connect'))).status, 403)
  assert.equal((await disconnect(request('disconnect'))).status, 403)
  assert.equal((await grant('badstate')).status, 403)
  signIn('initial-owner-session-token')
  assert.equal(
    (await connect(request('connect', 'https://elsewhere.invalid'))).status,
    403,
  )
  assert.equal(
    (await disconnect(request('disconnect', 'https://elsewhere.invalid')))
      .status,
    403,
  )

  const initialState = await authorize()
  const signedCookie = cookieJar.get(cookieName)
  cookieJar.delete(cookieName)
  assert.equal(status(await grant(initialState)), 'error')
  cookieJar.set(cookieName, signedCookie)
  assert.equal(status(await grant('tampered')), 'error')
  signIn('other-owner-session-token')
  assert.equal(status(await grant(initialState)), 'error')
  signIn('initial-owner-session-token')
  assert.equal(attempts.length, 0)

  reply = ({ body }) => {
    assert.equal(body.get('grant_type'), 'authorization_code')
    assert.equal(body.get('redirect_uri'), origin + '/api/whoop/callback')
    return tokenResponse('unapproved', { scope: 'offline read:workout' })
  }
  assert.equal(status(await grant(initialState)), 'error')
  assert.equal(await hasWhoopConnection(), false)
  assert.equal(status(await grant(initialState)), 'error')
  assert.equal(attempts.length, 1)

  reply = () => tokenResponse('initial')
  const response = await grant(await authorize())
  assert.equal(status(response), 'connected')
  assert.equal(response.cookies.get(cookieName).maxAge, 0)
  assert.equal((await stat(directory)).mode & 0o777, 0o700)
  assert.equal((await stat(path)).mode & 0o777, 0o600)
  assert.equal(await hasWhoopConnection(), true)
  assert.equal(await getWhoopAccessToken(), 'test-access-initial')

  reply = ({ body }) => {
    assert.equal(body.get('grant_type'), 'refresh_token')
    assert.equal(body.get('scope'), 'offline')
    assert.equal(body.get('refresh_token'), 'test-refresh-initial')
    return tokenResponse('rotated', { scope: requestedScopes })
  }
  assert.deepEqual(
    await Promise.all(
      Array.from({ length: 8 }, () =>
        getWhoopAccessToken('test-access-initial'),
      ),
    ),
    Array(8).fill('test-access-rotated'),
  )
  assert.equal(attempts.length, 3)
  const stored = JSON.parse(await readFile(path, 'utf8'))
  assert.equal(stored.refreshToken, 'test-refresh-rotated')
  await writeFile(path, JSON.stringify({ ...stored, expiresAt: 1 }))

  const obsoleteState = await authorize()
  const { promise: refreshStarted, resolve: signalRefresh } =
    Promise.withResolvers()
  const { promise: resumeRefresh, resolve: releaseRefresh } =
    Promise.withResolvers()
  reply = async ({ body, method, headers }) => {
    if (method === 'DELETE') {
      assert.equal(headers.Authorization, 'Bearer test-access-final')
      return new Response(null, { status: 204 })
    }
    assert.equal(body.get('refresh_token'), 'test-refresh-rotated')
    signalRefresh()
    await resumeRefresh
    return tokenResponse('final')
  }
  const refresh = getWhoopAccessToken()
  await refreshStarted
  const dropping = disconnect(request('disconnect'))
  const lateGrant = grant(obsoleteState)
  releaseRefresh()
  assert.equal(await refresh, 'test-access-final')
  assert.equal(status(await dropping), 'disconnected')
  assert.equal(status(await lateGrant), 'error')
  assert.equal(await hasWhoopConnection(), false)
  assert.equal(await getWhoopAccessToken(), null)
  await assert.rejects(stat(path), { code: 'ENOENT' })

  reply = () => tokenResponse('expired', { expiresIn: 1 })
  assert.equal(status(await grant(await authorize())), 'connected')
  reply = () => Response.json({ error: 'invalid_grant' }, { status: 400 })
  assert.equal(await getWhoopAccessToken(), null)
  assert.equal(await hasWhoopConnection(), false)
})

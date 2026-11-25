import 'server-only'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, mkdir, open, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { stravaResponseHeaders, stravaSiteOrigin } from './strava-session'

const whoopOrigin = 'https://api.prod.whoop.com'
const scopes = ['offline', 'read:workout', 'read:cycles', 'read:recovery']
const stateLifetimeMs = 10 * 60_000
const requestTimeoutMs = 5_000
const refreshLeewayMs = 30_000

type Tokens = {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

type State = { value: string; expiresAt: number }

type ConnectionState = {
  queue: Promise<void>
  pendingAuthorization?: State
  retryAfter?: number
}

// Next.js can load route handlers and page code from separate bundles.
const processState = globalThis as typeof globalThis & {
  jsdeWhoopConnection?: ConnectionState
}
const connectionState = (processState.jsdeWhoopConnection ??= {
  queue: Promise.resolve(),
})

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = connectionState.queue.then(operation)
  connectionState.queue = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

function credentials() {
  const clientId = process.env.WHOOP_CLIENT_ID?.trim()
  const clientSecret = process.env.WHOOP_CLIENT_SECRET?.trim()
  return clientId && clientSecret ? { clientId, clientSecret } : null
}

export function isWhoopConfigured(): boolean {
  return credentials() !== null
}

function dataDirectory() {
  return process.env.WHOOP_DATA_DIR?.trim() || '/var/lib/jsde-whoop'
}

async function tokenPath(create = false) {
  const directory = dataDirectory()
  if (create) await mkdir(directory, { recursive: true, mode: 0o700 })
  const info = await lstat(directory)
  if (!info.isDirectory() || (info.mode & 0o777) !== 0o700) {
    throw new Error('Invalid WHOOP data directory')
  }
  return join(directory, 'tokens.json')
}

function missing(error: unknown) {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT'
}

function validToken(value: unknown): value is string {
  return typeof value === 'string' && /^[!-~]+$/.test(value)
}

async function readTokens(): Promise<Tokens | null> {
  try {
    const file = await open(
      await tokenPath(),
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    )
    try {
      const info = await file.stat()
      if (
        !info.isFile() ||
        (info.mode & 0o777) !== 0o600 ||
        info.size > 32_768
      ) {
        throw new Error('Invalid WHOOP token file')
      }
      const tokens = JSON.parse(await file.readFile('utf8')) as Tokens
      if (
        !validToken(tokens.accessToken) ||
        !validToken(tokens.refreshToken) ||
        !Number.isSafeInteger(tokens.expiresAt) ||
        tokens.expiresAt <= 0
      ) {
        throw new Error('Invalid WHOOP tokens')
      }
      return tokens
    } finally {
      await file.close()
    }
  } catch (error) {
    if (missing(error)) return null
    throw error
  }
}

async function syncDirectory() {
  // The token volume is mounted at runtime, outside the standalone bundle.
  const folder = await open(
    /* turbopackIgnore: true */ dataDirectory(),
    constants.O_DIRECTORY,
  )
  try {
    await folder.sync()
  } finally {
    await folder.close()
  }
}

async function writeTokens(tokens: Tokens) {
  const destination = await tokenPath(true)
  const temporary = `${destination}.${randomBytes(12).toString('hex')}.tmp`
  const file = await open(temporary, 'wx', 0o600)
  try {
    try {
      await file.writeFile(JSON.stringify(tokens), 'utf8')
      await file.sync()
    } finally {
      await file.close()
    }
    await rename(temporary, destination)
    await syncDirectory()
  } finally {
    await unlink(temporary).catch(() => undefined)
  }
  connectionState.retryAfter = undefined
}

async function removeTokens() {
  try {
    await unlink(await tokenPath())
  } catch (error) {
    if (!missing(error)) throw error
    return
  }
  await syncDirectory()
  connectionState.retryAfter = undefined
}

export async function hasWhoopConnection(): Promise<boolean> {
  if (!isWhoopConfigured()) return false
  try {
    return (await readTokens()) !== null
  } catch {
    return false
  }
}

type Exchange =
  { status: 'ok'; tokens: Tokens } | { status: 'revoked' | 'error' }

async function exchangeTokens(
  parameters: Record<string, string>,
): Promise<Exchange> {
  const config = credentials()
  if (!config) return { status: 'error' }

  const response = await fetch(`${whoopOrigin}/oauth/oauth2/token`, {
    method: 'POST',
    body: new URLSearchParams({
      ...parameters,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(requestTimeoutMs),
  })
  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      const payload = await response.json().catch(() => null)
      if (payload?.error === 'invalid_grant') return { status: 'revoked' }
    }
    return { status: 'error' }
  }

  const payload = (await response.json()) as {
    scope?: unknown
    token_type?: unknown
    access_token?: unknown
    refresh_token?: unknown
    expires_in?: unknown
  } | null
  const requestedScopes =
    typeof payload?.scope === 'string' ? payload.scope.trim().split(/\s+/) : []
  if (
    payload?.scope !== undefined &&
    (scopes.some((scope) => !requestedScopes.includes(scope)) ||
      requestedScopes.some((scope) => !scopes.includes(scope)))
  ) {
    return { status: 'revoked' }
  }

  if (
    !validToken(payload?.access_token) ||
    !validToken(payload?.refresh_token) ||
    (payload.token_type !== undefined &&
      (typeof payload.token_type !== 'string' ||
        payload.token_type.toLowerCase() !== 'bearer')) ||
    typeof payload.expires_in !== 'number' ||
    !Number.isSafeInteger(payload.expires_in) ||
    payload.expires_in <= 0 ||
    !Number.isSafeInteger(payload.expires_in * 1000 + Date.now())
  ) {
    return { status: 'error' }
  }

  return {
    status: 'ok',
    tokens: {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt: Date.now() + payload.expires_in * 1000,
    },
  }
}

function refreshTokens(tokens: Tokens) {
  return exchangeTokens({
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
    scope: 'offline',
  })
}

export function getWhoopAccessToken(
  rejectedAccessToken?: string,
): Promise<string | null> {
  if (!isWhoopConfigured()) return Promise.resolve(null)

  return serialize(async () => {
    try {
      const tokens = await readTokens()
      if (!tokens) return null
      if (
        tokens.accessToken !== rejectedAccessToken &&
        tokens.expiresAt > Date.now() + refreshLeewayMs
      ) {
        return tokens.accessToken
      }
      if ((connectionState.retryAfter ?? 0) > Date.now()) return null

      const result = await refreshTokens(tokens)
      if (result.status === 'ok') {
        await writeTokens(result.tokens)
        return result.tokens.accessToken
      }
      if (result.status === 'revoked') await removeTokens()
      else connectionState.retryAfter = Date.now() + refreshLeewayMs
    } catch {
      connectionState.retryAfter = Date.now() + refreshLeewayMs
    }
    return null
  })
}

function stateCookie() {
  const secure = stravaSiteOrigin().startsWith('https:')
  return {
    name: `${secure ? '__Host-' : ''}whoop-state`,
    secure,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
  }
}

function signature(state: State, ownerToken: string, secret: string) {
  return createHmac('sha256', secret)
    .update(
      JSON.stringify([
        'jsde.me WHOOP state',
        state.value,
        state.expiresAt,
        ownerToken,
      ]),
    )
    .digest('base64url')
}

function callbackUrl() {
  return new URL('/api/whoop/callback', stravaSiteOrigin()).href
}

export function beginWhoopConnection(ownerToken: string) {
  const config = credentials()
  if (!config) return redirectToWhoopTraining('error')

  return serialize(async () => {
    const state = {
      value: randomBytes(6).toString('base64url'),
      expiresAt: Date.now() + stateLifetimeMs,
    }
    const url = new URL('/oauth/oauth2/auth', whoopOrigin)
    url.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: callbackUrl(),
      response_type: 'code',
      scope: scopes.join(' '),
      state: state.value,
    }).toString()

    const response = NextResponse.redirect(url, {
      status: 303,
      headers: stravaResponseHeaders,
    })
    response.cookies.set({
      ...stateCookie(),
      value: signature(state, ownerToken, config.clientSecret),
      expires: new Date(state.expiresAt),
    })
    connectionState.pendingAuthorization = state
    return response
  })
}

export async function finishWhoopConnection(
  parameters: URLSearchParams,
  ownerToken: string,
) {
  const config = credentials()
  const returnedState = parameters.get('state')
  const signed = (await cookies()).get(stateCookie().name)?.value
  if (
    !config ||
    !returnedState ||
    !signed ||
    !/^[A-Za-z0-9_-]{43}$/.test(signed)
  ) {
    return redirectToWhoopTraining('error')
  }

  return serialize(async () => {
    const state = connectionState.pendingAuthorization
    if (
      !state ||
      state.expiresAt <= Date.now() ||
      state.value !== returnedState ||
      !timingSafeEqual(
        Buffer.from(signed),
        Buffer.from(signature(state, ownerToken, config.clientSecret)),
      )
    ) {
      return redirectToWhoopTraining('error')
    }

    connectionState.pendingAuthorization = undefined
    const code = parameters.get('code')
    let status: WhoopStatus = 'error'
    if (parameters.has('error')) {
      status = 'denied'
    } else if (code) {
      try {
        await tokenPath(true)
        const result = await exchangeTokens({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl(),
        })
        if (result.status === 'ok') {
          await writeTokens(result.tokens)
          status = 'connected'
        }
      } catch {
        // The browser receives a generic error without upstream details.
      }
    }
    return redirectToWhoopTraining(status, true)
  })
}

export function disconnectWhoop(): Promise<NextResponse> {
  return serialize(async () => {
    connectionState.pendingAuthorization = undefined
    let tokens: Tokens | null
    try {
      tokens = await readTokens().catch(() => null)
      await removeTokens()
    } catch {
      return redirectToWhoopTraining('error', true)
    }

    if (tokens) {
      try {
        let accessToken = tokens.accessToken
        const revoke = (token: string) =>
          fetch(`${whoopOrigin}/developer/v2/user/access`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
            redirect: 'error',
            signal: AbortSignal.timeout(requestTimeoutMs),
          })
        let response: Response | undefined
        if (tokens.expiresAt > Date.now()) response = await revoke(accessToken)
        if (!response || response.status === 401) {
          const result = await refreshTokens(tokens)
          if (result.status === 'revoked') {
            return redirectToWhoopTraining('disconnected', true)
          }
          if (result.status === 'ok') {
            accessToken = result.tokens.accessToken
            response = await revoke(accessToken)
          }
        }
        if (!response?.ok) {
          return redirectToWhoopTraining('revocation-failed', true)
        }
      } catch {
        return redirectToWhoopTraining('revocation-failed', true)
      }
    }
    return redirectToWhoopTraining('disconnected', true)
  })
}

type WhoopStatus =
  'connected' | 'disconnected' | 'denied' | 'error' | 'revocation-failed'

function redirectToWhoopTraining(status: WhoopStatus, clearState = false) {
  const target = new URL('/training', stravaSiteOrigin())
  target.searchParams.set('whoop', status)
  const response = NextResponse.redirect(target, {
    status: 303,
    headers: stravaResponseHeaders,
  })
  if (clearState)
    response.cookies.set({ ...stateCookie(), value: '', maxAge: 0 })
  return response
}

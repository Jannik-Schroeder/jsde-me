import 'server-only'
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const productionOrigin = 'https://jsde.me'
const stateLifetime = 10 * 60

type CookieKind = 'state' | 'session'
type CookiePayload = { value: string; expiresAt: number }
type TrainingError =
  | 'unavailable'
  | 'invalid-state'
  | 'denied'
  | 'insufficient-scope'
  | 'wrong-athlete'
  | 'exchange-failed'

export function stravaSiteOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (configuredUrl) {
    try {
      const url = new URL(configuredUrl)
      const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(
        url.hostname,
      )
      if (url.protocol === 'https:' || (url.protocol === 'http:' && loopback)) {
        return url.origin
      }
    } catch {
      // Fall back to the production callback origin.
    }
  }
  return productionOrigin
}

export function stravaCredentials() {
  const clientId = process.env.STRAVA_CLIENT_ID?.trim()
  const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim()
  return clientId && clientSecret ? { clientId, clientSecret } : null
}

export function isStravaConfigured(): boolean {
  return stravaCredentials() !== null
}

function cookieKey() {
  const credentials = stravaCredentials()
  if (!credentials) return null
  return createHash('sha256')
    .update('jsde.me Strava cookie v1\0')
    .update(process.env.SITE_SESSION_SECRET ?? '')
    .update(credentials.clientId)
    .update('\0')
    .update(credentials.clientSecret)
    .digest()
}

function cookieOptions(kind: CookieKind) {
  const secure = stravaSiteOrigin().startsWith('https:')
  return {
    name: `${secure ? '__Host-' : ''}strava-${kind}`,
    secure,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
  }
}

function now() {
  return Math.floor(Date.now() / 1000)
}

function writeCookie(
  response: NextResponse,
  kind: CookieKind,
  payload: CookiePayload,
) {
  const key = cookieKey()
  if (!key) return

  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(Buffer.from(kind))
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ])
  const value = Buffer.concat([iv, cipher.getAuthTag(), ciphertext])
  response.cookies.set({
    ...cookieOptions(kind),
    value: value.toString('base64url'),
    expires: new Date(payload.expiresAt * 1000),
  })
}

async function readCookie(kind: CookieKind) {
  const key = cookieKey()
  if (!key) return null
  const cookie = (await cookies()).get(cookieOptions(kind).name)?.value
  if (!cookie) return null

  try {
    const payload = Buffer.from(cookie, 'base64url')
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      payload.subarray(0, 12),
    )
    decipher.setAAD(Buffer.from(kind))
    decipher.setAuthTag(payload.subarray(12, 28))
    const data = Buffer.concat([
      decipher.update(payload.subarray(28)),
      decipher.final(),
    ])
    const { value, expiresAt } = JSON.parse(
      data.toString('utf8'),
    ) as CookiePayload
    if (
      typeof value === 'string' &&
      Number.isSafeInteger(expiresAt) &&
      expiresAt > now()
    ) {
      return value
    }
  } catch {
    // Invalid cookies are treated as absent.
  }
  return null
}

export function clearStravaCookie(response: NextResponse, kind: CookieKind) {
  response.cookies.set({ ...cookieOptions(kind), value: '', maxAge: 0 })
}

export function createStravaState() {
  return randomBytes(32).toString('base64url')
}

export function setStravaState(response: NextResponse, state: string) {
  writeCookie(response, 'state', {
    value: state,
    expiresAt: now() + stateLifetime,
  })
}

export async function hasValidStravaState(state: string | null) {
  if (!state || !/^[A-Za-z0-9_-]{43}$/.test(state)) return false
  const saved = await readCookie('state')
  return (
    saved !== null &&
    saved.length === state.length &&
    timingSafeEqual(Buffer.from(saved), Buffer.from(state))
  )
}

export function setOwnerAccessToken(
  response: NextResponse,
  accessToken: string,
  expiresAt: number,
) {
  writeCookie(response, 'session', { value: accessToken, expiresAt })
}

export async function getOwnerAccessToken(): Promise<string | null> {
  return readCookie('session')
}

export const stravaResponseHeaders = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
}

export function redirectToTraining(error?: TrainingError) {
  const url = new URL('/training', stravaSiteOrigin())
  if (error) url.searchParams.set('error', error)
  return NextResponse.redirect(url, {
    status: 303,
    headers: stravaResponseHeaders,
  })
}

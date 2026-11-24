import type { NextRequest } from 'next/server'
import { stravaAthleteId } from '@/lib/me'
import {
  clearStravaCookie,
  hasValidStravaState,
  redirectToTraining,
  setOwnerAccessToken,
  stravaCredentials,
} from '@/lib/strava-session'

function hasActivityReadOnly(value: unknown) {
  if (typeof value !== 'string') return false
  const scopes = value.trim().split(/[,\s]+/)
  return (
    scopes.includes('activity:read') &&
    scopes.every((scope) => scope === 'activity:read' || scope === 'read')
  )
}

export async function GET(request: NextRequest) {
  const credentials = stravaCredentials()
  if (!credentials) return redirectToTraining('unavailable')

  const params = request.nextUrl.searchParams
  if (!(await hasValidStravaState(params.get('state')))) {
    return redirectToTraining('invalid-state')
  }

  function finish(error?: Parameters<typeof redirectToTraining>[0]) {
    const response = redirectToTraining(error)
    clearStravaCookie(response, 'state')
    return response
  }

  const code = params.get('code')
  if (params.has('error') || !code) return finish('denied')

  if (!hasActivityReadOnly(params.get('scope'))) {
    return finish('insufficient-scope')
  }

  try {
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    })

    if (!tokenResponse.ok) return finish('exchange-failed')
    const token = (await tokenResponse.json()) as {
      athlete?: { id?: number }
      access_token?: string
      expires_at?: number
      scope?: string
    }

    if (token.athlete?.id !== stravaAthleteId) return finish('wrong-athlete')
    if (token.scope !== undefined && !hasActivityReadOnly(token.scope)) {
      return finish('insufficient-scope')
    }

    const { access_token: accessToken, expires_at: expiresAt } = token
    if (
      typeof accessToken !== 'string' ||
      !accessToken ||
      typeof expiresAt !== 'number' ||
      !Number.isSafeInteger(expiresAt) ||
      expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return finish('exchange-failed')
    }

    const response = finish()
    setOwnerAccessToken(response, accessToken, expiresAt)
    return response
  } catch {
    return finish('exchange-failed')
  }
}

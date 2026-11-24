import { NextResponse } from 'next/server'
import {
  createStravaState,
  redirectToTraining,
  setStravaState,
  stravaCredentials,
  stravaResponseHeaders,
  stravaSiteOrigin,
} from '@/lib/strava-session'

export function GET() {
  const credentials = stravaCredentials()
  if (!credentials) return redirectToTraining('unavailable')

  const state = createStravaState()
  const url = new URL('https://www.strava.com/oauth/authorize')
  url.search = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: new URL('/api/strava/callback', stravaSiteOrigin()).href,
    response_type: 'code',
    approval_prompt: 'force',
    scope: 'activity:read',
    state,
  }).toString()

  const response = NextResponse.redirect(url, {
    status: 303,
    headers: stravaResponseHeaders,
  })
  setStravaState(response, state)
  return response
}

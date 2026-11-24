import {
  clearStravaCookie,
  redirectToTraining,
  stravaResponseHeaders,
  stravaSiteOrigin,
} from '@/lib/strava-session'

export function POST(request: Request) {
  if (request.headers.get('origin') !== stravaSiteOrigin()) {
    return new Response(null, { status: 403, headers: stravaResponseHeaders })
  }

  const response = redirectToTraining()
  clearStravaCookie(response, 'state')
  clearStravaCookie(response, 'session')
  return response
}

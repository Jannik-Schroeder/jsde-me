import {
  getOwnerAccessToken,
  stravaResponseHeaders,
  stravaSiteOrigin,
} from '@/lib/strava-session'
import { disconnectWhoop } from '@/lib/whoop-connection'

export async function POST(request: Request) {
  if (
    request.headers.get('origin') !== stravaSiteOrigin() ||
    !(await getOwnerAccessToken())
  ) {
    return new Response(null, { status: 403, headers: stravaResponseHeaders })
  }
  return disconnectWhoop()
}

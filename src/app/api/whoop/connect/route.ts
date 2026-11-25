import {
  getOwnerAccessToken,
  stravaResponseHeaders,
  stravaSiteOrigin,
} from '@/lib/strava-session'
import { beginWhoopConnection } from '@/lib/whoop-connection'

export async function POST(request: Request) {
  const ownerToken =
    request.headers.get('origin') === stravaSiteOrigin() &&
    (await getOwnerAccessToken())
  if (!ownerToken) {
    return new Response(null, { status: 403, headers: stravaResponseHeaders })
  }
  return beginWhoopConnection(ownerToken)
}

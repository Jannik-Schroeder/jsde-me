import {
  getOwnerAccessToken,
  stravaResponseHeaders,
} from '@/lib/strava-session'
import { finishWhoopConnection } from '@/lib/whoop-connection'

export async function GET(request: Request) {
  const ownerToken = await getOwnerAccessToken()
  if (!ownerToken) {
    return new Response(null, { status: 403, headers: stravaResponseHeaders })
  }
  return finishWhoopConnection(new URL(request.url).searchParams, ownerToken)
}

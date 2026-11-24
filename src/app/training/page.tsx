import { connection } from 'next/server'
import { me, stravaUrl } from '@/lib/me'
import { pageMetadata } from '@/lib/page-metadata'
import { getOwnerAccessToken, isStravaConfigured } from '@/lib/strava-session'
import { getStravaActivities } from '@/lib/strava-activities'
import { TrainingRefresh } from './TrainingRefresh'
import styles from './training.module.css'

export const metadata = {
  ...pageMetadata({
    title: 'Training log',
    description: 'Jannik’s personal training log.',
    canonical: 'https://jsde.me/training',
  }),
  robots: { index: false, follow: false },
  referrer: 'same-origin' as const,
}

const signInMessages: Record<string, string> = {
  'invalid-state': 'Your sign-in link expired. Start a new sign-in below.',
  denied: 'Sign-in was cancelled.',
  'insufficient-scope': 'Allow access to activity data to open the log.',
  'wrong-athlete': 'This training log is available to Jannik’s account.',
  'exchange-failed':
    'Strava could not finish signing you in. Please try again.',
  unavailable: 'The Strava connection is unavailable.',
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})
const distanceFormat = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 2,
})

function movingTime(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function SignIn() {
  return (
    <div className={styles.signIn}>
      <p>
        Sign in with Jannik’s Strava account to read recent activities marked
        “Everyone”. Only the signed-in owner can see the log.
      </p>
      <a className="primary-action" href="/api/strava/connect">
        Sign in with Strava <span aria-hidden="true">↗</span>
      </a>
      <details>
        <summary>How the connection works</summary>
        <p>
          Each time the log loads, jsde.me reads activities from Strava and
          shows the day, sport, distance and moving time. Your browser keeps an
          encrypted sign-in cookie until the access token expires. Signing out
          clears it. The site keeps no training history.
        </p>
        <p>
          You can{' '}
          <a href="https://www.strava.com/settings/apps">
            revoke access on Strava
          </a>{' '}
          or <a href={`mailto:${me.email}`}>contact Jannik</a> about your data.
        </p>
      </details>
    </div>
  )
}

export default async function Training({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  await connection()
  const configured = isStravaConfigured()
  const token = configured ? await getOwnerAccessToken() : null
  const feed = token ? await getStravaActivities(token) : null
  const { error } = await searchParams
  const signInError =
    typeof error === 'string' && Object.hasOwn(signInMessages, error)
      ? signInMessages[error]
      : null

  return (
    <main className={`hub-wrap ${styles.page}`}>
      <header className={styles.header}>
        <h1 className="section-display">Training log</h1>
        <a className="paper-link" href={stravaUrl}>
          Strava profile <span aria-hidden="true">↗</span>
        </a>
      </header>
      {!configured && (
        <p>
          The training log is waiting for Jannik to connect his Strava account.
        </p>
      )}
      {configured && (!token || feed?.status === 'expired') && (
        <>
          {feed?.status === 'expired' ? (
            <p>Your session expired. Sign in again to update the log.</p>
          ) : (
            signInError && <p>{signInError}</p>
          )}
          <SignIn />
        </>
      )}
      {feed?.status === 'ready' && (
        <>
          <p>Your latest activities marked “Everyone” on Strava.</p>
          {feed.activities.length === 0 ? (
            <p>No matching activities in your recent training.</p>
          ) : (
            <ol role="list" className={styles.activities}>
              {feed.activities.map((activity) => (
                <li key={activity.id}>
                  <div>
                    {activity.day && (
                      <time dateTime={activity.day}>
                        {dateFormat.format(new Date(activity.day))}
                      </time>
                    )}
                    <h2>
                      {activity.sportType.replace(/([a-z])([A-Z])/g, '$1 $2')}
                    </h2>
                  </div>
                  <dl>
                    <div>
                      <dt>Distance</dt>
                      <dd>
                        {distanceFormat.format(activity.distanceMeters / 1000)}{' '}
                        km
                      </dd>
                    </div>
                    <div>
                      <dt>Moving time</dt>
                      <dd>{movingTime(activity.movingSeconds)}</dd>
                    </div>
                  </dl>
                  <a href={`https://www.strava.com/activities/${activity.id}`}>
                    View on Strava
                  </a>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
      {feed?.status === 'limited' && (
        <p>
          Strava’s request limit has been reached. The log will try again in 15
          minutes.
        </p>
      )}
      {feed?.status === 'unavailable' && (
        <p>
          Strava could not load your activities. The log will try again in five
          minutes.
        </p>
      )}
      {token && (
        <div className={styles.controls}>
          {feed?.status !== 'expired' && (
            <TrainingRefresh
              intervalMinutes={feed?.status === 'limited' ? 15 : 5}
            />
          )}
          <form action="/api/strava/logout" method="post">
            <button type="submit">Sign out</button>
          </form>
        </div>
      )}
    </main>
  )
}

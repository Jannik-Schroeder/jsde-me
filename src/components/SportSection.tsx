import { stravaUrl } from '@/lib/me'
import { getWhoopSport, type WhoopSport } from '@/lib/whoop-sport'
import { RefreshWhileVisible } from './RefreshWhileVisible'
import styles from './sport-section.module.css'

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})
const distanceFormat = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 2,
})

function dateLabel(day: string) {
  return <time dateTime={day}>{dateFormat.format(new Date(day))}</time>
}

function distance(metres: number | null) {
  return metres === null
    ? 'Unavailable'
    : `${distanceFormat.format(metres / 1000)} km`
}

function elapsed(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function SportNumbers({
  sport,
}: {
  sport: Extract<WhoopSport, { status: 'ready' }>
}) {
  const { last7Days, recentRuns, today } = sport
  return (
    <>
      <div className={styles.summary}>
        <div>
          <h3>Last 7 days</h3>
          {last7Days ? (
            <dl className={styles.week}>
              <div>
                <dt>Runs</dt>
                <dd>{last7Days.runCount}</dd>
              </div>
              <div>
                <dt>Distance</dt>
                <dd>{distance(last7Days.distanceMeters)}</dd>
              </div>
              <div>
                <dt>Running time</dt>
                <dd>{elapsed(last7Days.elapsedSeconds)}</dd>
              </div>
            </dl>
          ) : (
            <p>The weekly totals are unavailable.</p>
          )}
        </div>
        <div>
          <h3>
            WHOOP <span>· {dateLabel(today.day)}</span>
          </h3>
          <dl className={styles.scores}>
            <div>
              <dt>Day strain</dt>
              <dd>
                {today.strain === null
                  ? 'No score'
                  : `${today.strain.toFixed(1)} / 21`}
              </dd>
            </div>
            <div>
              <dt>Recovery</dt>
              <dd>
                {today.recoveryPercent === null
                  ? 'No score'
                  : `${Math.round(today.recoveryPercent)}%`}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      {recentRuns && recentRuns.length > 0 ? (
        <table className={styles.runs}>
          <caption>Recent runs</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Distance</th>
              <th scope="col">Elapsed time</th>
            </tr>
          </thead>
          <tbody>
            {recentRuns.map((run, index) => (
              <tr key={`${run.day}-${index}`}>
                <th scope="row">{dateLabel(run.day)}</th>
                <td>{distance(run.distanceMeters)}</td>
                <td>{elapsed(run.elapsedSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.status}>
          {recentRuns
            ? 'No recent runs recorded on WHOOP.'
            : 'Recent runs are temporarily unavailable.'}
        </p>
      )}
    </>
  )
}

export function SportPanel({ sport }: { sport?: WhoopSport }) {
  return (
    <section
      className={styles.section}
      id="training"
      aria-labelledby="home-training"
    >
      <div className="hub-wrap">
        <div className={styles.heading}>
          <div>
            <h2 id="home-training" className="section-display">
              Training log
            </h2>
            <p>I plan my runs with Runna and track my training with WHOOP.</p>
          </div>
          <a className="paper-link" href={stravaUrl}>
            My Strava profile <span aria-hidden="true">↗</span>
          </a>
        </div>
        {sport?.status === 'ready' && <SportNumbers sport={sport} />}
        {sport?.status === 'unavailable' && (
          <p className={styles.status}>
            The latest WHOOP data is temporarily unavailable.
          </p>
        )}
      </div>
    </section>
  )
}

export async function SportSection() {
  const sport = await getWhoopSport()
  return (
    <>
      <SportPanel sport={sport} />
      <RefreshWhileVisible intervalMinutes={5} />
    </>
  )
}

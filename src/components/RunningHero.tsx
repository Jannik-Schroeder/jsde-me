import type { CSSProperties, ReactNode } from 'react'
import { LabClockStrip } from './LabClockStrip'
import { LabScene } from './LabScene'
import { formatKilometres, type WhoopSport } from '@/lib/whoop-sport'

type RunningWeek = Extract<WhoopSport, { status: 'ready' }>['last7Days']

export function RunningHero({
  week,
  contributions,
  initialTime,
  publishedDates,
  children,
}: {
  week: RunningWeek
  contributions: number | null
  initialTime: number
  publishedDates: readonly string[]
  children: ReactNode
}) {
  const km =
    week?.distanceMeters == null ? null : formatKilometres(week.distanceMeters)
  const count = contributions?.toLocaleString('en-US') ?? null
  const digits = Math.max((km?.length ?? 1) + 1.5, count?.length ?? 1)
  return (
    <section className="hero" aria-labelledby="home-title">
      <div className="hub-wrap">
        <div className="hero-main">
          <div className="hero-copy">
            <h1 id="home-title">
              Running &amp;
              <br />
              building.
            </h1>
            <dl
              className="hero-metrics"
              aria-label="Running and GitHub activity"
              style={{ '--metric-digits': digits } as CSSProperties}
            >
              <div>
                <dt><a href="#training">Running</a></dt>
                <dd className="hero-distance" data-metric="running">
                  {km ?? '—'} <span>km</span>
                </dd>
                <dd className="hero-caption">
                  {week && km !== null
                    ? `Last 7 days · ${week.runCount} ${week.runCount === 1 ? 'run' : 'runs'}`
                    : 'WHOOP unavailable'}
                </dd>
              </div>
              <div>
                <dt><a href="https://github.com/Jannik-Schroeder">Contributions</a></dt>
                <dd className="hero-distance" data-metric="contributions">{count ?? '—'}</dd>
                <dd className="hero-caption">
                  {count !== null ? 'Today · GitHub' : 'GitHub unavailable'}
                </dd>
              </div>
            </dl>
          </div>
          <div className="hero-vignette">
            <LabScene />
          </div>
        </div>
        {children}
        <div className="hero-stats">
          <LabClockStrip
            initialTime={initialTime}
            publishedDates={publishedDates}
          />
        </div>
      </div>
    </section>
  )
}

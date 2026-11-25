import type { CSSProperties, ReactNode } from 'react'
import { LabClockStrip } from './LabClockStrip'
import { LabScene } from './LabScene'
import { formatKilometres, type WhoopSport } from '@/lib/whoop-sport'

type RunningWeek = Extract<WhoopSport, { status: 'ready' }>['last7Days']

export function RunningHero({
  week,
  initialTime,
  publishedDates,
  children,
}: {
  week: RunningWeek
  initialTime: number
  publishedDates: readonly string[]
  children: ReactNode
}) {
  const km =
    week?.distanceMeters == null ? null : formatKilometres(week.distanceMeters)
  return (
    <section className="hero" aria-labelledby="home-title">
      <div className="hub-wrap">
        <div className="hero-main">
          <div className="hero-copy">
            <h1 id="home-title">
              How far did
              <br />
              Jannik run?
            </h1>
            <p
              className="hero-distance"
              style={{ '--digits': (km?.length ?? 1) + 1.8 } as CSSProperties}
            >
              {km ?? '—'} <span>km</span>
            </p>
          </div>
          <div className="hero-vignette">
            <LabScene />
          </div>
        </div>
        <p className="hero-caption">
          <strong>Last 7 days.</strong>{' '}
          {week && km !== null
            ? `${week.runCount} ${week.runCount === 1 ? 'run' : 'runs'} recorded on WHOOP.`
            : 'Distance unavailable from WHOOP.'}
        </p>
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

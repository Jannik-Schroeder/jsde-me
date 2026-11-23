import { Fragment, useMemo } from 'react'
import Link from 'next/link'
import styles from './lab-hero.module.css'

const timeZone = 'Europe/Berlin'
const paderbornDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const units = ['hrs', 'min', 'sec']
const calendarLength = 28
const dayInMs = 86_400_000

function LocalTime({ now, time }: { now: Date; time: string }) {
  return (
    <time className={styles.clock} dateTime={now.toISOString()} aria-live="off">
      <span className="sr-only">{time}</span>
      <span className={styles.clockDisplay} aria-hidden="true">
        {time.split(':').map((digits, index) => (
          <Fragment key={units[index]}>
            {index > 0 && <span className={styles.clockSeparator}>:</span>}
            <span className={styles.clockGroup}>
              <span className={styles.clockDigits}>
                <span>{digits[0]}</span>
                <span>{digits[1]}</span>
              </span>
              <span className={styles.clockUnit}>{units[index]}</span>
            </span>
          </Fragment>
        ))}
      </span>
    </time>
  )
}

function FieldNoteCalendar({
  today,
  publishedDates,
}: {
  today: string
  publishedDates: readonly string[]
}) {
  const days = useMemo(() => {
    const publications = new Map<string, number>()
    for (const date of publishedDates) {
      publications.set(date, (publications.get(date) ?? 0) + 1)
    }

    // Use UTC only for date arithmetic once the current Berlin date is known.
    const end = Date.parse(today + 'T00:00:00Z')
    return Array.from({ length: calendarLength }, (_, index) => {
      const date = new Date(end - (calendarLength - 1 - index) * dayInMs)
        .toISOString()
        .slice(0, 10)
      return { date, count: publications.get(date) ?? 0 }
    })
  }, [publishedDates, today])

  const count = days.reduce((total, day) => total + day.count, 0)
  const summary = `${count} field ${count === 1 ? 'note' : 'notes'} published over the last ${calendarLength} days, Paderborn time`

  return (
    <span className={styles.activity} role="img" aria-label={summary}>
      {days.map(({ date, count }) => (
        <span
          key={date}
          data-published={count > 0}
          title={`${date} · ${count} published`}
        />
      ))}
    </span>
  )
}

export function LabClockStrip({
  now,
  time,
  publishedDates,
}: {
  now: Date
  time: string
  publishedDates: readonly string[]
}) {
  return (
    <dl className={styles.stats} aria-label="Homelab overview">
      <div>
        <dt>Local time in Paderborn</dt>
        <dd>
          <LocalTime now={now} time={time} />
        </dd>
      </div>
      <div>
        <dt>Published field notes</dt>
        <dd className={styles.noteCount}>
          <Link href="/articles">{publishedDates.length}</Link>
          <FieldNoteCalendar
            today={paderbornDate.format(now)}
            publishedDates={publishedDates}
          />
        </dd>
      </div>
      <div>
        <dt>Lab documented since</dt>
        <dd>
          <Link href="/articles/first-steps-into-new-homenetwork">2023</Link>
        </dd>
      </div>
    </dl>
  )
}

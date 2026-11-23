'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import styles from './lab-hero.module.css'

const timeZone = 'Europe/Berlin'
const paderbornTime = new Intl.DateTimeFormat('en-GB', {
  timeZone,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})
const paderbornDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const units = ['hrs', 'min', 'sec']
const calendarLength = 28
const dayInMs = 86_400_000

function LocalTime({ now }: { now: Date | null }) {
  const time = now ? paderbornTime.format(now) : '––:––:––'

  return (
    <time
      className={styles.clock}
      dateTime={now?.toISOString()}
      aria-live="off"
    >
      <span className="sr-only">{now ? time : 'Time loading'}</span>
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
  today: string | null
  publishedDates: readonly string[]
}) {
  const days = useMemo(() => {
    const publications = new Map<string, number>()
    for (const date of publishedDates) {
      publications.set(date, (publications.get(date) ?? 0) + 1)
    }

    // Use UTC only for date arithmetic once the current Berlin date is known.
    const end = today ? Date.parse(today + 'T00:00:00Z') : null
    return Array.from({ length: calendarLength }, (_, index) => {
      const date =
        end === null
          ? null
          : new Date(end - (calendarLength - 1 - index) * dayInMs)
              .toISOString()
              .slice(0, 10)
      return { date, count: date ? (publications.get(date) ?? 0) : 0 }
    })
  }, [publishedDates, today])

  const count = days.reduce((total, day) => total + day.count, 0)
  const summary = `${count} field ${count === 1 ? 'note' : 'notes'} published over the last ${calendarLength} days, Paderborn time`

  return (
    <span
      className={styles.activity}
      role="img"
      aria-label={today ? summary : undefined}
      aria-hidden={today ? undefined : true}
      data-pending={!today}
    >
      {days.map(({ date, count }, index) => (
        <span
          key={date ?? index}
          data-published={count > 0}
          title={date ? `${date} · ${count} published` : undefined}
        />
      ))}
    </span>
  )
}

export function LabClockStrip({
  publishedCount,
  publishedDates,
}: {
  publishedCount: number
  publishedDates: readonly string[]
}) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    let nextTick: number
    function tick() {
      const current = new Date()
      setNow(current)
      nextTick = window.setTimeout(tick, 1000 - current.getMilliseconds())
    }
    nextTick = window.setTimeout(tick, 0)

    return () => window.clearTimeout(nextTick)
  }, [])

  return (
    <dl className={styles.stats} aria-label="Homelab overview">
      <div>
        <dt>Local time in Paderborn</dt>
        <dd>
          <LocalTime now={now} />
        </dd>
      </div>
      <div>
        <dt>Published field notes</dt>
        <dd className={styles.noteCount}>
          <Link href="/articles">{publishedCount}</Link>
          <FieldNoteCalendar
            today={now ? paderbornDate.format(now) : null}
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

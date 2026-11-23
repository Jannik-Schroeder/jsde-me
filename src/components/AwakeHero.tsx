'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { LabClockStrip } from '@/components/LabClockStrip'
import { LabScene } from '@/components/LabScene'

const localClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Berlin',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function clockGuess(hour: number) {
  if (hour < 6)
    return { answer: 'Zzz?', aside: 'The servers have the night shift.' }
  if (hour < 9)
    return { answer: 'Maybe.', aside: 'Depends who got to the coffee first.' }
  if (hour < 22)
    return {
      answer: 'Likely.',
      aside: 'Somewhere between the keyboard and a workout.',
    }
  return { answer: 'Maybe.', aside: 'There’s always that one last reboot.' }
}

export function AwakeHero({
  initialTime,
  publishedDates,
  children,
}: {
  initialTime: number
  publishedDates: readonly string[]
  children: ReactNode
}) {
  const [now, setNow] = useState(() => new Date(initialTime))
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

  const time = localClock.format(now)
  const { answer, aside } = clockGuess(Number(time.slice(0, 2)))
  return (
    <section className="hero" aria-labelledby="home-title">
      <div className="hub-wrap">
        <div className="hero-main">
          <h1 id="home-title">
            Is Jannik <br />
            Schröder <br />
            awake now?
          </h1>
          <p className="hero-answer" data-long={answer.length > 4}>
            {answer}
          </p>
          <div className="hero-vignette">
            <LabScene />
          </div>
        </div>
        <p className="awake-caption">
          <strong>Local-time guess.</strong> {aside}
        </p>
        {children}
        <div className="hero-stats">
          <LabClockStrip
            now={now}
            time={time}
            publishedDates={publishedDates}
          />
        </div>
      </div>
    </section>
  )
}

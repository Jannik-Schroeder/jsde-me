'use client'

import { useEffect, useState } from 'react'

/** The shape `GET /api/status` always answers with. Every value is nullable;
 *  a null means the item is left out entirely, never a dash. */
interface Status {
  restingHeartRate: number | null
  steps: number | null
  sleepMinutes: number | null
  commits: number | null
  codingMinutes: number | null
  updatedAt: string
}

interface Item {
  key: string
  icon: React.ReactNode
  value: number
  format: (n: number) => string
  /** Rendered dim after the value, e.g. the unit of a heart rate. */
  suffix?: string
  label: string
  title: string
}

const COUNT_UP_MS = 500

/** Shared frame for the four inline icons: Lucide-plain, no fills. */
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-fg-faint mt-[3px] size-[18px] flex-none"
    >
      {children}
    </svg>
  )
}

function HeartIcon() {
  return (
    <Icon>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </Icon>
  )
}

function MoonIcon() {
  return (
    <Icon>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </Icon>
  )
}

function FootprintsIcon() {
  return (
    <Icon>
      <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
      <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />
      <path d="M16 17h4" />
      <path d="M4 13h4" />
    </Icon>
  )
}

function CodeIcon() {
  return (
    <Icon>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </Icon>
  )
}

function CommitIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M3 12h6" />
      <path d="M15 12h6" />
    </Icon>
  )
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function grouped(n: number): string {
  return n.toLocaleString('en-US')
}

/** 432 → "7h 12m", 45 → "45m", 420 → "7h". */
function duration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function ago(updatedAt: string, now: number): string | null {
  const then = Date.parse(updatedAt)
  if (Number.isNaN(then)) return null
  const minutes = Math.floor((now - then) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

/** Resting heart rate, sleep, steps, coding, contributions — in that order. */
function itemsOf(status: Status): Item[] {
  const out: Item[] = []
  const hr = num(status.restingHeartRate)
  const sleep = num(status.sleepMinutes)
  const steps = num(status.steps)
  const coding = num(status.codingMinutes)
  const commits = num(status.commits)

  if (hr !== null) {
    out.push({
      key: 'hr',
      icon: <HeartIcon />,
      value: hr,
      format: grouped,
      suffix: 'bpm',
      label: 'resting hr',
      title: `Resting heart rate: ${hr} bpm`,
    })
  }
  if (sleep !== null) {
    out.push({
      key: 'sleep',
      icon: <MoonIcon />,
      value: sleep,
      format: duration,
      label: 'slept',
      title: `Sleep last night: ${duration(sleep)}`,
    })
  }
  if (steps !== null) {
    out.push({
      key: 'steps',
      icon: <FootprintsIcon />,
      value: steps,
      format: grouped,
      label: 'steps',
      title: `Steps today: ${grouped(steps)}`,
    })
  }
  if (coding !== null) {
    out.push({
      key: 'coding',
      icon: <CodeIcon />,
      value: coding,
      format: duration,
      label: 'coded',
      title: `Coding time today: ${duration(coding)}`,
    })
  }
  if (commits !== null) {
    out.push({
      key: 'commits',
      icon: <CommitIcon />,
      value: commits,
      format: grouped,
      label: 'contributions',
      title: `Commits today across GitHub and Forgejo: ${commits}`,
    })
  }
  return out
}

/**
 * The "live today" strip on the page, between the terminal launcher and the
 * writing. Fetched after mount and never blocking the page: if the request
 * fails, or every value is null, this renders nothing at all — header
 * included — so it leaves no gap behind.
 */
export function StatusLine() {
  const [status, setStatus] = useState<Status | null>(null)
  const [progress, setProgress] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch('/api/status', { cache: 'no-store' }).catch(
        () => null,
      )
      if (cancelled || !res?.ok) return
      const body = (await res.json().catch(() => null)) as Status | null
      if (!cancelled && body !== null && typeof body === 'object') {
        setStatus(body)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // The numbers count up once, from zero, when they first arrive.
  useEffect(() => {
    if (status === null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1)
      return
    }
    const started = performance.now()
    let frame = requestAnimationFrame(function step(stamp: number) {
      const linear = Math.min(1, (stamp - started) / COUNT_UP_MS)
      setProgress(1 - (1 - linear) ** 3)
      if (linear < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [status])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  if (status === null) return null

  const items = itemsOf(status)
  if (items.length === 0) return null

  const stamp = ago(status.updatedAt, now)

  return (
    <section aria-label="Live today" className="shrink-0">
      <p className="text-fg-faint rise flex items-center gap-2 font-mono text-[11px]">
        <span aria-hidden="true" className="live-dot text-fg-dim">
          ●
        </span>
        live today
        {stamp !== null && <span className="ml-auto">updated {stamp}</span>}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-5">
        {items.map((item, index) => (
          <div
            key={item.key}
            title={item.title}
            className="rise flex items-start gap-3"
            style={{ animationDelay: `${70 + index * 40}ms` }}
          >
            {item.icon}
            <div>
              <p className="text-fg font-mono text-[24px] leading-none whitespace-nowrap tabular-nums">
                {item.format(Math.round(item.value * progress))}
                {item.suffix !== undefined && (
                  <span className="text-fg-faint ml-1 text-[11px] font-normal">
                    {item.suffix}
                  </span>
                )}
              </p>
              <p className="text-fg-faint mt-2 font-mono text-[11px] whitespace-nowrap lowercase">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

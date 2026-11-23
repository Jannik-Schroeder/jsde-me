'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { MeRole } from '@/lib/me'

export function CareerRail({ roles }: { roles: MeRole[] }) {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const outer = section.current
    const panel = stage.current
    const list = track.current
    if (!outer || !panel || !list) return
    const motion = window.matchMedia(
      '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
    )
    let distance = 0
    function sync() {
      if (distance && outer && list)
        list.scrollLeft = Math.min(
          distance,
          Math.max(0, 56 - outer.getBoundingClientRect().top),
        )
    }
    function measure() {
      if (!outer || !panel || !list) return
      distance =
        motion.matches && panel.offsetHeight < innerHeight - 56
          ? Math.max(0, list.scrollWidth - list.clientWidth)
          : 0
      outer.style.setProperty('--career-travel', distance + 'px')
      outer.toggleAttribute('data-pinned', distance > 0)
      sync()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(panel)
    motion.addEventListener('change', measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', sync, { passive: true })
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', sync)
      motion.removeEventListener('change', measure)
    }
  }, [])

  function move(direction: number) {
    const el = track.current
    const outer = section.current
    if (!el || !outer) return
    const step = direction * (el.firstElementChild?.clientWidth ?? 280)
    if (outer.hasAttribute('data-pinned')) {
      const target = Math.min(
        el.scrollWidth - el.clientWidth,
        Math.max(0, el.scrollLeft + step),
      )
      window.scrollTo({
        top: window.scrollY + outer.getBoundingClientRect().top - 56 + target,
        behavior: 'smooth',
      })
    } else {
      el.scrollBy({
        left: step,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
      })
    }
  }
  return (
    <section
      ref={section}
      className="career-section"
      aria-labelledby="home-career"
    >
      <div className="career-stage" ref={stage}>
        <div className="hub-wrap">
          <h2 id="home-career" className="section-display">
            The career
          </h2>
          <div className="rail-intro">
            <p>
              From my first apprenticeship to running a business alongside my
              day job.
            </p>
            <div className="rail-controls">
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Earlier career milestones"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Later career milestones"
              >
                →
              </button>
            </div>
          </div>
        </div>
        <ol
          ref={track}
          className="career-rail"
          aria-label="Career milestones"
          tabIndex={0}
        >
          {roles.map((role) => (
            <li key={role.company + role.start}>
              <span>{role.start}</span>
              <strong>
                {role.company === 'Self-employed'
                  ? 'Started my own business'
                  : role.title}
              </strong>
              <small>
                {role.company === 'Self-employed' ? role.title : role.company}
              </small>
            </li>
          ))}
        </ol>
        <div className="hub-wrap">
          <Link className="paper-link" href="/profile#career">
            Full career timeline <b aria-hidden="true">→</b>
          </Link>
        </div>
      </div>
    </section>
  )
}

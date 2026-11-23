'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { MeRole } from '@/lib/me'

export function CareerRail({ roles }: { roles: MeRole[] }) {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLOListElement>(null)
  const previous = useRef<HTMLButtonElement>(null)
  const next = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const outer = section.current
    const panel = stage.current
    const list = track.current
    if (!outer || !panel || !list) return

    const motion = window.matchMedia(
      '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
    )
    let distance = 0
    let stickyTop = 0
    let lastPosition = -1

    function sync() {
      if (!outer || !list || !distance) return
      const travelled = stickyTop - outer.getBoundingClientRect().top
      const position = Math.round(Math.min(distance, Math.max(0, travelled)))
      if (position === lastPosition) return
      lastPosition = position
      list.scrollLeft = position
      previous.current?.setAttribute('aria-disabled', String(position <= 1))
      next.current?.setAttribute(
        'aria-disabled',
        String(position >= distance - 1),
      )
    }

    function measure() {
      if (!outer || !panel || !list) return

      // Measure the horizontal layout, then keep it only if the entire stage fits.
      outer.toggleAttribute('data-pinned', motion.matches)
      stickyTop = motion.matches
        ? Number.parseFloat(getComputedStyle(panel).top)
        : 0
      const stageFits =
        panel.offsetHeight + stickyTop + 24 <= window.innerHeight
      distance =
        motion.matches && stageFits ? list.scrollWidth - list.clientWidth : 0
      outer.toggleAttribute('data-pinned', distance > 0)
      outer.style.setProperty('--career-travel', distance + 'px')
      lastPosition = -1
      if (distance > 0) {
        list.tabIndex = 0
        sync()
      } else {
        list.removeAttribute('tabindex')
        list.scrollLeft = 0
      }
    }

    const observer = new ResizeObserver(measure)
    observer.observe(panel)
    observer.observe(list)
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
    const panel = stage.current
    if (!el || !outer || !panel || !outer.hasAttribute('data-pinned')) return

    const step = el.firstElementChild?.getBoundingClientRect().width ?? 0
    const distance = el.scrollWidth - el.clientWidth
    const target = Math.min(
      distance,
      Math.max(0, el.scrollLeft + direction * step),
    )
    if (Math.abs(target - el.scrollLeft) < 1) return

    const stickyTop = Number.parseFloat(getComputedStyle(panel).top)
    window.scrollTo({
      top:
        window.scrollY + outer.getBoundingClientRect().top - stickyTop + target,
      behavior: 'smooth',
    })
  }

  return (
    <section
      id="career"
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
                ref={previous}
                type="button"
                onClick={() => move(-1)}
                aria-label="Earlier career milestones"
                aria-controls="career-milestones"
              >
                ←
              </button>
              <button
                ref={next}
                type="button"
                onClick={() => move(1)}
                aria-label="Later career milestones"
                aria-controls="career-milestones"
              >
                →
              </button>
            </div>
          </div>
        </div>
        <ol
          id="career-milestones"
          ref={track}
          className="career-rail"
          aria-label="Career milestones"
          onKeyDown={(event) => {
            if (
              !section.current?.hasAttribute('data-pinned') ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey ||
              event.shiftKey ||
              (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
            )
              return

            event.preventDefault()
            move(event.key === 'ArrowLeft' ? -1 : 1)
          }}
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

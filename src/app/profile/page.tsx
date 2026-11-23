import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { connection } from 'next/server'

import { linkEvent } from '@/lib/link-events'
import { me } from '@/lib/me'

import portrait from './portrait.webp'
import styles from './profile.module.css'

export const metadata: Metadata = {
  alternates: { canonical: 'https://jsde.me/profile' },
  title: 'Profile',
  description: me.short,
}

// Month coordinates drive the visual spans. The CV text comes directly from me.
function monthIndex(date: string) {
  const parsed = new Date(`${date} 01 UTC`)
  return parsed.getUTCFullYear() * 12 + parsed.getUTCMonth()
}

export default async function Profile() {
  await connection()
  const currentMonth = new Date()
  const lastMonth =
    currentMonth.getUTCFullYear() * 12 + currentMonth.getUTCMonth()
  const firstYear = Math.floor(
    Math.min(...me.roles.map((role) => monthIndex(role.start))) / 12,
  )
  const firstMonth = firstYear * 12
  const timelineMonths = lastMonth - firstMonth + 1
  const years = Array.from(
    { length: currentMonth.getUTCFullYear() - firstYear + 1 },
    (_, i) => firstYear + i,
  )

  return (
    <main className={`hub-wrap ${styles.page}`}>
      <header className={styles.hero}>
        <div className={styles.intro}>
          <p className={styles.location}>{me.location}</p>
          <h1>{me.name}</h1>
          <p className={styles.bio}>{me.short}</p>
          <a href="#career" className={styles.careerLink}>
            Career timeline <span aria-hidden="true">↓</span>
          </a>
          <nav aria-label="Contact and social links">
            <ul className={styles.links} role="list">
              {me.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} {...linkEvent(link.href)}>
                    {link.label}{' '}
                    <span aria-hidden="true">
                      {link.href.startsWith('/') ? '→' : '↗'}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className={styles.portrait}>
          <Image
            src={portrait}
            alt="Jannik Schröder standing beside a lake."
            sizes="(max-width: 700px) 100vw, (max-width: 1240px) 36vw, 430px"
            preload
          />
        </div>
      </header>

      <section
        id="career"
        aria-labelledby="career-title"
        className={styles.section}
      >
        <div>
          <h2 id="career-title">Career timeline</h2>
          <p className={styles.careerIntro}>
            My side business runs alongside my cloud and virtualization role.
          </p>
        </div>
        <div className={styles.timeline}>
          <div className={styles.yearAxis} aria-hidden="true">
            {years.map((year) => (
              <span
                key={year}
                style={{
                  insetInlineStart: `${((year * 12 - firstMonth) * 100) / timelineMonths}%`,
                }}
              >
                {year}
              </span>
            ))}
          </div>
          <ol className={styles.roles} role="list">
            {me.roles.map((role) => {
              const independent = role.company === 'Self-employed'
              const start = monthIndex(role.start)
              const end =
                role.end === 'Present' ? lastMonth : monthIndex(role.end)

              return (
                <li
                  key={`${role.company}-${role.start}`}
                  className={independent ? styles.independent : undefined}
                >
                  <div className={styles.role}>
                    <p className={styles.dates}>
                      {role.start} – {role.end}
                    </p>
                    <h3>{independent ? role.company : role.title}</h3>
                    <p>{independent ? role.title : role.company}</p>
                  </div>
                  <div className={styles.track} aria-hidden="true">
                    <span
                      className={
                        role.end === 'Present' ? styles.ongoing : undefined
                      }
                      style={{
                        insetInlineStart: `${((start - firstMonth) * 100) / timelineMonths}%`,
                        inlineSize: `${((end - start + 1) * 100) / timelineMonths}%`,
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section aria-labelledby="projects" className={styles.section}>
        <h2 id="projects">Projects</h2>
        <ul className={styles.projects} role="list">
          {me.built.map((project) => (
            <li key={project.name}>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              {project.href ? (
                <a href={project.href} {...linkEvent(project.href)}>
                  Visit {project.name} <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <Link href="/articles">
                  Read the articles <span aria-hidden="true">→</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <aside className={styles.labNote} aria-labelledby="lab-note">
        <h2 id="lab-note">From the lab</h2>
        <p>
          I went all-in on UniFi in January. Six months later, OPNsense had the
          job. At least the access points made it through the reorg.
        </p>
        <ul role="list">
          <li>
            <Link href="/articles/home-network-v2">
              The UniFi upgrade <span aria-hidden="true">↗</span>
            </Link>
          </li>
          <li>
            <Link href="/articles/home-network-v3">
              The OPNsense rebuild <span aria-hidden="true">↗</span>
            </Link>
          </li>
        </ul>
      </aside>
    </main>
  )
}

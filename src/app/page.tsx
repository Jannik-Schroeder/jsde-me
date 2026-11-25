import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { cache } from 'react'
import { SportSection } from '@/components/SportSection'
import { getWhoopSport } from '@/lib/whoop-sport'
import { fetchCommitsToday } from '@/lib/status-sources'
import { RackViewer } from '@/components/RackViewer'
import { StatusLine } from '@/components/StatusLine'
import { RunningHero } from '@/components/RunningHero'
import { ArticleArchive } from '@/components/archive/ArticleArchive'
import { getArticleTopics } from '@/components/archive/topics'
import { CareerRail } from '@/components/CareerRail'
import { NotesTicker } from '@/components/NotesTicker'
import { getAllArticles } from '@/lib/articles'
import { me } from '@/lib/me'

export const metadata: Metadata = {
  alternates: { canonical: 'https://jsde.me/' },
  description: me.short,
}

const getRequestTime = cache(async () => {
  await connection()
  return Date.now()
})

export default async function Home() {
  const initialTime = await getRequestTime()
  const [sport, contributions] = await Promise.all([getWhoopSport(), fetchCommitsToday()])
  const articles = getAllArticles()
  const notes = articles.map(({ slug, title, date, description }) => ({
    slug,
    title,
    date,
    description,
    topics: getArticleTopics(slug),
  }))
  return (
    <main>
      <RunningHero
        contributions={contributions}
        week={sport.status === 'ready' ? sport.last7Days : null}
        initialTime={initialTime}
        publishedDates={notes.map((note) => note.date)}
      >
        <p className="hero-intro">
          I’m a sysadmin in Paderborn. I write about my{' '}
          <Link href="/uses">homelab</Link> and keep a{' '}
          <a href="#training">running log</a> here.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" href="/articles">
            Read the field notes <b aria-hidden="true">→</b>
          </Link>
          <a className="paper-link" href="#career">
            Career timeline <b aria-hidden="true">→</b>
          </a>
        </div>
      </RunningHero>
      <NotesTicker
        articles={notes.slice(0, 4).map(({ slug, title }) => ({ slug, title }))}
      />
      <SportSection sport={sport} />
      <section
        className="hub-wrap field-section"
        id="field-notes"
        aria-labelledby="home-notes"
      >
        <h2 id="home-notes" className="section-display">
          Field
          <br />
          notes
        </h2>
        <ArticleArchive articles={notes} preview />
        <Link className="paper-link" href="/articles">
          All {notes.length} field notes <b aria-hidden="true">→</b>
        </Link>
      </section>
      <section
        className="home-explore"
        id="playground"
        aria-labelledby="home-tools"
      >
        <div className="hub-wrap">
          <h2 id="home-tools" className="section-display">
            The toolbox
          </h2>
          <div className="tool-list">
            <Link href="/lab" className="tool-link">
              <h3>Patch Panel</h3>
              <p>Nine services, nine ports. Can you wire the rack?</p>
              <div className="patch-preview" aria-hidden="true">
                <span>
                  SSH <i />
                </span>
                <b>?</b>
                <span>
                  <i />
                  22
                </span>
              </div>
              <strong>
                Play a round <b aria-hidden="true">↗</b>
              </strong>
            </Link>
            <Link href="/terminal" className="tool-link">
              <h3>Terminal</h3>
              <p>Ask my site assistant about a project or a piece of kit.</p>
              <div className="shell-preview" aria-hidden="true">
                <span>$</span> whoami
                <i />
              </div>
              <strong>
                Open the terminal <b aria-hidden="true">↗</b>
              </strong>
            </Link>
          </div>
        </div>
      </section>
      <CareerRail roles={[...me.roles].reverse()} />
      <section
        id="rack-archive"
        className="hub-wrap rack-section"
        aria-labelledby="home-rack"
      >
        <div>
          <h2 id="home-rack" className="section-display">
            Rack
            <br />
            archive
          </h2>
          <p>
            Two firewalls, two core switches and a stack of servers. Flip back
            to see what my rack looked like in 2023.
          </p>
          <Link className="paper-link" href="/uses">
            Explore my gear <b aria-hidden="true">→</b>
          </Link>
        </div>
        <RackViewer />
      </section>
      <div className="hub-wrap home-status">
        <StatusLine showContributions={false} />
      </div>
    </main>
  )
}

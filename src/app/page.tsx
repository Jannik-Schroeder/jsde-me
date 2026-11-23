import type { Metadata } from 'next'
import Link from 'next/link'
import { connection } from 'next/server'
import { RackViewer } from '@/components/RackViewer'
import { SectionArt } from '@/components/SectionArt'
import { StatusLine } from '@/components/StatusLine'
import { getAllArticles } from '@/lib/articles'
import { me } from '@/lib/me'
import { formatDate } from '@/lib/formatDate'

export const metadata: Metadata = {
  alternates: { canonical: 'https://jsde.me/' },
  description: me.short,
}

export default async function Home() {
  await connection()
  const articles = getAllArticles()
  const cards = [
    {
      href: '/articles',
      title: 'Field notes',
      kind: 'notes',
      label: articles.length + ' articles',
      text: 'Build logs and lessons from running my own infrastructure.',
    },
    {
      href: '/uses',
      title: 'Gear locker',
      kind: 'gear',
      label: 'Inventory',
      text: 'The hardware and software behind the builds.',
    },
    {
      href: '/lab',
      title: 'Patch Panel',
      kind: 'play',
      label: 'Mini-game',
      text: 'Match the services to their ports. Can you wire all three rounds?',
    },
  ] as const
  return (
    <main>
      <section className="hero">
        <div className="hub-wrap hero-inner">
          <div className="hero-intro">
            <div className="hero-byline">
              <span className="byline-bar" />
              Jannik Schröder <span>/</span> Sysadmin
            </div>
            <h1>
              Inside the
              <br />
              <em>homelab.</em>
            </h1>
            <p>
              I’m Jannik, a system administrator in Paderborn. I build networks,
              self-host services, and write about what happens along the way.
            </p>
            <div className="hero-actions">
              <Link href="/articles" className="primary-action">
                Read field notes
              </Link>
              <Link href="/profile#career" className="secondary-action">
                Career timeline
              </Link>
            </div>
          </div>
          <RackViewer />
        </div>
      </section>
      <div className="dispatch">
        <div className="hub-wrap dispatch-inner">
          <span className="dispatch-label">
            <span aria-hidden="true">▥</span> Latest log
          </span>
          {articles[0] && (
            <Link href={'/articles/' + articles[0].slug}>
              {articles[0].title}
            </Link>
          )}
          {articles[0] && (
            <time dateTime={articles[0].date}>
              {formatDate(articles[0].date)}
            </time>
          )}
        </div>
      </div>
      <section className="hub-wrap home-explore" aria-labelledby="explore">
        <h2 id="explore" className="section-display">
          Explore the lab<span>.</span>
        </h2>
        <div className="hub-cards">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={'hub-card card-' + card.kind}
            >
              <div className="card-picture">
                <span className="card-kicker">{card.label}</span>
                <SectionArt kind={card.kind} />
              </div>
              <div className="card-copy">
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <div className="hub-wrap home-log">
        <section aria-labelledby="recent">
          <div className="log-heading">
            <h2 id="recent" className="section-display">
              Recent writing<span>.</span>
            </h2>
            <Link href="/articles">All field notes</Link>
          </div>
          <ul>
            {articles.slice(0, 4).map((a) => (
              <li key={a.slug}>
                <time dateTime={a.date}>{formatDate(a.date)}</time>
                <Link href={'/articles/' + a.slug}>{a.title}</Link>
              </li>
            ))}
          </ul>
        </section>
        <aside className="terminal-teaser">
          <span aria-hidden="true" className="terminal-prompt">
            &gt;_
          </span>
          <h2>Ask the terminal.</h2>
          <p>
            Curious about a project or a piece of kit? Ask my site assistant.
          </p>
          <Link href="/terminal" className="secondary-action">
            Open terminal
          </Link>
        </aside>
      </div>
      <div className="hub-wrap home-status">
        <StatusLine />
      </div>
    </main>
  )
}

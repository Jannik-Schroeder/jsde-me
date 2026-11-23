'use client'

import { useState } from 'react'
import Link from 'next/link'

export function NotesTicker({
  articles,
}: {
  articles: { slug: string; title: string }[]
}) {
  const [paused, setPaused] = useState(false)
  const entry = (article: (typeof articles)[number]) => (
    <>
      <span aria-hidden="true">✦</span>
      {article.title}
    </>
  )
  return (
    <aside
      className="notes-ticker"
      aria-label="Latest field notes"
      data-paused={paused}
    >
      <span className="ticker-label">
        <i aria-hidden="true" />
        Lab feed
      </span>
      <div className="ticker-window">
        <div className="ticker-track">
          <div>
            {articles.map((a) => (
              <Link href={'/articles/' + a.slug} key={a.slug}>
                {entry(a)}
              </Link>
            ))}
          </div>
          <div aria-hidden="true" className="ticker-repeat">
            {articles.map((a) => (
              <span key={a.slug}>{entry(a)}</span>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label={paused ? 'Resume news ticker' : 'Pause news ticker'}
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? '▶' : 'Ⅱ'}
      </button>
    </aside>
  )
}

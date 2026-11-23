'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

import { type ArticleMeta } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'

import styles from './archive.module.css'

type ArchiveArticle = Omit<ArticleMeta, 'author'> & { topics: string[] }

export function ArticleArchive({ articles }: { articles: ArchiveArticle[] }) {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('')
  const searchInput = useRef<HTMLInputElement>(null)
  const topics = [
    ...new Set(articles.flatMap((article) => article.topics)),
  ].sort()
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const filtering = query.length > 0 || topic !== ''
  const matches = articles.filter((article) => {
    const searchable = [article.title, article.description, ...article.topics]
      .join(' ')
      .toLowerCase()

    return (
      (!topic || article.topics.includes(topic)) &&
      terms.every((term) => searchable.includes(term))
    )
  })

  const years = new Map<string, ArchiveArticle[]>()
  for (const article of matches) {
    const year = article.date.slice(0, 4)
    const entries = years.get(year)
    if (entries) {
      entries.push(article)
    } else {
      years.set(year, [article])
    }
  }

  function resetFilters() {
    setQuery('')
    setTopic('')
    searchInput.current?.focus()
  }

  return (
    <>
      <div
        role="search"
        aria-label="Article archive"
        className={styles.controls}
      >
        <label className={styles.search}>
          <span>Search notes</span>
          <input
            ref={searchInput}
            type="search"
            value={query}
            placeholder="Search titles, descriptions and topics"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <fieldset className={styles.filters}>
          <legend>Filter by topic</legend>
          <div className={styles.filterButtons}>
            <button
              type="button"
              aria-pressed={topic === ''}
              onClick={() => setTopic('')}
            >
              All topics
            </button>
            {topics.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={topic === name}
                onClick={() => setTopic(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.results}>
        <p role="status" aria-atomic="true">
          {filtering
            ? `${matches.length} of ${articles.length}`
            : articles.length}{' '}
          {articles.length === 1 ? 'note' : 'notes'}
        </p>
        {filtering && matches.length > 0 && (
          <button type="button" className={styles.reset} onClick={resetFilters}>
            Reset filters
          </button>
        )}
      </div>

      {matches.length === 0 && (
        <div className={styles.empty}>
          <h2>{filtering ? 'No matching notes' : 'No published notes yet'}</h2>
          {filtering && (
            <>
              <p>Try a shorter search or choose a different topic.</p>
              <button
                type="button"
                className={styles.reset}
                onClick={resetFilters}
              >
                Reset filters
              </button>
            </>
          )}
        </div>
      )}

      {[...years].map(([year, entries]) => (
        <section
          key={year}
          className={styles.year}
          aria-labelledby={`notes-${year}`}
        >
          <h2 id={`notes-${year}`}>{year}</h2>
          <ul role="list">
            {entries.map((article) => (
              <li key={article.slug} className={styles.row}>
                <time dateTime={article.date}>{formatDate(article.date)}</time>
                <div>
                  <h3>
                    <Link href={`/articles/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>
                  <p>{article.description}</p>
                </div>
                {article.topics.length > 0 && (
                  <p className={styles.topics}>{article.topics.join(' / ')}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

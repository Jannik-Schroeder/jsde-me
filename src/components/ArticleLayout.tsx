import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Prose } from '@/components/Prose'
import { isPublished, type ArticleMeta } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'

import styles from '@/components/archive/archive.module.css'

/**
 * Renders one MDX article page. Every `src/app/articles/<slug>/page.mdx`
 * default-exports `(props) => <ArticleLayout article={article} {...props} />`,
 * so `article` here is the file's own `export const article = {...}` object
 * — it does not carry a `slug` (the MDX file doesn't know its own directory
 * name), unlike the `ArticleMeta` entries in the generated index.
 */
export function ArticleLayout({
  article,
  children,
}: {
  article: Omit<ArticleMeta, 'slug'>
  children: React.ReactNode
}) {
  if (!isPublished(article.date)) {
    notFound()
  }

  return (
    <main className={`hub-wrap ${styles.reading}`}>
      <article>
        <Link href="/articles" className={styles.readingLink}>
          <span aria-hidden="true">← </span>
          Back to articles
        </Link>

        <header className={styles.readingHeader}>
          <h1>{article.title}</h1>
          <p className={styles.readingMeta}>
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            {' · '}
            {article.author}
          </p>
        </header>

        <Prose className="mt-8 sm:mt-10" data-mdx-content>
          {children}
        </Prose>

        <footer className="border-border mt-16 border-t pt-8">
          <Link href="/" className={styles.readingLink}>
            <span aria-hidden="true">← </span>
            jsde.me
          </Link>
        </footer>
      </article>
    </main>
  )
}

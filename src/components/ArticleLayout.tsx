import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Prose } from '@/components/Prose'
import { isPublished, type ArticleMeta } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'

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
    <div className="mx-auto max-w-[70ch] px-4 py-16 sm:py-24">
      <Link
        href="/articles"
        className="link text-fg-dim hover:text-fg rise inline-flex items-center gap-2 text-sm motion-safe:transition-colors"
      >
        <span aria-hidden="true">&larr;</span>
        Back to articles
      </Link>

      <article className="mt-10">
        <header className="rise">
          <h1 className="text-fg text-2xl font-semibold tracking-tight sm:text-3xl">
            {article.title}
          </h1>
          <p className="text-fg-faint mt-3 font-mono text-sm">
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            {' · '}
            {article.author}
          </p>
        </header>

        <Prose
          className="rise mt-10"
          style={{ animationDelay: '90ms' }}
          data-mdx-content
        >
          {children}
        </Prose>
      </article>

      <footer className="border-border mt-16 border-t pt-8">
        <Link
          href="/"
          className="link text-fg-dim hover:text-fg text-sm motion-safe:transition-colors"
        >
          &larr; jsde.me
        </Link>
      </footer>
    </div>
  )
}

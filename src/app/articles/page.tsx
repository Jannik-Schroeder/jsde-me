import { type Metadata } from 'next'
import Link from 'next/link'

import { type ArticleMeta, getAllArticles } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'

export const metadata: Metadata = {
  alternates: { canonical: 'https://jsde.me/articles' },
  title: 'Articles',
  description:
    'All of my long-form writing on homelab infrastructure, self-hosting and networking, collected in chronological order.',
}

function groupByYear(articles: ArticleMeta[]) {
  const groups = new Map<string, ArticleMeta[]>()
  for (const article of articles) {
    const year = article.date.slice(0, 4)
    const bucket = groups.get(year)
    if (bucket) {
      bucket.push(article)
    } else {
      groups.set(year, [article])
    }
  }
  return groups
}

function ArticleRow({ article }: { article: ArticleMeta }) {
  return (
    <li className="group py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
        <time
          dateTime={article.date}
          className="text-fg-faint group-hover:text-fg-dim order-2 shrink-0 font-mono text-xs motion-safe:transition-colors sm:order-1 sm:w-28"
        >
          {formatDate(article.date)}
        </time>
        <Link
          href={`/articles/${article.slug}`}
          className="link-draw text-fg order-1 inline-block font-medium motion-safe:transition-[background-size,transform] motion-safe:duration-[120ms] motion-safe:ease-out motion-safe:group-hover:translate-x-0.5 sm:order-2"
        >
          {article.title}
        </Link>
      </div>
      <p className="text-fg-dim mt-1 text-sm sm:ml-32">
        {article.description}
      </p>
    </li>
  )
}

export default function ArticlesIndex() {
  const articles = getAllArticles()
  const groups = groupByYear(articles)
  const years = [...groups.keys()].sort((a, z) => Number(z) - Number(a))

  return (
    <main className="mx-auto max-w-[70ch] px-4 py-16 sm:py-24">
      <h1 className="text-fg text-2xl font-semibold tracking-tight sm:text-3xl">
        Articles
      </h1>
      <p className="text-fg-dim mt-4">
        Long-form notes on homelab infrastructure, networking and
        self-hosting, in the order I wrote them.
      </p>

      <div className="mt-12 space-y-12">
        {years.map((year) => (
          <section key={year}>
            <h2 className="text-fg-faint font-mono text-sm">{year}</h2>
            <ul role="list" className="border-border mt-4 divide-y divide-border border-t">
              {groups.get(year)!.map((article) => (
                <ArticleRow key={article.slug} article={article} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}

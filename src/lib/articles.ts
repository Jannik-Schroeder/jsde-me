import { generatedArticles } from './articles.generated'

/** Metadata for one article. The single shape every consumer codes against. */
export interface ArticleMeta {
  slug: string
  title: string
  date: string
  description: string
  author: string
}

/** All articles, newest first. */
/** @deprecated Use getAllArticles() to exclude scheduled articles. */
export const articles: ArticleMeta[] = [...generatedArticles].sort(
  (a, z) => +new Date(z.date) - +new Date(a.date),
)

/** Whether an article date has arrived in Europe/Berlin. */
export function isPublished(date: string): boolean {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  return date <= today
}

/** Published articles, newest first. Re-evaluates dates on every call. */
export function getAllArticles(): ArticleMeta[] {
  return articles.filter((article) => isPublished(article.date))
}

/** All articles, including scheduled articles, newest first. */
export function getAllArticlesIncludingScheduled(): ArticleMeta[] {
  return articles
}

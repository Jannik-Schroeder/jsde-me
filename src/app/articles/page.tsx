import { type Metadata } from 'next'

import { ArticleArchive } from '@/components/archive/ArticleArchive'
import { getArticleTopics } from '@/components/archive/topics'
import { getAllArticles } from '@/lib/articles'

import styles from '@/components/archive/archive.module.css'

export const metadata: Metadata = {
  alternates: { canonical: 'https://jsde.me/articles' },
  title: 'Articles',
  description:
    'Technical field notes on homelab infrastructure, networking and self-hosting by Jannik Schröder.',
}

export default function ArticlesIndex() {
  const articles = getAllArticles().map(
    ({ slug, title, date, description }) => ({
      slug,
      title,
      date,
      description,
      topics: getArticleTopics(slug),
    }),
  )

  return (
    <main className={`hub-wrap ${styles.archive}`}>
      <header className={styles.archiveHeader}>
        <h1 className={styles.display}>Field notes</h1>
        <p>
          Build logs, deployment guides and troubleshooting notes from my
          homelab and the systems I run.
        </p>
      </header>

      <ArticleArchive articles={articles} />
    </main>
  )
}

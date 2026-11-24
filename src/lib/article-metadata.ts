import type { Metadata } from 'next'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { isPublished, type ArticleMeta } from './articles'
import { pageMetadata } from './page-metadata'

/** Metadata obeys the same runtime date gate as the article body and index. */
export async function articleMetadata(
  article: Omit<ArticleMeta, 'slug'>,
  canonical: string,
): Promise<Metadata> {
  await connection()
  if (!isPublished(article.date)) notFound()
  return pageMetadata({
    title: article.title,
    description: article.description,
    canonical,
    publishedTime: article.date,
  })
}

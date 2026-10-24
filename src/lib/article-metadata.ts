import type { Metadata } from 'next'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { isPublished, type ArticleMeta } from './articles'
/** Metadata obeys the same runtime date gate as the article body and index. */
export async function articleMetadata(article: Omit<ArticleMeta,'slug'>, canonical: string): Promise<Metadata> {
  await connection()
  if (!isPublished(article.date)) notFound()
  return {title:article.title,description:article.description,alternates:{canonical},openGraph:{title:article.title,description:article.description,url:canonical,type:'article',publishedTime:article.date}}
}

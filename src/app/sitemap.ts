import { connection } from 'next/server'
import type { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/articles'

// Re-evaluate scheduled publication dates in Europe/Berlin at least hourly.


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection()
  return [
    ...['/', '/articles', '/uses'].map((path) => ({ url: `https://jsde.me${path}` })),
    ...getAllArticles().map((article) => ({
      url: `https://jsde.me/articles/${article.slug}`,
    })),
  ]
}

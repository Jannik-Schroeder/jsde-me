import type { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/articles'

// Re-evaluate scheduled publication dates in Europe/Berlin at least hourly.
export const revalidate = 3600

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...['/', '/articles', '/uses'].map((path) => ({ url: `https://jsde.me${path}` })),
    ...getAllArticles().map((article) => ({
      url: `https://jsde.me/articles/${article.slug}`,
    })),
  ]
}

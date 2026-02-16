import { Feed } from 'feed'

export async function GET(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  const author = {
    name: 'Jannik Schröder',
    email: 'contact@jsde.me',
    link: siteUrl,
  }

  const feed = new Feed({
    title: 'Jannik Schröder',
    description:
      'Writing on infrastructure design, automation, homelabs, and privacy.',
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    favicon: `${siteUrl}/favicon.ico`,
    image: `${siteUrl}/favicon.ico`,
    author,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${siteUrl}/feed.xml`,
    },
  })

  const { getAllArticles } = await import('@/lib/articles')
  const articles = await getAllArticles()

  for (const article of articles) {
    const publicUrl = `${siteUrl}/articles/${article.slug}`

    feed.addItem({
      title: article.title,
      id: publicUrl,
      link: publicUrl,
      description: article.description,
      content: article.description,
      author: [author],
      contributor: [author],
      date: new Date(article.date),
    })
  }

  return new Response(feed.rss2(), {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control':
        'public, max-age=0, s-maxage=31556952, stale-while-revalidate=86400',
    },
  })
}

import type { Metadata } from 'next'
import { me } from './me'

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jsde.me'

const socialImage = {
  url: new URL('/social-card.jpg', siteUrl).href,
  type: 'image/jpeg',
  width: 1200,
  height: 630,
  alt: 'Jannik Schröder with his laptop beside the jsde.me wordmark.',
}

interface PageDetails {
  title: string
  description: string
  canonical: string
  publishedTime?: string
}

export function pageMetadata({
  title,
  description,
  canonical,
  publishedTime,
}: PageDetails): Metadata {
  const preview = { title, description, images: [socialImage] }

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      ...preview,
      siteName: me.name,
      url: canonical,
      ...(publishedTime
        ? { type: 'article', publishedTime }
        : { type: 'website' }),
    },
    twitter: { ...preview, card: 'summary_large_image', creator: '@jsde_me' },
  }
}

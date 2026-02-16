import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'

import '@/styles/tailwind.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  authors: [{ name: 'Jannik Schröder', url: siteUrl }],
  title: {
    template: '%s · Jannik Schröder',
    default: 'Jannik Schröder · System Administrator & Co-Founder',
  },
  description:
    'I’m a system administrator and co-founder. I love building and automating things, and I’m passionate about privacy and security.',
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Jannik Schröder',
    description:
      'System administrator and co-founder. Building and automating things with a focus on privacy and security.',
    siteName: 'Jannik Schröder',
  },
  twitter: {
    card: 'summary',
    creator: '@jsde_me',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}

import { type Metadata } from 'next'

import { SiteHeader } from '@/components/SiteHeader'
import { StatusLine } from '@/components/StatusLine'
import { Terminal } from '@/components/Terminal'
import { getAllArticles } from '@/lib/articles'
import { me } from '@/lib/me'

// Refresh the homepage article list as scheduled publication dates arrive.
export const revalidate = 3600

export const metadata: Metadata = {
  alternates: { canonical: 'https://jsde.me/' },
  description: me.short,
}

/**
 * Homepage: one centred column that is exactly the viewport — header, terminal,
 * live block. On md+ the block sits in the middle of the viewport with the
 * terminal at a fixed height; below md it fills what is left. Only the
 * transcript inside the terminal scrolls. `data-page`
 * scopes that to this route (see globals.css); every other page scrolls
 * normally, and on a viewport shorter than 40rem this one does too rather than
 * cutting content off.
 */
export default function Home() {
  // Published only: future-dated posts must not show up here, nor become
  // linkable targets for the agent.
  const published = getAllArticles()

  return (
    <main
      data-page="home"
      className="flex h-dvh w-full justify-center overflow-hidden px-4 py-10"
    >
      <div className="page-column flex min-h-0 flex-col gap-8 md:justify-center">
        <SiteHeader />
        <Terminal articles={published} />
        <StatusLine />
      </div>
    </main>
  )
}

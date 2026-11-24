import Script from 'next/script'
import { type Metadata } from 'next'
import localFont from 'next/font/local'

import Link from 'next/link'
import { BackToTop } from '@/components/BackToTop'
import { SiteHeader } from '@/components/SiteHeader'
import { me, projectsUrl } from '@/lib/me'
import { linkEvent } from '@/lib/link-events'
import { pageMetadata, siteUrl } from '@/lib/page-metadata'
import '@/styles/globals.css'
import '@/styles/hub.css'

// The woff2 files live in the repo (latin subset, variable weight) so the build
// never has to reach fonts.gstatic.com.
const sans = localFont({
  src: '../fonts/DMSans-Variable.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-dm-sans',
})

const mono = localFont({
  src: '../fonts/JetBrainsMono-latin-variable.woff2',
  weight: '100 800',
  display: 'swap',
  variable: '--font-jetbrains',
})

const display = localFont({
  src: '../fonts/GeistPixel-Square.woff2',
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

const label = localFont({
  src: '../fonts/Silkscreen-Regular.woff2',
  weight: '400',
  display: 'swap',
  variable: '--font-label',
})

export const metadata: Metadata = {
  ...pageMetadata({
    title: me.name,
    description:
      'System administrator passionate about open source and network engineering. Building and automating things in my HomeLab and beyond.',
    canonical: siteUrl,
  }),
  metadataBase: new URL(siteUrl),
  authors: [{ name: 'Jannik Schröder', url: siteUrl }],
  title: {
    template: '%s · Jannik Schröder',
    default: 'Jannik Schröder · System Administrator & Open Source Enthusiast',
  },
  description:
    "I'm a system administrator with a passion for open source software and network engineering. I love building and automating things.",
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${display.variable} ${label.variable} h-full antialiased`}
    >
      <body id="top" className="bg-bg text-fg min-h-full font-sans">
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <BackToTop />
        <div id="content" tabIndex={-1}>
          {children}
        </div>
        <footer className="hub-footer">
          <div className="hub-wrap">
            <div className="footer-start">
              <Link href="/" className="footer-brand">
                jsde.me
              </Link>
              <nav aria-label="Elsewhere">
                {[{ label: 'Phanes', href: projectsUrl }, ...me.links].map(
                  (link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      {...linkEvent(link.href)}
                    >
                      {link.label}
                    </a>
                  ),
                )}
              </nav>
            </div>
            <p>
              Self-hosted, cookieless page-view and public link-click analytics.
              Analytics do not record message contents.{' '}
              <a
                href="https://scpx.de/datenschutz"
                className="link underline underline-offset-4"
              >
                Analytics privacy information
              </a>
            </p>
            <p className="mt-2">
              VAT ID / USt-IdNr.: DE466225341 ·{' '}
              <a
                href="https://scpx.de/impressum"
                className="link underline underline-offset-4"
              >
                Legal notice / Impressum
              </a>
            </p>
            <a
              href="#top"
              className="footer-sign"
              aria-label="Back to the top of jsde.me"
            >
              jsde.me<span aria-hidden="true">↑</span>
            </a>
          </div>
        </footer>
        <Script
          src="https://rybbit.scpx.de/api/script.js"
          data-site-id="3"
          data-skip-patterns={
            '["/api/**", "/training", "/auth/**", "/callback/**", "/verify/**", "/reset-password/**"]'
          }
          data-mask-patterns={
            '["/domains/*/**", "/customers/*/**", "/tickets/*/**", "/servers/*/**", "/users/*/**"]'
          }
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}

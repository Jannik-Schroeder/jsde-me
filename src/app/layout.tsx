import Script from "next/script";
import { type Metadata } from 'next'
import localFont from 'next/font/local'

import '@/styles/globals.css'

// The woff2 files live in the repo (latin subset, variable weight) so the build
// never has to reach fonts.gstatic.com.
const sans = localFont({
  src: '../fonts/Inter-latin-variable.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-inter',
})

const mono = localFont({
  src: '../fonts/JetBrainsMono-latin-variable.woff2',
  weight: '100 800',
  display: 'swap',
  variable: '--font-jetbrains',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
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
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Jannik Schröder',
    description:
      'System administrator passionate about open source and network engineering. Building and automating things in my HomeLab and beyond.',
    siteName: 'Jannik Schröder',
  },
  twitter: {
    card: 'summary',
    creator: '@jsde_me',
  },
}

// Deliberately bare: every page owns its own chrome.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="bg-bg text-fg min-h-full font-sans">{children}
        <footer className="border-border text-fg-dim mx-auto max-w-[70ch] border-t px-4 py-6 text-xs leading-relaxed">
          <p>Self-hosted, cookieless page-view and public link-click analytics. Analytics do not record message contents.{' '}
            <a href="https://scpx.de/datenschutz" className="link underline underline-offset-4">Analytics privacy information</a>
          </p>
        </footer>
        <Script
          src="https://rybbit.scpx.de/api/script.js"
          data-site-id="3"
          data-skip-patterns={"[\"/api/**\", \"/auth/**\", \"/callback/**\", \"/verify/**\", \"/reset-password/**\"]"}
          data-mask-patterns={"[\"/domains/*/**\", \"/customers/*/**\", \"/tickets/*/**\", \"/servers/*/**\", \"/users/*/**\"]"}
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}

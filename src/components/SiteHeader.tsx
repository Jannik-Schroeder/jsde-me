'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const sections = [
  ['/', 'Overview'],
  ['/articles', 'Field notes'],
  ['/uses', 'Gear'],
  ['/lab', 'Playground'],
  ['/profile', 'Profile'],
] as const

export function SiteHeader() {
  const current = usePathname()
  return (
    <header className="hub-header">
      <div className="hub-wrap header-inner">
        <Link className="brand" href="/" aria-label="jsde.me home">
          <span className="brand-mark" aria-hidden="true">
            j<span>s</span>
          </span>
          jsde<span className="brand-domain">.me</span>
        </Link>
        <nav aria-label="Main navigation" className="hub-nav">
          {sections.map(([path, name]) => (
            <Link
              key={path}
              href={path}
              aria-current={
                current === path
                  ? 'page'
                  : path !== '/' && current.startsWith(path + '/')
                    ? 'location'
                    : undefined
              }
            >
              {name}
            </Link>
          ))}
        </nav>
        <Link
          href="/terminal"
          className="terminal-link"
          aria-current={current === '/terminal' ? 'page' : undefined}
        >
          <span aria-hidden="true">&gt;_</span> Terminal
        </Link>
      </div>
    </header>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import avatar from '@/images/avatar.jpg'

const sections = [
  ['/articles', 'Field notes'],
  ['/uses', 'Gear'],
  ['/lab', 'Playground'],
  ['/#career', 'Career'],
  ['/profile', 'Profile'],
] as const

export function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)

  useEffect(() => {
    // Scroll restoration may keep the same header mounted across pages.
    const scrollRoot = document.documentElement
    let previous = Math.max(0, window.scrollY)
    function scroll() {
      const current = Math.max(0, window.scrollY)
      if (Math.abs(current - previous) < 6 && current > 55) return
      const hide =
        current > 80 &&
        current > previous &&
        !menuOpen &&
        !header.current?.matches(':has(:focus-visible)')
      setHidden(hide)
      scrollRoot.classList.toggle('nav-away', hide)
      previous = current
    }
    window.addEventListener('scroll', scroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', scroll)
      scrollRoot.classList.remove('nav-away')
    }
  }, [menuOpen, pathname])

  useEffect(() => {
    if (!menuOpen) return
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggle.current?.focus()
      }
    }
    function outside(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('pointerdown', outside)
    }
  }, [menuOpen])

  const close = () => {
    setMenuOpen(false)
    setHidden(false)
  }
  return (
    <header
      ref={header}
      className="hub-header"
      data-away={hidden}
      data-open={menuOpen}
    >
      <noscript>
        <style>{`@media (max-width:760px){.hub-header .header-inner{height:auto;flex-wrap:wrap;padding-block:12px}.hub-header .hub-nav{display:flex;position:static;order:3;width:100%;flex-wrap:wrap;gap:10px 16px;border:0;padding:0}.hub-header .hub-nav a{width:auto;font-size:16px}.hub-header .nav-toggle{display:none}}`}</style>
      </noscript>
      <div className="hub-wrap header-inner">
        <Link
          href="/"
          className="brand"
          onClick={close}
          aria-label="jsde.me home"
        >
          <Image src={avatar} width={24} height={24} alt="" sizes="24px" />
          jsde.me
        </Link>
        <nav id="site-nav" className="hub-nav" aria-label="Main navigation">
          {sections.map(([href, name]) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              aria-current={pathname === href ? 'page' : undefined}
            >
              {name}
            </Link>
          ))}
        </nav>
        <Link href="/terminal" className="terminal-link" onClick={close}>
          <span aria-hidden="true">&gt;_</span> Terminal
        </Link>
        <button
          type="button"
          ref={toggle}
          className="nav-toggle"
          aria-controls="site-nav"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          Menu
        </button>
      </div>
    </header>
  )
}

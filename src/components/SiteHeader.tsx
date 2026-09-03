import { me, projectsUrl } from '@/lib/me'

/** Order of the quiet link row; phanes.net leads because it is the one action,
 *  and Articles is the only page-level entry point on the site. */
const ORDER = ['GitHub', 'LinkedIn', 'X', 'Email']

function headerLinks() {
  const known = (label: string) => me.links.find((link) => link.label === label)
  const rss = known('RSS')
  return [
    { label: 'phanes.net', href: projectsUrl },
    ...ORDER.map(known).filter((link) => link !== undefined),
    { label: 'Articles', href: '/articles' },
    ...(rss === undefined ? [] : [rss]),
  ]
}

/**
 * One line at the top of the column: who this is on the left, where to find him
 * on the right. No portrait, no logos — the terminal below is the hero.
 */
export function SiteHeader() {
  const links = headerLinks()

  return (
    <header className="rise flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
      <h1 className="text-[22px] font-semibold tracking-tight">
        {me.name}{' '}
        <span className="text-fg-dim text-[15px] font-normal">
          {me.headline}
        </span>
      </h1>

      <nav aria-label="Elsewhere">
        <ul className="text-fg-dim flex flex-wrap items-baseline gap-x-2 text-[13px]">
          {links.map((link, index) => (
            <li key={link.href} className="flex items-baseline gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-fg-faint">
                  ·
                </span>
              )}
              <a
                href={link.href}
                className="hover:text-fg group inline-flex items-baseline gap-1 motion-safe:transition-colors"
              >
                <span className="link-draw group-hover:bg-[length:100%_1px]">
                  {link.label}
                </span>
                {link.href.startsWith('http') && (
                  <span aria-hidden="true" className="text-fg-faint">
                    ↗
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

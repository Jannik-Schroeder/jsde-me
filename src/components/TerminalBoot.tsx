import Link from 'next/link'

import { type ArticleMeta } from '@/lib/articles'
import { me } from '@/lib/me'

/**
 * What the terminal has already printed when you arrive. Rendered on the
 * server, so a visitor without JavaScript — and every crawler — finds the real
 * introduction and a real link inside the window instead of an empty box. The
 * full list lives in "Latest writing" below; repeating it here would just be
 * the same ten titles twice.
 */
export function TerminalBoot({ articles }: { articles: ArticleMeta[] }) {
  const newest = articles.at(0)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-fg-faint">
          <span aria-hidden="true" className="text-accent">
            $
          </span>{' '}
          whoami
        </p>
        <p className="text-fg-dim mt-1.5 max-w-[76ch] leading-relaxed">
          {me.short}
        </p>
      </div>

      {newest !== undefined && (
        <div>
          <p className="text-fg-faint">
            <span aria-hidden="true" className="text-accent">
              $
            </span>{' '}
            ls articles
          </p>
          <p className="text-fg-dim mt-1.5">
            <Link
              href="/articles"
              className="link-draw text-fg-dim hover:text-fg motion-safe:transition-colors"
            >
              {articles.length} posts
            </Link>{' '}
            <span aria-hidden="true" className="text-fg-faint">
              ·
            </span>{' '}
            newest:{' '}
            <Link
              href={`/articles/${newest.slug}`}
              className="link-draw text-fg-dim hover:text-fg motion-safe:transition-colors"
            >
              {newest.title}
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

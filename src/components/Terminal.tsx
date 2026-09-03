import { TerminalBoot } from '@/components/TerminalBoot'
import { TerminalChat } from '@/components/TerminalChat'
import { TerminalTitleBar } from '@/components/TerminalTitleBar'
import { type ArticleMeta } from '@/lib/articles'

/**
 * The hero: the terminal window, taking whatever height the column has left
 * over. Server
 * component — the boot text and its article links are in the HTML before any
 * JavaScript runs, and the client chat continues below them.
 */
export function Terminal({ articles }: { articles: ArticleMeta[] }) {
  // Every slug, so the agent can link to any article; the boot text lists the
  // newest handful.
  const titles = Object.fromEntries(articles.map((a) => [a.slug, a.title]))

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-none">
      <section
        aria-label="Ask me anything"
        className="terminal-window rise border-border bg-bg-elev flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border"
        style={{ animationDelay: '70ms' }}
      >
        <TerminalTitleBar />
        <TerminalChat titles={titles}>
          <TerminalBoot articles={articles} />
        </TerminalChat>
      </section>

      <p
        className="text-fg-faint rise mt-2.5 shrink-0 text-[11px]"
        style={{ animationDelay: '110ms' }}
      >
        Answers come from a language model given a short profile of me. It can
        be wrong — for anything that matters, ask me directly.
      </p>
    </div>
  )
}

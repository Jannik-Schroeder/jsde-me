'use client'

import Link from 'next/link'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import { type ArticleMeta } from '@/lib/articles'
import { me, projectsUrl } from '@/lib/me'

/** English on purpose: the whole interface is English, the agent replies in the
 *  language it is asked in. */
const CHIPS = [
  'Who are you?',
  'Show me your projects',
  'What are you working on?',
  "What's in your homelab?",
  'How do I reach you?',
]

/** Shown when /api/chat cannot be reached at all (offline, 404, 502). The rest
 *  of the page keeps working, so say so instead of hanging on a spinner. */
const UNREACHABLE =
  'The chat is not reachable right now. Everything else on this page still works.'
const DROPPED = 'Connection dropped.'

type Command = 'help' | 'whoami' | 'ls' | 'contact' | 'exit'

type Turn =
  | { id: number; role: 'user'; content: string }
  | { id: number; role: 'assistant'; content: string }
  | { id: number; role: 'system'; command: Command }

/** Built-in commands, handled here and never sent to the model. Matching is on
 *  the exact normalised line — nothing clever, so anything unlisted is a
 *  question for AI-Jannik. */
const COMMANDS: Record<string, Command | 'clear'> = {
  clear: 'clear',
  cls: 'clear',
  help: 'help',
  '?': 'help',
  whoami: 'whoami',
  ls: 'ls',
  'ls -l': 'ls',
  'ls articles': 'ls',
  'ls -l articles': 'ls',
  articles: 'ls',
  contact: 'contact',
  reach: 'contact',
  exit: 'exit',
  quit: 'exit',
}

const HELP: [string, string][] = [
  ['clear', 'wipe the window, start over'],
  ['help', 'this list, one screen'],
  ['whoami', 'the short version of me'],
  ['ls', 'every published article, newest first'],
  ['contact', 'email and the usual profiles'],
  ['exit', 'not what you are hoping for'],
]

function lookup(line: string): Command | 'clear' | undefined {
  return COMMANDS[line.trim().toLowerCase().replace(/\s+/g, ' ')]
}

/**
 * Every target an assistant answer is allowed to turn into a link: Jannik's own
 * addresses and his own articles, nothing else. A URL a prompt injection talked
 * the model into printing stays plain text.
 */
const TARGETS = new Map<string, string>()

function allow(text: string, href: string) {
  if (text !== '') TARGETS.set(text, href)
}

allow(me.email, `mailto:${me.email}`)
for (const link of [...me.links, { label: 'Projects', href: projectsUrl }]) {
  allow(link.href, link.href)
  if (link.href.startsWith('http')) {
    allow(link.href.replace(/^https?:\/\//, '').replace(/\/$/, ''), link.href)
  }
}

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** `[label](target)` or a bare target. Longest literal first so the full URL
 *  wins over its bare host form. */
const LINK_SOURCE = (() => {
  const literals = [...TARGETS.keys()]
    .sort((a, z) => z.length - a.length)
    .map(escapeRe)
    .join('|')
  const target = `\\/articles\\/[a-z0-9-]+${literals === '' ? '' : `|${literals}`}`
  return `\\[([^\\]\\n]+)\\]\\((${target})\\)|(${target})`
})()

function resolve(
  raw: string,
  titles: Record<string, string>,
): { href: string; label: string } | null {
  if (raw.startsWith('/articles/')) {
    const title = titles[raw.slice('/articles/'.length)]
    return title === undefined ? null : { href: raw, label: title }
  }
  const href = TARGETS.get(raw)
  return href === undefined ? null : { href, label: raw }
}

/** Marks a link that leaves the site. */
function External() {
  return (
    <span aria-hidden="true" className="text-fg-faint">
      {' '}
      ↗
    </span>
  )
}

function AgentLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  if (href.startsWith('http')) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="link text-fg"
      >
        {children}
        <External />
      </a>
    )
  }
  if (href.startsWith('mailto:')) {
    return (
      <a href={href} className="link text-fg">
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className="link text-fg">
      {children}
    </Link>
  )
}

/**
 * Assistant text with the allow-listed targets turned into real links. Anything
 * unknown — including an unknown article slug — stays plain text: a link to a
 * 404, or to somewhere a stranger named, is worse than no link.
 */
function AgentText({
  text,
  titles,
}: {
  text: string
  titles: Record<string, string>
}) {
  const nodes: React.ReactNode[] = []
  const pattern = new RegExp(LINK_SOURCE, 'g')
  let last = 0

  for (
    let match = pattern.exec(text);
    match !== null;
    match = pattern.exec(text)
  ) {
    const raw = match[2] ?? match[3] ?? ''
    const target = resolve(raw, titles)
    if (target === null) continue

    nodes.push(text.slice(last, match.index))
    nodes.push(
      <AgentLink key={`${match.index}-${raw}`} href={target.href}>
        {match[1] ?? target.label}
      </AgentLink>,
    )
    last = match.index + match[0].length
  }
  nodes.push(text.slice(last))

  return <>{nodes}</>
}

/** What a built-in command prints. Dim, like any other system output. */
function CommandOutput({
  command,
  articles,
}: {
  command: Command
  articles: ArticleMeta[]
}) {
  if (command === 'help') {
    return (
      <div className="space-y-1">
        {HELP.map(([name, hint]) => (
          <p key={name}>
            <span className="text-fg inline-block w-20">{name}</span>
            <span>{hint}</span>
          </p>
        ))}
        <p className="text-fg-faint pt-1">
          anything else is a question for AI-Jannik.
        </p>
      </div>
    )
  }

  if (command === 'whoami') {
    return <p className="max-w-[76ch]">{me.short}</p>
  }

  if (command === 'ls') {
    return (
      <ul className="space-y-1">
        {articles.map((article) => (
          <li key={article.slug} className="flex gap-4">
            <time
              dateTime={article.date}
              className="text-fg-faint hidden flex-none tabular-nums sm:block"
            >
              {article.date}
            </time>
            <Link
              href={`/articles/${article.slug}`}
              className="link-draw hover:text-fg motion-safe:transition-colors"
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  if (command === 'contact') {
    const external = me.links.filter((link) => link.href.startsWith('http'))
    return (
      <div className="space-y-1">
        <p className="text-fg">{me.name}</p>
        <p>
          <a href={`mailto:${me.email}`} className="link text-fg">
            {me.email}
          </a>
        </p>
        {[...external, { label: 'phanes.net', href: projectsUrl }].map(
          (link) => (
            <p key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-draw hover:text-fg motion-safe:transition-colors"
              >
                {link.href.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </p>
          ),
        )}
      </div>
    )
  }

  return <p>there is no exit. try &lsquo;help&rsquo;.</p>
}

/** A blinking block cursor. Only ever accent-coloured, never animated for
 *  visitors who asked for reduced motion (see globals.css). */
export function Cursor({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={`terminal-cursor bg-accent inline-block h-[1.05em] w-[1ch] ${className ?? ''}`}
    />
  )
}

/**
 * The inside of the terminal window: the server-rendered boot text (`children`)
 * at the top of the scrollback, then the transcript, the suggestion chips and
 * the prompt. Hydration is a no-op — the boot text is delivered as it was
 * rendered, so its links never leave the DOM.
 */
export function TerminalChat({
  articles,
  children,
}: {
  articles: ArticleMeta[]
  children: React.ReactNode
}) {
  const [draft, setDraft] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [pending, setPending] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [caret, setCaret] = useState({ pos: 0, scroll: 0 })
  // `clear` wipes the boot text too, so it needs its own flag.
  const [cleared, setCleared] = useState(false)
  const [recall, setRecall] = useState<string[]>([])
  const [recallAt, setRecallAt] = useState<number | null>(null)

  const titles = useMemo(
    () => Object.fromEntries(articles.map((a) => [a.slug, a.title])),
    [articles],
  )

  const scrollBox = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)
  // Auto-scroll follows the newest token, but stops the moment the visitor
  // scrolls up to read something older.
  const stick = useRef(true)

  useEffect(() => {
    // Before the first question the window shows its boot text from the top;
    // only a live conversation pulls the view down to the newest line.
    if (turns.length === 0 && !streaming && error === null) return
    const box = scrollBox.current
    if (box && stick.current) box.scrollTop = box.scrollHeight
  }, [turns, pending, error, streaming])

  // `/` anywhere on the page jumps to the prompt, unless something else is
  // already taking typing.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      const target = event.target as HTMLElement | null
      if (
        target !== null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      event.preventDefault()
      const el = input.current
      if (el === null) return
      el.focus()
      const end = el.value.length
      el.setSelectionRange(end, end)
      setCaret({ pos: end, scroll: el.scrollLeft })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function onScroll() {
    const box = scrollBox.current
    if (!box) return
    stick.current = box.scrollHeight - box.scrollTop - box.clientHeight < 32
  }

  /** Keep the block cursor on the real caret, including arrow keys and a
   *  horizontally scrolled field. */
  function syncCaret() {
    const el = input.current
    if (el) setCaret({ pos: el.selectionStart ?? 0, scroll: el.scrollLeft })
  }

  function commit(text: string) {
    setTurns((old) => [
      ...old,
      { id: nextId.current++, role: 'assistant', content: text },
    ])
  }

  /** Put the caret back at the end after the value changed under it. */
  function refocus(value: string) {
    const el = input.current
    if (el === null) return
    el.focus()
    requestAnimationFrame(() => {
      el.setSelectionRange(value.length, value.length)
      setCaret({ pos: value.length, scroll: el.scrollLeft })
    })
  }

  /** ↑/↓ walk the lines already sent, like any shell. */
  function onHistoryKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    if (recall.length === 0) return
    event.preventDefault()

    let next: number | null
    if (event.key === 'ArrowUp') {
      next = recallAt === null ? recall.length - 1 : Math.max(0, recallAt - 1)
    } else {
      next = recallAt === null ? null : recallAt + 1
    }
    if (next !== null && next >= recall.length) next = null

    const value = next === null ? '' : (recall[next] ?? '')
    setRecallAt(next)
    setDraft(value)
    refocus(value)
  }

  async function send(text: string) {
    const question = text.trim()
    if (question === '' || streaming) return

    setRecall((old) => [...old, question])
    setRecallAt(null)

    // Built-in commands are answered here; the model never sees them.
    const command = lookup(question)
    if (command !== undefined) {
      setDraft('')
      setCaret({ pos: 0, scroll: 0 })
      setError(null)
      setPending('')
      stick.current = true

      if (command === 'clear') {
        setTurns([])
        setCleared(true)
      } else {
        setTurns((old) => [
          ...old,
          { id: nextId.current++, role: 'user', content: question },
          { id: nextId.current++, role: 'system', command },
        ])
      }
      refocus('')
      return
    }

    const thread: Turn[] = [
      ...turns,
      { id: nextId.current++, role: 'user', content: question },
    ]
    setTurns(thread)
    setDraft('')
    setCaret({ pos: 0, scroll: 0 })
    setError(null)
    setPending('')
    setStreaming(true)
    stick.current = true

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: thread.flatMap((turn) =>
          turn.role === 'system'
            ? []
            : [{ role: turn.role, content: turn.content }],
        ),
      }),
    }).catch(() => null)

    if (!res || !res.ok || !res.body) {
      // Rejections before the stream starts (validation, rate limit) are plain
      // JSON with a finished, showable sentence.
      const body = res ? await res.json().catch(() => null) : null
      const shown =
        body !== null &&
        typeof body === 'object' &&
        typeof (body as { text?: unknown }).text === 'string' &&
        (body as { text: string }).text !== ''
          ? (body as { text: string }).text
          : UNREACHABLE
      setError(shown)
      setStreaming(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let collected = ''

    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let edge = buffer.indexOf('\n\n')
        while (edge !== -1) {
          const frame = buffer.slice(0, edge)
          buffer = buffer.slice(edge + 2)
          const event = /^event: (.*)$/m.exec(frame)?.[1] ?? ''
          const data = JSON.parse(
            /^data: (.*)$/m.exec(frame)?.[1] ?? '{}',
          ) as Record<string, unknown>

          if (event === 'token') {
            collected += String(data.text ?? '')
            setPending(collected)
          } else if (event === 'done') {
            if (collected !== '') commit(collected)
            collected = ''
            setPending('')
          } else if (event === 'error') {
            // `text` is already a finished sentence — show it verbatim.
            setError(String(data.text ?? '') || UNREACHABLE)
            if (collected !== '') {
              commit(collected)
              collected = ''
            }
            setPending('')
          }
          edge = buffer.indexOf('\n\n')
        }
      }
      // Stream ended without a `done` frame: keep whatever arrived.
      if (collected !== '') {
        commit(collected)
        setPending('')
      }
    } catch {
      if (collected !== '') commit(collected)
      setPending('')
      setError(DROPPED)
    } finally {
      setStreaming(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void send(draft)
  }

  const empty = turns.length === 0 && !streaming && !cleared

  return (
    <>
      <div
        ref={scrollBox}
        onScroll={onScroll}
        className="terminal-scroll bg-bg min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 font-mono text-sm leading-relaxed"
      >
        {!cleared && children}

        {turns.length > 0 && (
          <div
            role="log"
            aria-live="polite"
            className={`space-y-4 ${cleared ? '' : 'mt-5'}`}
          >
            {turns.map((turn) => {
              if (turn.role === 'user') {
                return (
                  <p key={turn.id} className="break-words whitespace-pre-wrap">
                    <span
                      aria-hidden="true"
                      className="text-accent select-none"
                    >
                      ${' '}
                    </span>
                    <span className="text-fg">{turn.content}</span>
                  </p>
                )
              }
              if (turn.role === 'system') {
                return (
                  <div key={turn.id} className="text-fg-dim">
                    <CommandOutput command={turn.command} articles={articles} />
                  </div>
                )
              }
              return (
                <p
                  key={turn.id}
                  className="text-fg-dim break-words whitespace-pre-wrap"
                >
                  <AgentText text={turn.content} titles={titles} />
                </p>
              )
            })}
          </div>
        )}

        {streaming && (
          <p
            aria-hidden="true"
            className="text-fg-dim mt-4 break-words whitespace-pre-wrap"
          >
            <AgentText text={pending} titles={titles} />
            <span aria-hidden="true" className="terminal-cursor text-accent">
              ▍
            </span>
          </p>
        )}

        {error !== null && (
          <p role="alert" className="text-fg-faint mt-4">
            {error}
          </p>
        )}
      </div>

      <div className="border-border bg-bg shrink-0 border-t px-5 py-3.5">
        {empty && (
          <ul className="terminal-scroll -mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0">
            {CHIPS.map((chip, index) => (
              <li
                key={chip}
                className="rise flex-none"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <button
                  type="button"
                  disabled={streaming}
                  onClick={() => {
                    void send(chip)
                    input.current?.focus()
                  }}
                  className="border-border text-fg-dim hover:text-fg hover:border-fg-faint focus-visible:outline-fg rounded border px-2 py-1 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                >
                  {chip}
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <label htmlFor="ask" className="sr-only">
            Ask a question
          </label>
          <span aria-hidden="true" className="text-accent font-mono text-sm">
            $
          </span>
          <div className="relative min-w-0 flex-1">
            <input
              id="ask"
              ref={input}
              type="text"
              value={draft}
              disabled={streaming}
              autoComplete="off"
              spellCheck={false}
              maxLength={1000}
              onChange={(event) => {
                setDraft(event.target.value)
                syncCaret()
              }}
              onKeyDown={onHistoryKey}
              onKeyUp={syncCaret}
              onClick={syncCaret}
              onSelect={syncCaret}
              onScroll={syncCaret}
              onFocus={syncCaret}
              className="placeholder:text-fg-faint w-full bg-transparent font-mono text-sm caret-transparent outline-none disabled:cursor-not-allowed"
            />
            {!streaming && (
              <Cursor
                className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                style={{ left: `calc(${caret.pos}ch - ${caret.scroll}px)` }}
              />
            )}
          </div>
          <button
            type="submit"
            disabled={streaming || draft.trim() === ''}
            className="text-fg-faint hover:text-fg focus-visible:outline-fg font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40"
          >
            {streaming ? 'wait' : 'send ⏎'}
          </button>
        </form>
      </div>
    </>
  )
}

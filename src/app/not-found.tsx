import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col items-start px-4 py-24 sm:px-6">
      <p className="rise text-fg-faint font-mono text-[11px] tracking-[0.2em] uppercase">
        404
      </p>
      <h1
        className="rise mt-4 text-2xl font-semibold"
        style={{ animationDelay: '70ms' }}
      >
        Nothing here
      </h1>
      <p
        className="rise text-fg-dim mt-3 leading-relaxed"
        style={{ animationDelay: '140ms' }}
      >
        That page does not exist, or it moved and this link did not come along.
      </p>
      <p className="rise mt-6 text-sm" style={{ animationDelay: '210ms' }}>
        <Link
          href="/"
          className="link text-fg-dim hover:text-fg motion-safe:transition-colors"
        >
          back home
        </Link>
      </p>
    </main>
  )
}

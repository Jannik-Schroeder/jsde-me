/**
 * Window chrome for the terminal: the dots, the title, and whatever the caller
 * hangs on the right.
 */
export function TerminalTitleBar({ children }: { children?: React.ReactNode }) {
  return (
    <div className="border-border text-fg-faint bg-bg-elev flex shrink-0 items-center gap-3 border-b px-4 py-2.5 font-mono text-xs">
      <span
        aria-hidden="true"
        className="group-hover:text-fg-dim tracking-[0.35em] motion-safe:transition-colors"
      >
        ●●●
      </span>
      <span className="truncate">jannik@jsde.me — ask-me</span>
      {children}
    </div>
  )
}

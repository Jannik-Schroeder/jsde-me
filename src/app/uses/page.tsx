/*
 * PLACEHOLDER CONTENT — awaiting the owner's real hardware and tooling.
 *
 * This page previously carried unedited Tailwind UI template copy (a
 * MacBook M3, a Keychron keyboard, "Figma for the entire company") that
 * described a template author, not Jannik. That text has been removed.
 *
 * The section headings below (workstation, homelab, development,
 * self-hosted services) are the shape a system administrator's /uses page
 * would have. Items are intentionally generic or left empty rather than
 * inventing specific products, models or brands — do not fill these in
 * with guessed hardware. Replace with the real setup when it's supplied.
 */
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Uses',
  description: 'Hardware, homelab and software this site runs on.',
}

function ToolsSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-fg-faint font-mono text-sm">{title}</h2>
      <ul role="list" className="mt-4 space-y-4">
        {children}
      </ul>
    </section>
  )
}

function Tool({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <li>
      <h3 className="text-fg font-medium">{title}</h3>
      {children ? (
        <p className="text-fg-dim mt-1 text-sm">{children}</p>
      ) : (
        <p className="text-fg-faint mt-1 text-sm italic">To be filled in.</p>
      )}
    </li>
  )
}

export default function Uses() {
  return (
    <main className="mx-auto max-w-[70ch] px-4 py-16 sm:py-24">
      <h1 className="text-fg text-2xl font-semibold tracking-tight sm:text-3xl">
        Uses
      </h1>
      <p className="text-fg-dim mt-4">
        Hardware, homelab and the software behind it. This page is a work in
        progress.
      </p>
      <p className="border-border bg-bg-elev text-fg-dim mt-6 border-l-2 px-4 py-3 text-sm">
        This list is being rewritten with the real setup — most of what
        follows is a placeholder outline, not a finished inventory.
      </p>

      <div className="mt-12 space-y-12">
        <ToolsSection title="Workstation">
          <Tool title="Daily driver" />
          <Tool title="Keyboard & input" />
          <Tool title="Displays" />
        </ToolsSection>

        <ToolsSection title="Homelab">
          <Tool title="Compute" />
          <Tool title="Networking" />
          <Tool title="Storage" />
        </ToolsSection>

        <ToolsSection title="Development">
          <Tool title="Editor" />
          <Tool title="Terminal & shell" />
          <Tool title="Version control & CI" />
        </ToolsSection>

        <ToolsSection title="Self-hosted services">
          <Tool title="Identity & access" />
          <Tool title="Monitoring & alerting" />
          <Tool title="Backups" />
        </ToolsSection>
      </div>
    </main>
  )
}

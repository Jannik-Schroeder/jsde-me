import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Terminal } from '@/components/Terminal'
import { getAllArticles } from '@/lib/articles'

export const metadata: Metadata = {
  title: 'Terminal',
  description:
    'Ask about my projects, my homelab and the articles behind them.',
  alternates: { canonical: 'https://jsde.me/terminal' },
}

export default async function TerminalPage() {
  await connection()
  return (
    <main className="hub-wrap console-page">
      <h1 className="section-display">Terminal</h1>
      <p>
        Ask about my work or type <code>help</code> for commands.
      </p>
      <Terminal articles={getAllArticles()} />
    </main>
  )
}

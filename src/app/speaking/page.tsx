import { type Metadata } from 'next'

import { SimpleLayout } from '@/components/SimpleLayout'

export const metadata: Metadata = {
  title: 'Speaking',
  description:
    'Talks, workshops, and podcast appearances.',
}

export default function Speaking() {
  return (
    <SimpleLayout
      title="Speaking"
      intro="I occasionally speak about Linux infrastructure, automation, homelabs, and privacy. If you’d like me to speak at your event or join your podcast, reach out."
    >
      <div className="rounded-2xl border border-zinc-100 p-6 text-sm text-zinc-600 dark:border-zinc-700/40 dark:text-zinc-400">
        No public talks or recordings yet.
        <div className="mt-4">
          <a
            className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
            href="mailto:contact@jsde.me"
          >
            contact@jsde.me
          </a>
        </div>
      </div>
    </SimpleLayout>
  )
}

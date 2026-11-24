import { pageMetadata } from '@/lib/page-metadata'
import PatchPanel from './PatchPanel'
import styles from './lab.module.css'

export const metadata = pageMetadata({
  title: 'Patch Panel · Lab',
  description:
    'Match homelab services to their default ports in three short rounds.',
  canonical: 'https://jsde.me/lab',
})

export default function Lab() {
  return (
    <main className={`hub-wrap ${styles.page}`}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>The lab</p>
        <h1>
          Patch Panel<span>.</span>
        </h1>
        <p>
          Match homelab services to their default ports. Select a service, then
          choose a port to patch it in.
        </p>
      </header>
      <PatchPanel />
    </main>
  )
}

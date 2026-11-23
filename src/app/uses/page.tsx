import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { connection } from 'next/server'

import { getAllArticles } from '@/lib/articles'

import rack from './rack.webp'
import styles from './uses.module.css'

export const metadata: Metadata = {
  alternates: { canonical: 'https://jsde.me/uses' },
  title: 'Gear',
  description:
    'Jannik Schröder’s documented homelab hardware, tooling and self-hosted software, with links to the original write-ups.',
}

const inventory = [
  {
    id: 'hardware',
    title: 'Hardware',
    items: [
      {
        name: 'Sophos SG/XG 330 rev. 2',
        detail:
          'Repurposed appliances for the OPNsense firewall pair introduced in Home Network V3.',
        source: 'home-network-v3',
      },
      {
        name: 'MikroTik CRS326-24S+2Q+',
        detail: 'Two switches form the redundant MLAG core documented in V3.',
        source: 'home-network-v3',
      },
      {
        name: 'UniFi U7 Lite & PoE switches',
        detail:
          'Wi-Fi 7 and wired access gear introduced in V2 and retained in V3.',
        source: 'home-network-v3',
      },
      {
        name: 'UniFi Dream Machine Pro Max',
        detail:
          'The all-in-one gateway from the V2 build, later replaced at the edge by OPNsense.',
        source: 'home-network-v2',
      },
      {
        name: 'Gigabyte R281-N40',
        detail:
          'The secondhand Xeon server from the original 2023 homelab build.',
        source: 'home-network-v1',
      },
      {
        name: 'Lenovo ThinkCentre M93p & Topping D10s',
        detail:
          'A used business PC and USB DAC give a vintage Sony amplifier a network audio input.',
        source: 'plexamp-hifi-endpoint',
      },
    ],
  },
  {
    id: 'tooling',
    title: 'Lab tooling',
    items: [
      {
        name: 'Proxmox VE & cloud-init',
        detail:
          'Virtual machines provisioned from a reusable cloud-image template.',
        source: 'proxmox-ve-cloud-init',
      },
      {
        name: 'NetBox',
        detail:
          'A structured record of devices, cabling and address space. The April write-up documents a move to NetBox Cloud.',
        source: 'netbox-source-of-truth',
      },
      {
        name: 'Forgejo, Woodpecker CI, Harbor & Komodo',
        detail:
          'The Git, build, registry and deployment stack documented in August 2026.',
        source: 'selfhosting-cicd-forgejo',
      },
      {
        name: 'Checkmk Community & ntfy',
        detail:
          'Checkmk replaced LibreNMS in October 2026 and retained the existing ntfy push path.',
        source: 'homelab-alerting-ntfy',
      },
      {
        name: 'Proxmox backups & restic',
        detail:
          'VM archives and encrypted application backups exercised through isolated restore tests.',
        source: 'backups-you-actually-restore',
      },
    ],
  },
  {
    id: 'services',
    title: 'Self-hosted services',
    items: [
      {
        name: 'Paperless-ngx',
        detail:
          'A searchable document archive with automated ingestion and metadata.',
        source: 'paperless-ngx-dms',
      },
      {
        name: 'Plex & Plexamp',
        detail:
          'The music server and dedicated player at the center of the May 2026 music stack.',
        source: 'self-hosted-music-stack',
      },
      {
        name: 'authentik',
        detail: 'A shared sign-in layer for homelab applications.',
        source: 'authentik-sso-homelab',
      },
      {
        name: 'SeaweedFS',
        detail:
          'An S3-compatible object store for the lab, documented with its failover limits.',
        source: 'seaweedfs-ha-s3',
      },
      {
        name: 'Stalwart',
        detail:
          'Self-hosted mail with separate public delivery and private storage components.',
        source: 'stalwart-mail-dmz',
      },
    ],
  },
]

const archiveDate = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export default async function Uses() {
  await connection()
  const published = new Map(
    getAllArticles().map((article) => [article.slug, article]),
  )

  return (
    <main className={`hub-wrap ${styles.page}`}>
      <header className={styles.hero}>
        <div className={styles.intro}>
          <h1>Gear</h1>
          <p>
            The hardware, tools and self-hosted services I’ve written about in
            the lab. Each entry links to the setup as it was documented at the
            time.
          </p>
          <nav aria-label="Inventory sections" className={styles.jumpLinks}>
            {inventory.map((group) => (
              <a key={group.id} href={`#${group.id}`}>
                {group.title} <span aria-hidden="true">↓</span>
              </a>
            ))}
          </nav>
        </div>
        <figure className={styles.figure}>
          <Image
            src={rack}
            alt="The front of the V2 server rack, with switches, patch cabling and a rackmount server."
            sizes="(max-width: 720px) 100vw, (max-width: 1240px) 42vw, 485px"
            preload
          />
          <figcaption>
            <Link href="/articles/home-network-v2">
              Home Network V2 <span aria-hidden="true">↗</span>
            </Link>
            <span>Jan 2026 write-up</span>
          </figcaption>
        </figure>
      </header>
      {inventory.map((group) => (
        <section className={styles.group} id={group.id} key={group.id}>
          <h2>{group.title}</h2>
          <ul className={styles.inventory} role="list">
            {group.items.flatMap((item) => {
              const article = published.get(item.source)
              if (!article) return []
              return (
                <li className={styles.item} key={item.name}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <Link
                    className={styles.source}
                    href={`/articles/${article.slug}`}
                  >
                    <span>{article.title}</span>
                    <time dateTime={article.date}>
                      {archiveDate.format(new Date(article.date))}
                    </time>
                    <span aria-hidden="true">↗</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </main>
  )
}

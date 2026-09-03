/*
 * me.ts — the single place to edit facts about Jannik.
 *
 * The rail on the homepage renders `headline`, `now`, `built` and `links`;
 * the no-JS terminal fallback renders `short`; the chat agent builds its
 * system prompt from this whole object plus the generated article index.
 * Nothing here is derived at runtime — change a fact here and it changes
 * everywhere. The exported shape is a contract; do not rename fields.
 *
 * Everything below is taken from what was already public on this site
 * (the previous about page and resume). Nothing is inferred or invented.
 */

export interface MeLink {
  label: string
  href: string
}

export interface MeRole {
  company: string
  title: string
  start: string
  end: string
}

export interface MeProject {
  name: string
  description: string
  href?: string
}

export interface Me {
  name: string
  headline: string
  location: string
  email: string
  short: string
  long: string[]
  now: string[]
  built: MeProject[]
  roles: MeRole[]
  links: MeLink[]
  agentNotes: string[]
}

/** Where the project work lives. Rendered as the one project reference in the
 *  rail and reused by `built` below, so the URL exists exactly once. */
export const projectsUrl = 'https://phanes.net'

export const me: Me = {
  name: 'Jannik Schröder',
  headline: 'System administrator. Paderborn, Germany.',
  location: 'Paderborn, Germany',
  email: 'contact@jsde.me',

  short:
    'I’m Jannik Schröder, a system administrator in Paderborn, Germany. I work with Linux systems, automation and network engineering, I care about open source, and I write up what I build and break in my homelab. Since mid-2026 I also run my own side business, building and operating web applications and SaaS products and offering IT consulting.',

  long: [
    'Ever since I could remember, the world of technology has been my playground and my passion. My journey began in the heart of Germany, where I embraced the role of a system administrator, a title that barely scratches the surface of my ever-evolving tech expertise. By day, I navigate through the complex labyrinths of Linux systems, orchestrating data pipelines with a maestro’s finesse and automating processes with the precision of a Swiss watch. But it’s in the quiet hours, away from the humming servers, that my true adventure unfolds.',
    'In the sanctity of my personal space, my fingers dance across the keyboard, breathing life into side projects that are more than mere code — they are pieces of my curiosity and ambition woven into digital tapestries. Whether it’s delving into the realms of redundance and resilience, or unearthing new technologies, each project is a step further into the unknown, a challenge I eagerly embrace. This pursuit of knowledge isn’t just a hobby; it’s a journey I document and share on my blog, a kaleidoscope of thoughts, reflections, and everything in between.',
    'But my aspirations transcend the confines of personal growth. As a staunch advocate for open source, I see the infinite potential in collaborative creativity. It’s why I’m constantly on the lookout for like-minded souls, for those sparks of connection that transform solitary ideas into revolutionary innovations.',
    'Today, my focus lies in open source software and network engineering. I enjoy designing resilient network infrastructures, contributing to open source projects, and pushing the boundaries of what’s possible in my homelab — driven by the belief that the only real limit is the horizon of our imagination. Since mid-2026 I also run my own side business, building and operating web applications and SaaS products and offering IT consulting.',
  ],

  // Derived from the most recent article titles. Hand-maintained: when a new
  // article goes up, this list is what tells the rail (and the agent) that it
  // is what I am currently on.
  now: [
    'A dedicated HiFi endpoint with Plexamp',
    'Backups you actually restore',
    'Self-hosted mail with Stalwart in a DMZ',
    'Alerting that doesn’t cry wolf: LibreNMS, ntfy, LTE-SMS failover',
  ],

  built: [
    {
      name: 'Solun',
      description:
        'Sharing files, text and mail with end-to-end encryption, without having to worry about your privacy.',
      href: 'https://solun.pm',
    },
    {
      name: 'Phanes',
      description: 'Where my projects live.',
      href: projectsUrl,
    },
    {
      name: 'The homelab',
      description:
        'The network, servers and services most of the articles here are about.',
    },
  ],

  // Newest first.
  roles: [
    {
      company: 'Self-employed',
      title: 'Web applications, SaaS & IT consulting',
      start: 'July 2026',
      end: 'Present',
    },
    {
      company: 'Erzbistum Paderborn',
      title: 'IT Specialist Cloud & Virtualization',
      start: 'May 2026',
      end: 'Present',
    },
    {
      company: 'Erzbistum Paderborn',
      title: 'IT Application Manager Hardware',
      start: 'January 2025',
      end: 'April 2026',
    },
    {
      company: 'Erzbistum Paderborn',
      title: 'IT Support Technician',
      start: 'July 2024',
      end: 'December 2024',
    },
    {
      company: 'e2ex OÜ',
      title: 'Co-founder',
      start: 'December 2023',
      end: 'February 2026',
    },
    {
      company: 'University of Paderborn',
      title: 'Apprenticeship, system administration',
      start: 'August 2021',
      end: 'June 2024',
    },
  ],

  links: [
    { label: 'Email', href: 'mailto:contact@jsde.me' },
    { label: 'GitHub', href: 'https://github.com/Jannik-Schroeder' },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/jannik-schr%C3%B6der-7b1553231/',
    },
    { label: 'X', href: 'https://twitter.com/jsde_me' },
    { label: 'RSS', href: '/feed.xml' },
  ],

  // Extra context for the chat agent only — never rendered anywhere.
  // Left empty on purpose: Jannik fills this in himself.
  agentNotes: [],
}

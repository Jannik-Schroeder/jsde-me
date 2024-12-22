import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import Resume from '@/components/Resume'
import { Container } from '@/components/Container'
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from '@/components/SocialIcons'
import portraitImage from '@/images/portrait.jpg'

function SocialLink({
  className,
  href,
  children,
  icon: Icon,
}: {
  className?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <li className={clsx(className, 'flex')}>
      <Link
        href={href}
        className="group flex text-sm font-medium text-zinc-800 transition hover:text-teal-500 dark:text-zinc-200 dark:hover:text-teal-500"
      >
        <Icon className="h-6 w-6 flex-none fill-zinc-500 transition group-hover:fill-teal-500" />
        <span className="ml-4">{children}</span>
      </Link>
    </li>
  )
}

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
      />
    </svg>
  )
}

export const metadata: Metadata = {
  title: 'About',
  description:
    'I’m Spencer Sharp. I live in New York City, where I design the future.',
}

export default function About() {
  return (
    <Container className="mt-16 sm:mt-32">
      <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12">
        <div className="lg:pl-20">
          <div className="max-w-xs px-2.5 lg:max-w-none">
            <Image
              src={portraitImage}
              alt=""
              sizes="(min-width: 1024px) 32rem, 20rem"
              className="aspect-square rotate-3 rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800"
            />
          </div>
        </div>
        <div className="lg:order-first lg:row-span-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
            I’m Jannik Schröder. I live in Paderborn, Germany.
          </h1>
          <div className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400">

            <p>
              Ever since I could remember, the world of technology has been my playground and my passion. My journey
              began in the heart of Germany, where I embraced the role of a system administrator, a title that barely
              scratches the surface of my ever-evolving tech expertise. By day, I navigate through the complex
              labyrinths of Linux systems, orchestrating data pipelines with a maestro&apos;s finesse and automating
              processes with the precision of a Swiss watch. But it&apos;s in the quiet hours, away from the humming servers,
              that my true adventure unfolds.
            </p>
            <p>
              In the sanctity of my personal space, my fingers dance across the keyboard, breathing life into side
              projects that are more than mere code—they are pieces of my curiosity and ambition woven into digital
              tapestries. Whether it&apos;s delving into the realms of redundance and resilience, or unearthing new
              technologies, each project is a step further into the unknown, a challenge I eagerly embrace. This pursuit
              of knowledge isn&apos;t just a hobby; it&apos;s a journey I document and share on my blog, a kaleidoscope of
              thoughts, reflections, and everything in between.
            </p>
            <p>
              But my aspirations transcend the confines of personal growth. As a staunch advocate for open source, I see
              the infinite potential in collaborative creativity. It&apos;s why I&apos;m constantly on the lookout for like-minded
              souls, for those sparks of connection that transform solitary ideas into revolutionary innovations.
              Through the digital corridors of email and Telegram, I extend an open invitation to the world, to join me
              in this quest for technological breakthroughs.
            </p>
            <p>
              Today, my focus is e2ex OÜ, a beacon of passion and dedication. Here, we don&apos;t just work with technology;
              we live and breathe it, crafting solutions that are as resilient as they are innovative. As I continue
              this journey, I am driven by a simple yet profound belief: that in the vast, interconnected world of
              technology, the only real limit is the horizon of our imagination.
            </p>
          </div>
        </div>
        <div className="lg:pl-20">
          <ul role="list">
            <SocialLink href="https://twitter.com/jsde_me" icon={XIcon}>
              Follow on X
            </SocialLink>
            <SocialLink href="https://www.instagram.com/hijannikschroeder/" icon={InstagramIcon} className="mt-4">
              Follow on Instagram
            </SocialLink>
            <SocialLink href="https://github.com/Jannik-Schroeder" icon={GitHubIcon} className="mt-4">
              Follow on GitHub
            </SocialLink>
            <SocialLink href="https://www.linkedin.com/in/jannik-schr%C3%B6der-7b1553231/" icon={LinkedInIcon}
                        className="mt-4">
              Follow on LinkedIn
            </SocialLink>
            <SocialLink
                href="mailto:contact@jsde.me"
                icon={MailIcon}
                className="mt-8 mb-8 border-t border-zinc-100 pt-8 dark:border-zinc-700/40"
            >
              contact@jsde.me
            </SocialLink>
          </ul>
          <Resume />
        </div>
      </div>
    </Container>
  )
}

import { Card } from '@/components/Card'
import { Section } from '@/components/Section'
import { SimpleLayout } from '@/components/SimpleLayout'

function ToolsSection({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Section>) {
  return (
    <Section {...props}>
      <ul role="list" className="space-y-16">
        {children}
      </ul>
    </Section>
  )
}

function Tool({
  title,
  href,
  children,
}: {
  title: string
  href?: string
  children: React.ReactNode
}) {
  return (
    <Card as="li">
      <Card.Title as="h3" href={href}>
        {title}
      </Card.Title>
      <Card.Description>{children}</Card.Description>
    </Card>
  )
}

export const metadata = {
  title: 'Uses',
  description: 'Software I use, gadgets I love, and other things I recommend.',
}

export default function Uses() {
  return (
    <SimpleLayout
      title="Software I use, gadgets I love, and other things I recommend."
      intro="I get asked a lot about the things I use to build software, stay productive, or buy to fool myself into thinking I’m being productive when I’m really just procrastinating. Here’s a big list of all of my favorite stuff."
    >
      <div className="space-y-20">
        <ToolsSection title="Workstation">
          <Tool title="14” MacBook Pro, M3 Pro">
            I was using an Windows Laptop from HP prior to this and the
            difference is night and day. I’ve never heard the fans turn on a
            single time, even under the incredibly heavy loads I put it through
            with our various launch simulations.
          </Tool>
          <Tool title="Keychron V3">
            They don’t make keyboards the way they used to. This is my first
            Keychron and I’m already a fan. I love the feel of the keys and the
            backlighting is a nice touch.
          </Tool>
          <Tool title="MX Master 3S for Mac">
            Something about all the buttons makes me feel like a wizard with
            special powers. I really like feeling like a wizard with special
            powers.
          </Tool>
        </ToolsSection>
        <ToolsSection title="Development tools">
          <Tool title="JetBrains IDEs">
            I’ve been using IntelliJ IDEA for years and I’ve never found
            anything that comes close to the productivity I get with it. I also
            use WebStorm for my JavaScript and TypeScript work.
          </Tool>
          <Tool title="iTerm2">
            I’m honestly not even sure what features I get with this that aren’t
            just part of the macOS Terminal but it’s what I use.
          </Tool>
          <Tool title="DataGrip">
            I’m not sure why I like using Datagrip so much but I do. It’s just
            the best way to interact with databases.
          </Tool>
        </ToolsSection>
        <ToolsSection title="Design">
          <Tool title="Figma">
            We started using Figma as just a design tool but now it’s become our
            virtual whiteboard for the entire company. Never would have expected
            the collaboration features to be the real hook.
          </Tool>
            <Tool title="Excalidraw">
            I’m not a designer but I do like to sketch out ideas and Excalidraw
            is the best tool I’ve found for that. It’s like a whiteboard but
            better.
            </Tool>
        </ToolsSection>
      </div>
    </SimpleLayout>
  )
}

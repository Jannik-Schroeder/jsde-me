import { type MDXComponents } from 'mdx/types'
import Image, { type ImageProps } from 'next/image'

const components: MDXComponents = {
  // alt comes from the MDX call site.
  // eslint-disable-next-line jsx-a11y/alt-text
  Image: (props: ImageProps) => <Image {...props} />,
}

export function useMDXComponents(): MDXComponents {
  return components
}

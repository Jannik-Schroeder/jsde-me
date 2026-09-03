import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // MDX article pages live next to the .tsx routes in src/app.
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  // Slim runtime image for the Dockerfile's runner stage.
  output: 'standalone',
  async redirects() {
    return [
      { source: '/about', destination: '/', permanent: true },
      { source: '/gallery', destination: '/', permanent: true },
      { source: '/speaking', destination: '/', permanent: true },
      { source: '/thank-you', destination: '/', permanent: true },
    ]
  },
}

// Turbopack cannot receive JavaScript plugin functions (they can't cross into
// Rust), so remark/rehype plugins are named as strings with serializable
// options only. See https://nextjs.org/docs/app/guides/mdx
const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: [
      [
        'rehype-pretty-code',
        {
          theme: 'github-dark-default',
          keepBackground: false,
          defaultLang: 'text',
        },
      ],
    ],
  },
})

export default withMDX(nextConfig)

import coreWebVitals from 'eslint-config-next/core-web-vitals'

// next lint was removed in Next 16; ESLint is invoked directly via flat config.
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      'src/lib/articles.generated.ts',
    ],
  },
  ...coreWebVitals,
]

export default config

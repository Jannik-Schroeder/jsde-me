#!/usr/bin/env node
/*
 * generate-articles.mjs — build-time article index generator.
 *
 * Scans every `src/app/articles/<slug>/page.mdx`, extracts the exported
 * `article` object literal, and writes `src/lib/articles.generated.ts`.
 *
 *   Input   Each file exports a plain object literal named `article`:
 *             export const article = {
 *               author: string,
 *               date: string,   // 'YYYY-MM-DD'
 *               title: string,
 *               description: string,
 *             }
 *
 *   Output  `src/lib/articles.generated.ts`, overwritten in place:
 *             import type { ArticleMeta } from './articles'
 *             export const generatedArticles: ArticleMeta[] = [ ... ]
 *           `slug` is the directory name. Entries carry exactly the five
 *           fields of ArticleMeta (slug, title, date, description, author),
 *           sorted by date descending (ties broken by slug ascending, so
 *           the output is deterministic run to run).
 *
 * This script must never be able to produce a build with zero articles
 * silently: any parse failure, or a final count that isn't exactly the
 * expected number of articles on disk, exits non-zero with a clear message.
 * That silent-zero failure mode (Turbopack's dynamic glob import returning
 * an empty list without erroring) is the exact bug this script replaces.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const articlesDir = path.join(repoRoot, 'src/app/articles')
const outFile = path.join(repoRoot, 'src/lib/articles.generated.ts')

/**
 * Extract the raw `{ ... }` source text of `export const article = { ... }`
 * from an MDX file's contents, using brace counting that is aware of string
 * literals (so braces or `export const` occurring inside a description
 * string can't confuse it). Returns null if no `article` export is found.
 */
function extractArticleObjectSource(source, filePath) {
  const marker = /export\s+const\s+article\s*=\s*/.exec(source)
  if (!marker) return null

  let i = marker.index + marker[0].length
  if (source[i] !== '{') {
    throw new Error(
      `${filePath}: expected "{" right after "export const article =", found ${JSON.stringify(source[i])}`,
    )
  }

  const start = i
  let depth = 0
  let quote = null // null | "'" | '"' | '`'

  for (; i < source.length; i++) {
    const ch = source[i]

    if (quote) {
      if (ch === '\\') {
        i++ // skip escaped character
        continue
      }
      if (ch === quote) quote = null
      continue
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch
      continue
    }

    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) {
        return source.slice(start, i + 1)
      }
    }
  }

  throw new Error(
    `${filePath}: unterminated "article" object literal (unbalanced braces)`,
  )
}

/**
 * Evaluate an extracted object literal as real JavaScript to get a plain
 * object back. This is deliberately not a regex-based field extractor:
 * descriptions contain quotes, apostrophes and commas that make naive
 * pattern matching unreliable. The source is our own repo's MDX files, not
 * untrusted input.
 */
function evaluateObjectLiteral(objectSource, filePath) {
  try {
    const factory = new Function(`"use strict"; return (${objectSource});`)
    return factory()
  } catch (err) {
    throw new Error(
      `${filePath}: failed to evaluate "article" object literal: ${err.message}`,
    )
  }
}

const REQUIRED_FIELDS = ['author', 'date', 'title', 'description']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function validateArticle(obj, filePath) {
  for (const field of REQUIRED_FIELDS) {
    if (typeof obj[field] !== 'string' || obj[field].trim() === '') {
      throw new Error(
        `${filePath}: "article.${field}" must be a non-empty string, got ${JSON.stringify(obj[field])}`,
      )
    }
  }
  if (!DATE_RE.test(obj.date)) {
    throw new Error(
      `${filePath}: "article.date" must be "YYYY-MM-DD", got ${JSON.stringify(obj.date)}`,
    )
  }
}

function fail(message) {
  console.error(`generate-articles: ${message}`)
  process.exit(1)
}

function hasPageMdx(dir) {
  try {
    return statSync(path.join(dir, 'page.mdx')).isFile()
  } catch {
    return false
  }
}

let slugDirs
try {
  slugDirs = readdirSync(articlesDir).filter((entry) => {
    const full = path.join(articlesDir, entry)
    return statSync(full).isDirectory() && hasPageMdx(full)
  })
} catch (err) {
  fail(`could not read ${articlesDir}: ${err.message}`)
}

slugDirs.sort()

const entries = []

for (const slug of slugDirs) {
  const filePath = path.join(articlesDir, slug, 'page.mdx')
  const relPath = path.relative(repoRoot, filePath)
  let source
  try {
    source = readFileSync(filePath, 'utf8')
  } catch (err) {
    fail(`could not read ${relPath}: ${err.message}`)
  }

  let objectSource
  try {
    objectSource = extractArticleObjectSource(source, relPath)
  } catch (err) {
    fail(err.message)
  }

  if (!objectSource) {
    fail(`${relPath}: no "export const article = { ... }" found`)
  }

  let article
  try {
    article = evaluateObjectLiteral(objectSource, relPath)
  } catch (err) {
    fail(err.message)
  }

  try {
    validateArticle(article, relPath)
  } catch (err) {
    fail(err.message)
  }

  entries.push({
    slug,
    title: article.title,
    date: article.date,
    description: article.description,
    author: article.author,
  })
}

const EXPECTED_COUNT = 32
if (entries.length !== EXPECTED_COUNT) {
  fail(
    `expected exactly ${EXPECTED_COUNT} articles, found ${entries.length}. ` +
      `A count mismatch means articles were silently skipped or the ` +
      `expected total changed — update EXPECTED_COUNT deliberately if the ` +
      `article count really changed, do not ignore this.`,
  )
}

// Deterministic order: newest first, ties broken by slug so the output is
// byte-identical across runs regardless of filesystem readdir ordering.
entries.sort((a, z) => {
  const byDate = +new Date(z.date) - +new Date(a.date)
  if (byDate !== 0) return byDate
  return a.slug < z.slug ? -1 : a.slug > z.slug ? 1 : 0
})

function tsStringLiteral(value) {
  return JSON.stringify(value)
}

const entriesSource = entries
  .map(
    (e) =>
      `  {\n` +
      `    slug: ${tsStringLiteral(e.slug)},\n` +
      `    title: ${tsStringLiteral(e.title)},\n` +
      `    date: ${tsStringLiteral(e.date)},\n` +
      `    description: ${tsStringLiteral(e.description)},\n` +
      `    author: ${tsStringLiteral(e.author)},\n` +
      `  },`,
  )
  .join('\n')

const output =
  `// AUTO-GENERATED by scripts/generate-articles.mjs — do not edit by hand.\n` +
  `// Regenerate with \`node scripts/generate-articles.mjs\` (also runs via\n` +
  `// predev/prebuild). Source of truth is the "article" export in each\n` +
  `// src/app/articles/<slug>/page.mdx.\n` +
  `import type { ArticleMeta } from './articles'\n` +
  `\n` +
  `export const generatedArticles: ArticleMeta[] = [\n${entriesSource}\n]\n`

try {
  writeFileSync(outFile, output, 'utf8')
} catch (err) {
  fail(`could not write ${outFile}: ${err.message}`)
}

console.log(
  `generate-articles: wrote ${entries.length} articles to src/lib/articles.generated.ts`,
)

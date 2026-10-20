import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFile = promisify(execFileCallback)
const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)))
const sidebarPath = resolve(
  rootDirectory,
  'docs/.vuepress/configs/sidebar/index.ts',
)

export function markdownToOutputPath(markdownPath) {
  const normalized = markdownPath.replace(/^\//, '')

  if (normalized.endsWith('/README.md')) {
    return normalized.slice(0, -'README.md'.length)
  }

  return normalized.replace(/\.md$/, '.html')
}

export function parseSidebar(source) {
  const entries = []
  let currentSection = ''
  let inChildren = false

  for (const line of source.split('\n')) {
    const sectionMatch = line.match(/^\s*text:\s*'([^']*)',\s*$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      continue
    }

    if (/^\s*children:\s*\[\s*$/.test(line)) {
      inChildren = true
      continue
    }

    if (inChildren && /^\s*],?\s*$/.test(line)) {
      inChildren = false
      continue
    }

    if (!inChildren) continue

    const pageMatch = line.match(/^\s*'\/([^']+\.md)',?\s*$/)
    if (pageMatch) {
      entries.push({
        chapter: currentSection,
        source: `docs/${pageMatch[1]}`,
        output: markdownToOutputPath(pageMatch[1]),
      })
    }
  }

  return entries
}

async function findContributor(source) {
  try {
    const { stdout } = await execFile('git', ['log', '-1', '--format=%an', '--', source], {
      cwd: rootDirectory,
    })
    return stdout.trim() || 'Данил Чугаев'
  } catch {
    return 'Данил Чугаев'
  }
}

export async function createBookManifest() {
  const sidebar = await readFile(sidebarPath, 'utf8')
  const sidebarEntries = parseSidebar(sidebar)
  const seen = new Set()
  const pages = []

  for (const entry of sidebarEntries) {
    if (entry.source === 'docs/guide/content.md' || seen.has(entry.source)) continue
    seen.add(entry.source)
    pages.push({ ...entry, contributor: await findContributor(entry.source) })
  }

  if (pages.length === 0) {
    throw new Error('Не удалось получить страницы книги из sidebar')
  }

  return {
    generatedAt: new Date().toISOString(),
    source: 'docs/.vuepress/configs/sidebar/index.ts',
    pages,
  }
}

async function main() {
  const manifest = await createBookManifest()
  console.log(`Манифест книги: ${manifest.pages.length} страниц`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}

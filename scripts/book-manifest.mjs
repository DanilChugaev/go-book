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
const primaryAuthor = {
  name: 'Данил Чугаев',
  github: 'DanilChugaev',
}

function normalizeContributor(name, email) {
  const normalizedName = name.trim()
  const isPrimaryAuthor = normalizedName === 'Danil Chugaev'
    || normalizedName === 'DanilChugaev'
    || email === 'danilchugaev@mail.ru'
    || email === 'dmchugaev@gmail.com'

  if (isPrimaryAuthor) return primaryAuthor

  const githubMatch = email.match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/)
  return {
    name: normalizedName || 'Неизвестный контрибьютор',
    github: githubMatch?.[1] ?? null,
  }
}

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
    const { stdout } = await execFile('git', ['log', '-1', '--format=%aN%x1f%aE', '--', source], {
      cwd: rootDirectory,
    })
    const [name = primaryAuthor.name, email = ''] = stdout.trim().split('\x1f')
    return normalizeContributor(name, email)
  } catch {
    return primaryAuthor
  }
}

async function findExampleSource(source) {
  if (!source.endsWith('/practice.md')) return null

  const content = await readFile(resolve(rootDirectory, source), 'utf8')
  const match = content.match(/<ExampleSource\s+path="([^"]+)"\s+description="([^"]+)"\s*\/>/u)
  if (!match) {
    throw new Error(`В странице заданий нет ExampleSource: ${source}`)
  }

  return { path: match[1], description: match[2] }
}

export async function createBookManifest() {
  const sidebar = await readFile(sidebarPath, 'utf8')
  const sidebarEntries = parseSidebar(sidebar)
  const seen = new Set()
  const pages = []

  for (const entry of sidebarEntries) {
    if (entry.source === 'docs/guide/content.md' || seen.has(entry.source)) continue
    seen.add(entry.source)
    const contributor = await findContributor(entry.source)
    const exampleSource = await findExampleSource(entry.source)
    pages.push({
      ...entry,
      contributor: contributor.name,
      contributorGitHub: contributor.github,
      exampleSource,
    })
  }

  if (pages.length === 0) {
    throw new Error('Не удалось получить страницы книги из sidebar')
  }

  return {
    generatedAt: new Date().toISOString(),
    source: 'docs/.vuepress/configs/sidebar/index.ts',
    pages,
    contributors: [...new Map(pages.map((page) => [page.contributor, {
      name: page.contributor,
      github: page.contributorGitHub,
    }])).values()],
  }
}

async function main() {
  const manifest = await createBookManifest()
  console.log(`Манифест книги: ${manifest.pages.length} страниц`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}

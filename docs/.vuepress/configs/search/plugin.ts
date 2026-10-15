import type { Page, Plugin } from 'vuepress'
import type { SidebarItemOptions } from '@vuepress/theme-default'

import { sidebarEn } from '../sidebar/index.js'
import type { ISearchIndex, ISearchPage } from './types.js'

/**
 * Верхняя граница объёма чистого текста страницы.
 * Защита от патологически длинных страниц; ни одна страница
 * учебника вблизи этого значения не находится.
 */
const MAX_TEXT_LENGTH = 100_000

interface ChapterEntry {
  title: string
  link: string
  children: string[]
}

/**
 * «Логический путь» для сопоставления: `/guide/strings/README.md` и
 * `/guide/strings/` дают `/guide/strings/`, а `.../tests.md` — `.../tests`.
 */
const toLogical = (path: string): string => {
  let result = path.replace(/\.md$/, '').replace(/\.html$/, '')
  if (/\/(README|index)$/i.test(result)) {
    result = result.replace(/\/(README|index)$/i, '/')
  }
  return result
}

/**
 * Ключ маршрута (формат ключей таблицы маршрутов): директории
 * остаются с завершающим слешем, остальные страницы получают `.html`.
 */
const toRouteKey = (logical: string): string =>
  logical.endsWith('/') ? logical : `${logical}.html`

/**
 * Из структуры сайдбара собирает список глав: именованные группы
 * с дочерними пунктами. Промежуточные группы без названия
 * (корень сайдбара) обходятся рекурсивно.
 */
const collectChapters = (items: SidebarItemOptions[]): ChapterEntry[] => {
  const chapters: ChapterEntry[] = []

  const walk = (list: SidebarItemOptions[]): void => {
    for (const item of list) {
      if (typeof item === 'string' || !('children' in item)) continue
      if (!Array.isArray(item.children)) continue

      if (item.text) {
        chapters.push({
          title: item.text,
          link:
            item.link ??
            (typeof item.children[0] === 'string' ? item.children[0] : ''),
          children: item.children.filter(
            (child): child is string => typeof child === 'string'
          ),
        })
      } else {
        walk(item.children)
      }
    }
  }

  walk(items)
  return chapters
}

/**
 * Убирает блок frontmatter, если он всё-таки попал в начало содержимого
 * (обычно `page.content` передаётся уже без него). Блок считается
 * frontmatter только если в нём есть двоеточие — иначе это просто
 * разделительная линия в начале текста.
 */
const stripFrontmatter = (markdown: string): string => {
  if (!markdown.startsWith('---')) return markdown

  const end = markdown.indexOf('\n---', 3)
  if (end === -1) return markdown

  if (!markdown.slice(0, end).includes(':')) return markdown

  const newline = markdown.indexOf('\n', end + 1)
  return newline === -1 ? '' : markdown.slice(newline + 1)
}

const FENCE_LINE = /^\s*(```|~~~)/
const SCRIPT_OPEN = /^\s*<script\b/i
const SCRIPT_CLOSE = /^\s*<\/script>/i
const HTML_TAG = /<\/?[A-Za-z][\w.:-]*(?:\s+[^<>]*?)?\s*(\/?)>/g
const LINK = /!?\[([^\]]*)\]\([^)]*\)/g
const AUTOLINK = /<(\S+@\S+|https?:\/\/\S+)>/g
const STRING_LITERAL = /['"]([^'"\n]*)['"]/g

/**
 * Извлекает текст, который реально отображается на странице: убирает
 * разметку (заголовки, списки, цитаты, ссылки, теги) и обрамление,
 * но сохраняет код внутри блоков и строковые литералы из
 * `<script>`-блоков markdown (вопросы викторин, данные примеров).
 */
const toPlainText = (markdown: string): string => {
  const source = stripFrontmatter(markdown)
  const lines: string[] = []
  let inFence = false
  let inScript = false

  for (const rawLine of source.split(/\r?\n/)) {
    if (FENCE_LINE.test(rawLine)) {
      inFence = !inFence
      continue
    }

    if (inFence) {
      lines.push(rawLine)
      continue
    }

    if (SCRIPT_OPEN.test(rawLine)) {
      inScript = true
      continue
    }

    if (inScript) {
      if (SCRIPT_CLOSE.test(rawLine)) {
        inScript = false
      } else {
        const literals: string[] = []
        for (const match of rawLine.matchAll(STRING_LITERAL)) {
          literals.push(match[1].replace(/`/g, ''))
        }
        if (literals.length > 0) {
          lines.push(literals.join(' '))
        }
      }
      continue
    }

    let line = rawLine
    line = line.replace(/<!--[\s\S]*?-->/g, ' ')
    line = line.replace(HTML_TAG, ' ')
    line = line.replace(LINK, '$1')
    line = line.replace(AUTOLINK, '$1')
    line = line.replace(/^#{1,6}\s+/, '')
    line = line.replace(/^\s*>\s?/, '')
    line = line.replace(/^\s*(?:[-*+]|\d+\.)\s+\[[xX ]\]\s+/, '')
    line = line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '')
    line = line.replace(/\*\*|__/g, '')
    line = line.replace(/`/g, '')
    lines.push(line)
  }

  return lines.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Собирает индекс поиска:
 *
 * - главы — из структуры сайдбара (маршруты нормализуются к ключам
 *   таблицы маршрутов);
 * - страницы — из `app.pages`, каждая сопоставляется со своей главой,
 *   текст извлекается из markdown.
 */
const buildIndex = (app: { pages: Page[] }): ISearchIndex => {
  const items: SidebarItemOptions[] = []
  if (Array.isArray(sidebarEn)) {
    items.push(...sidebarEn)
  } else if (sidebarEn !== 'heading') {
    for (const group of Object.values(sidebarEn)) {
      if (Array.isArray(group)) items.push(...group)
    }
  }

  const chapters = collectChapters(items)

  const pagesByLogical = new Map<string, Page>()
  for (const page of app.pages) {
    pagesByLogical.set(toLogical(page.path), page)
  }

  const chapterRoute = (chapter: ChapterEntry): string => {
    for (const link of [chapter.link, ...chapter.children]) {
      const page = pagesByLogical.get(toLogical(link))
      if (page) return page.path
    }
    return toRouteKey(toLogical(chapter.link))
  }

  const chapterByLogical = new Map<string, ChapterEntry>()
  for (const chapter of chapters) {
    chapterByLogical.set(toLogical(chapter.link), chapter)
    for (const child of chapter.children) {
      chapterByLogical.set(toLogical(child), chapter)
    }
  }

  const pages: ISearchPage[] = app.pages
    // Страница «404» в поиске бесполежна
    .filter((page) => page.path !== '/404.html')
    .map((page) => {
      const chapter = chapterByLogical.get(toLogical(page.path))
      const title =
        page.path === '/'
          ? 'Главная'
          : (page.data?.title ?? '').trim() || page.title?.trim() || ''

      return {
        path: page.path,
        title,
        chapter: chapter?.title,
        chapterPath: chapter ? chapterRoute(chapter) : undefined,
        text: toPlainText(page.content).slice(0, MAX_TEXT_LENGTH),
      }
    })

  return {
    chapters: chapters.map((chapter) => ({
      title: chapter.title,
      path: chapterRoute(chapter),
    })),
    pages,
  }
}

/**
 * Плагин поиска: на этапе инициализации приложения собирает индекс
 * (главы + страницы с текстом) и пишет его в temp-фолдер
 * `search/data.js`. Компонент `SearchBox` подхватывает модуль лениво —
 * отдельным чанком, который скачивается только при первом
 * использовании поиска.
 */
export const searchPlugin = (): Plugin => ({
  name: 'go-book-search',

  onInitialized: async (app): Promise<void> => {
    const index = buildIndex(app)

    await app.writeTemp(
      'search/data.js',
      `export const searchIndex = ${JSON.stringify(index)}\n`
    )
  }
})

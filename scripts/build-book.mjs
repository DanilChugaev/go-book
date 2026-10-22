import { createServer } from 'node:http'
import { copyFile, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'cheerio'
import puppeteer from 'puppeteer-core'

import { createBookManifest } from './book-manifest.mjs'

const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distDirectory = resolve(rootDirectory, 'docs/.vuepress/dist')
const publicDirectory = resolve(rootDirectory, 'docs/.vuepress/public')
const printHtmlPath = resolve(distDirectory, 'book-print.html')
const outputPdfPath = resolve(publicDirectory, 'go-book.pdf')
const outputManifestPath = resolve(publicDirectory, 'book-manifest.json')
const pdfMetadataPath = resolve(publicDirectory, 'book-pdf-meta.json')
const pagedJsPath = resolve(rootDirectory, 'node_modules/pagedjs/dist/paged.polyfill.js')

const chromeCandidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

const chromiumLaunchArgs = [
  '--no-first-run',
  '--no-default-browser-check',
  // GitHub-hosted runners запускают Chrome в окружении, где sandbox может
  // быть недоступен. Локальный запуск сохраняет sandbox по умолчанию.
  ...(process.env.CI ? ['--no-sandbox', '--disable-setuid-sandbox'] : []),
]

export function findChrome() {
  return chromeCandidates.find((candidate) => existsSync(candidate))
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function toBookHref(output) {
  return `#${output.replace(/\/$/, '') || 'guide'}`
}

function createTableOfContents(pages) {
  const sections = new Map()

  for (const page of pages) {
    const section = page.chapter || 'Учебник'
    const items = sections.get(section) ?? []
    items.push(page)
    sections.set(section, items)
  }

  return [...sections.entries()]
    .map(([section, items]) => `
      <section class="book-toc__section">
        ${section ? `<h2>${escapeHtml(section)}</h2>` : ''}
        <ol>
          ${items
            .map(
              (page) => `<li><a href="${toBookHref(page.output)}">${escapeHtml(page.title)}</a></li>`,
            )
            .join('')}
        </ol>
      </section>`,
    )
    .join('')
}

function createContributors(contributors) {
  const items = [...contributors]
    .sort((first, second) => first.name.localeCompare(second.name, 'ru'))
    .map((contributor) => contributor.github
      ? `<li><a href="https://github.com/${escapeHtml(contributor.github)}">${escapeHtml(contributor.name)}</a></li>`
      : `<li>${escapeHtml(contributor.name)}</li>`)
    .join('')

  return `<section class="book-contributors">
    <h1>Контрибьюторы</h1>
    <p>Спасибо всем, кто создавал и улучшал материалы учебника.</p>
    <ul>${items}</ul>
  </section>`
}

function createPrintDocument({ metadata, manifest, sections }) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(metadata.title)} — v${escapeHtml(metadata.version)}</title>
    <style>
      @page {
        size: A4;
        margin: 18mm 15mm 19mm;
        @bottom-center {
          content: counter(page);
          color: #57606a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 8pt;
        }
      }
      @page:first { @bottom-center { content: none; } }
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      html { background: #fff; color: #1b1b1f; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 10.5pt; line-height: 1.55; }
      body { max-width: 180mm; margin: 0 auto; }
      a { color: #147a4b; text-decoration: underline; text-decoration-thickness: .08em; text-underline-offset: .16em; }
      a[href^="http://"]::after, a[href^="https://"]::after {
        display: inline-block; width: .78em; height: .78em; margin: 0 .15em .08em .28em; vertical-align: middle; content: ''; background-color: currentColor;
        mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='black' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M14 3h7v7m0-7L10 14M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5'/%3E%3C/svg%3E") center / contain no-repeat;
      }
      h1, h2, h3, h4 { break-after: avoid-page; line-height: 1.2; }
      pre, blockquote, table, .custom-container, [class^="language-"], [class*=" language-"] {
        break-inside: avoid-page;
        page-break-inside: avoid;
      }
      .hint-container {
        --book-note-accent: #0969da;
        margin: 1rem 0;
        padding: .8rem 1rem;
        color: #1b1b1f;
        background: #ddf4ff;
        border-inline-start: .3rem solid var(--book-note-accent);
        border-radius: .25rem;
      }
      .hint-container.tip { --book-note-accent: #1a7f37; background: #dafbe1; }
      .hint-container.warning { --book-note-accent: #9a6700; background: #fff8c5; }
      .hint-container.danger { --book-note-accent: #cf222e; background: #ffebe9; }
      .hint-container-title { margin: 0 0 .35rem; color: var(--book-note-accent); font-weight: 700; }
      .hint-container > :last-child { margin-bottom: 0; }
      blockquote {
        margin: 1rem 0;
        padding: .15rem 1rem;
        color: #57606a;
        background: #f6f8fa;
        border-inline-start: .3rem solid #d0d7de;
        border-radius: .25rem;
      }
      blockquote > :first-child { margin-top: .65rem; }
      blockquote > :last-child { margin-bottom: .65rem; }
      img { max-width: 100%; height: auto; }
      .vp-navbar, .vp-sidebar, .vp-page-nav, .vp-footer, .vp-back-to-top-button, .search-box, .bookmarks-menu, .go-playground, button { display: none !important; }
      .book-cover { min-height: 255mm; display: flex; flex-direction: column; justify-content: center; break-after: page; }
      .book-cover__eyebrow { color: #147a4b; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      .book-cover h1 { margin: .25em 0; font-size: 36pt; }
      .book-cover__subtitle { max-width: 36rem; color: #57606a; font-size: 15pt; }
      .book-cover__meta { margin-top: 3rem; font-size: 11pt; }
      .book-toc { break-after: page; }
      .book-toc h1 { font-size: 25pt; }
      .book-toc__section { break-inside: avoid-page; }
      .book-toc__section h2 { margin-top: 1.5rem; font-size: 14pt; }
      .book-toc ol { margin: .5rem 0 0; padding-left: 1.4rem; }
      .book-toc li { margin: .2rem 0; }
      .book-toc a { display: block; }
      .book-toc a::after { float: right; margin-left: 1rem; color: #1b1b1f; content: target-counter(attr(href), page); }
      .book-contributors { break-after: page; }
      .book-contributors h1 { font-size: 25pt; }
      .book-contributors li + li { margin-top: .4rem; }
      .book-chapter { break-before: page; }
      .book-chapter:first-of-type { break-before: auto; }
      .book-chapter__title { margin: 0 0 2rem; color: #147a4b; font-size: 11pt; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
      .book-page + .book-page { margin-top: 2.5rem; }
      .book-page[data-source$="/practice.md"], .book-page[data-source$="/best-practices.md"] { break-before: page; }
      .book-quiz__question { break-inside: avoid-page; margin: 0 0 1.5rem; }
      .book-quiz__question h2 { margin-bottom: .55rem; font-size: 14pt; }
      .book-quiz__options { margin: 0; padding-left: 1.5rem; }
      .book-quiz__options li + li { margin-top: .25rem; }
      .book-quiz__answers { break-before: page; }
      .book-quiz__answers h2 { margin-bottom: 1rem; }
      .book-quiz__answer { break-inside: avoid-page; }
      .book-quiz__answer + .book-quiz__answer { margin-top: .8rem; }
      .book-practice-task { break-before: page; }
      .book-practice-task > :first-child { margin-top: 0; }
      .book-practice-solutions { break-before: page; }
      .book-practice-solutions > :first-child { margin-top: 0; }
      .book-practice-solutions details { display: block; }
      .book-practice-solutions summary { margin-bottom: .75rem; color: #147a4b; font-size: 14pt; font-weight: 700; list-style: none; }
      .book-practice-solutions summary::-webkit-details-marker { display: none; }
      .example-source { display: flex; gap: .75rem; margin: 1.5rem 0; padding: .85rem 1rem; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: .45rem; break-inside: avoid-page; }
      .example-source svg { flex: 0 0 auto; width: 1.3rem; height: 1.3rem; margin-top: .1rem; fill: none; stroke: #147a4b; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
      .example-source strong { font-size: .92rem; }
      .example-source p { margin: .2rem 0 0; font-size: .9rem; }
      .book-page h1 a, .book-page h2 a, .book-page h3 a, .book-page h4 a {
        color: #1b1b1f;
        text-decoration: none;
      }
      .line-numbers { display: none; }
      pre { padding: 1rem; overflow-wrap: break-word; white-space: pre-wrap; tab-size: 2; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: .35rem; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .9em; }
      :not(pre) > code { padding: .1em .25em; background: #f6f8fa; border-radius: .2rem; }
      @media print { a { color: #147a4b; } }
    </style>
    <script>
      window.PagedConfig = {
        auto: false,
        after: () => { document.documentElement.dataset.paged = 'ready' },
      }
    </script>
    <script src="/book-assets/paged.polyfill.js"></script>
  </head>
  <body>
    <section class="book-cover">
      <p class="book-cover__eyebrow">Полная версия учебника</p>
      <h1>${escapeHtml(metadata.title)}</h1>
      <p class="book-cover__subtitle">Последовательный русскоязычный курс по Go: от первой программы до backend-проекта.</p>
      <div class="book-cover__meta">
        <p><strong>Автор:</strong> <a href="${escapeHtml(metadata.authorUrl)}">${escapeHtml(metadata.author)}</a></p>
        <p><strong>Версия:</strong> v${escapeHtml(metadata.version)}</p>
        <p><strong>Актуально на:</strong> ${escapeHtml(metadata.generatedDate)}</p>
      </div>
    </section>
    <nav class="book-toc" aria-label="Содержание">
      <h1>Содержание</h1>
      <p>Ссылки ведут к соответствующим материалам внутри PDF.</p>
      ${createTableOfContents(manifest.pages)}
    </nav>
    ${createContributors(manifest.contributors)}
    ${sections.join('\n')}
  </body>
</html>`
}

export function validatePrintDocument(document, manifest) {
  const $ = load(document)
  const sourcePageCount = manifest.pages.length

  if ($('.book-cover').length !== 1) {
    throw new Error('В печатной версии отсутствует титульная страница')
  }
  if ($('.book-toc').length !== 1) {
    throw new Error('В печатной версии отсутствует содержание')
  }
  if ($('.book-page').length !== sourcePageCount) {
    throw new Error('Количество материалов в печатной версии не совпадает с манифестом')
  }
  if ($('.book-toc a').length !== sourcePageCount) {
    throw new Error('Содержание печатной версии не содержит все материалы')
  }

  $('.book-toc a[href^="#"]').each((_, link) => {
    const target = $(link).attr('href')?.slice(1)
    if (!target || $(`[id="${target}"]`).length === 0) {
      throw new Error(`В содержании печатной версии битая ссылка: ${target ?? 'без якоря'}`)
    }
  })
}

async function readPage(entry) {
  const pagePath = resolve(distDirectory, entry.output, 'index.html')
  const alternativePagePath = resolve(distDirectory, entry.output)
  const sourcePath = existsSync(pagePath) ? pagePath : alternativePagePath
  const html = await readFile(sourcePath, 'utf8')
  const $ = load(html)
  const contentRoot = $('#content')
  namespacePageAnchors($, contentRoot, entry)
  preparePageForPrint($, contentRoot, entry)
  const content = contentRoot.html()
  const title = $('#content h1').first().text().trim()

  if (!content || !title) {
    throw new Error(`Не удалось извлечь содержимое страницы ${entry.source}`)
  }

  return { ...entry, title, content }
}

function toBookAnchorFromHref(href) {
  const basePath = '/go-book/'
  if (!href.startsWith(basePath)) return null

  const [path, fragment] = href.slice(basePath.length).split('#', 2)
  if (!path.startsWith('guide/')) return null

  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path
  return `#${normalizedPath || 'guide'}${fragment ? `--${fragment}` : ''}`
}

export function namespacePageAnchors($, contentRoot, entry) {
  const pageId = entry.output.replace(/\/$/, '') || 'guide'
  const idMap = new Map()

  contentRoot.find('[id]').each((_, element) => {
    const originalId = $(element).attr('id')
    if (!originalId) return
    const namespacedId = `${pageId}--${originalId}`
    idMap.set(originalId, namespacedId)
    $(element).attr('id', namespacedId)
  })

  contentRoot.find('a[href]').each((_, element) => {
    const link = $(element)
    const href = link.attr('href')
    if (!href) return

    if (href.startsWith('#')) {
      const anchor = idMap.get(href.slice(1))
      if (anchor) link.attr('href', `#${anchor}`)
      return
    }

    const bookAnchor = toBookAnchorFromHref(href)
    if (bookAnchor) link.attr('href', bookAnchor)
  })
}

function renderNodes($, nodes) {
  return nodes.map((node) => $.html(node)).join('')
}

export function prepareQuizForPrint($, quizContainer) {
  const questions = quizContainer.find('.quiz').toArray().map((quiz, index) => {
    const question = $(quiz)
    const title = question.find('.quiz__title').first().html() ?? `Вопрос ${index + 1}`
    const options = question.find('.quiz__option').toArray().map((option) => {
      const optionElement = $(option)
      return {
        text: optionElement.find('div > span').first().html() ?? optionElement.text().trim(),
        correct: optionElement.attr('data-correct') === 'true',
      }
    })

    return { title, options }
  })

  if (questions.length === 0) return

  const printableQuestions = questions.map((question) => `
    <section class="book-quiz__question">
      <h2>${question.title}</h2>
      <ol class="book-quiz__options" type="A">
        ${question.options.map((option) => `<li>${option.text}</li>`).join('')}
      </ol>
    </section>`).join('')
  const answers = questions.map((question, index) => {
    const correct = question.options.find((option) => option.correct)
    return `<p class="book-quiz__answer"><strong>${index + 1}.</strong> ${correct?.text ?? 'Ответ не указан'}</p>`
  }).join('')

  quizContainer.replaceWith(`<section class="book-quiz">
    <div class="book-quiz__questions">${printableQuestions}</div>
    <section class="book-quiz__answers"><h2>Ответы к самопроверке</h2>${answers}</section>
  </section>`)
}

export function preparePracticeForPrint($, contentRoot) {
  const nodes = contentRoot.contents().toArray()
  const transformed = []
  let index = 0

  while (index < nodes.length) {
    const node = nodes[index]
    const element = $(node)
    const isTaskHeading = node.type === 'tag'
      && node.name === 'h2'
      && /^Задание\s+\d+[.:]/u.test(element.text().trim())

    if (!isTaskHeading) {
      transformed.push($.html(node))
      index += 1
      continue
    }

    const taskNodes = [node]
    index += 1
    while (index < nodes.length) {
      const nextNode = nodes[index]
      const nextElement = $(nextNode)
      if (nextNode.type === 'tag' && nextNode.name === 'h2' && /^Задание\s+\d+[.:]/u.test(nextElement.text().trim())) break
      taskNodes.push(nextNode)
      index += 1
    }

    const firstDetails = taskNodes.findIndex((taskNode) => taskNode.type === 'tag' && taskNode.name === 'details')
    const splitAt = firstDetails === -1 ? taskNodes.length : firstDetails
    const taskBody = taskNodes.slice(0, splitAt)
    const solutionBody = taskNodes.slice(splitAt)
    transformed.push(`<section class="book-practice-task">${renderNodes($, taskBody)}</section>`)
    if (solutionBody.length > 0) {
      $(solutionBody.filter((solutionNode) => solutionNode.type === 'tag' && solutionNode.name === 'details')).attr('open', '')
      transformed.push(`<section class="book-practice-solutions">${renderNodes($, solutionBody)}</section>`)
    }
  }

  contentRoot.html(transformed.join(''))
}

export function preparePageForPrint($, contentRoot, entry) {
  contentRoot.find('.quiz-container').each((_, quizContainer) => {
    prepareQuizForPrint($, $(quizContainer))
  })

  if (entry.source.endsWith('/practice.md')) {
    preparePracticeForPrint($, contentRoot)
  }
}

function createBookSections(pages) {
  let previousChapter
  const sections = []

  for (const page of pages) {
    const startsChapter = page.chapter !== previousChapter
    if (startsChapter) {
      if (previousChapter !== undefined) sections.push('</section>')
      sections.push(`<section class="book-chapter" data-chapter="${escapeHtml(page.chapter)}">`)
      if (page.chapter) {
        sections.push(`<p class="book-chapter__title">${escapeHtml(page.chapter)}</p>`)
      }
      previousChapter = page.chapter
    }

    sections.push(`<article id="${escapeHtml(page.output.replace(/\/$/, '') || 'guide')}" class="book-page" data-source="${escapeHtml(page.source)}">
      ${page.content}
    </article>`)
  }

  if (previousChapter !== undefined) sections.push('</section>')
  return sections
}

function contentType(path) {
  return {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
  }[extname(path)] ?? 'application/octet-stream'
}

async function startStaticServer() {
  const rootPrefix = `${distDirectory}${sep}`
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    if (pathname === '/book-assets/paged.polyfill.js') {
      try {
        const pagedScript = await readFile(pagedJsPath)
        response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
        response.end(pagedScript)
      } catch {
        response.writeHead(500).end()
      }
      return
    }
    const relativePath = pathname.replace(/^\/go-book\/?/, '') || 'index.html'
    const absolutePath = normalize(join(distDirectory, relativePath))

    if (!absolutePath.startsWith(rootPrefix) && absolutePath !== distDirectory) {
      response.writeHead(403).end()
      return
    }

    try {
      const content = await readFile(absolutePath)
      response.writeHead(200, { 'Content-Type': contentType(absolutePath) })
      response.end(content)
    } catch {
      if (!response.headersSent) response.writeHead(404)
      response.end()
    }
  })

  await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer))
  const { port } = server.address()
  return { server, url: `http://127.0.0.1:${port}/go-book/book-print.html` }
}

// Пагинация Paged.js — CPU-тяжёлая (1000+ страниц), и скорость 2-ядерных
// CI-раннеров плавает: на «быстрых» она укладывается в ~1–2 минуты, на
// «медленных» — дольше. Старый фиксированный waitForFunction с таймаутом
// 120 секунд умирал на медленных раннерах, из-за чего падала вся сборка.
// Поэтому ждём с большим бюджетом, поллим состояние страницы и пишем
// прогресс в лог — а при таймауте отдаём диагностику, а не голый timeout.
const pagedTimeoutMs = Number(process.env.PAGED_TIMEOUT_MS) || 600_000
const pagedPollMs = 2_000
const pagedProgressMs = 15_000

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

export async function waitForPaged(page, {
  timeoutMs = pagedTimeoutMs,
  pollMs = pagedPollMs,
  progressMs = pagedProgressMs,
  log = console.log,
} = {}) {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text())
  })

  const deadline = Date.now() + timeoutMs
  let lastProgressAt = 0

  for (;;) {
    const state = await page.evaluate(() => ({
      paged: document.documentElement.dataset.paged,
      pages: document.querySelectorAll('.pagedjs_page').length,
    }))
    if (state.paged === 'ready') return state.pages

    const now = Date.now()
    if (now >= deadline) {
      const lastErrors = [...pageErrors].slice(-5).map((error) => `  ${error}`).join('\n')
      throw new Error(
        `Paged.js не достиг состояния «ready» за ${Math.round(timeoutMs / 1000)} секунд ` +
          `(state: ${state.paged ?? 'none'}, сформировано страниц: ${state.pages}).` +
          (lastErrors ? `\nПоследние ошибки страницы:\n${lastErrors}` : ''),
      )
    }
    if (now - lastProgressAt >= progressMs) {
      lastProgressAt = now
      log(`Paged.js пагинирует книгу: ${state.pages} страниц, ждём «ready»...`)
    }
    await sleep(pollMs)
  }
}

async function printPdf(url) {
  const chrome = findChrome()
  if (!chrome) {
    throw new Error('Chrome/Chromium не найден. Укажите путь через CHROME_PATH.')
  }

  await rm(outputPdfPath, { force: true })
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: chromiumLaunchArgs,
  })

  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 })
    await page.waitForFunction(() => window.PagedPolyfill !== undefined, { timeout: 30_000 })
    await page.evaluate(() => window.PagedPolyfill.preview())
    const generatedPageCount = await waitForPaged(page)
    if (generatedPageCount < 2) {
      throw new Error('Paged.js не сформировал страницы книги')
    }
    await page.pdf({ path: outputPdfPath, preferCSSPageSize: true, printBackground: true })
    return generatedPageCount
  } finally {
    await browser.close()
  }
}

export async function buildBook() {
  const metadata = JSON.parse(await readFile(resolve(publicDirectory, 'book-meta.json'), 'utf8'))
  const manifest = await createBookManifest()
  const pages = await Promise.all(manifest.pages.map(readPage))
  const completeManifest = { ...manifest, pages: pages.map(({ content, ...page }) => page) }
  const printDocument = createPrintDocument({
    metadata,
    manifest: completeManifest,
    sections: createBookSections(pages),
  })
  validatePrintDocument(printDocument, completeManifest)

  await writeFile(printHtmlPath, printDocument)
  const { server, url } = await startStaticServer()
  try {
    const pdfPages = await printPdf(url)
    await writeFile(pdfMetadataPath, `${JSON.stringify({
      title: metadata.title,
      version: metadata.version,
      generatedAt: metadata.generatedAt,
      sourcePages: pages.length,
      pdfPages,
      pdf: 'go-book.pdf',
    }, null, 2)}\n`)
  } finally {
    await new Promise((resolveServer) => server.close(resolveServer))
  }
  await writeFile(outputManifestPath, `${JSON.stringify(completeManifest, null, 2)}\n`)
  await Promise.all([
    copyFile(outputPdfPath, resolve(distDirectory, 'go-book.pdf')),
    copyFile(outputManifestPath, resolve(distDirectory, 'book-manifest.json')),
    copyFile(pdfMetadataPath, resolve(distDirectory, 'book-pdf-meta.json')),
    copyFile(resolve(publicDirectory, 'book-meta.json'), resolve(distDirectory, 'book-meta.json')),
  ])

  return { pageCount: pages.length, outputPdfPath, outputManifestPath, pdfMetadataPath }
}

async function main() {
  const result = await buildBook()
  console.log(`PDF книги создан: ${result.pageCount} страниц исходных материалов`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}

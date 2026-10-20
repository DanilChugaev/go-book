import { createServer } from 'node:http'
import { readFile, rm, writeFile } from 'node:fs/promises'
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
      pre, blockquote, table, .custom-container { break-inside: avoid-page; }
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
        <p><strong>Автор:</strong> ${escapeHtml(metadata.author)}</p>
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

async function readPage(entry) {
  const pagePath = resolve(distDirectory, entry.output, 'index.html')
  const alternativePagePath = resolve(distDirectory, entry.output)
  const sourcePath = existsSync(pagePath) ? pagePath : alternativePagePath
  const html = await readFile(sourcePath, 'utf8')
  const $ = load(html)
  const content = $('#content').html()
  const title = $('#content h1').first().text().trim()

  if (!content || !title) {
    throw new Error(`Не удалось извлечь содержимое страницы ${entry.source}`)
  }

  return { ...entry, title, content }
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

async function printPdf(url) {
  const chrome = findChrome()
  if (!chrome) {
    throw new Error('Chrome/Chromium не найден. Укажите путь через CHROME_PATH.')
  }

  await rm(outputPdfPath, { force: true })
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-first-run', '--no-default-browser-check'],
  })

  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0' })
    await page.waitForFunction(() => window.PagedPolyfill !== undefined)
    await page.evaluate(() => window.PagedPolyfill.preview())
    await page.waitForFunction(() => document.documentElement.dataset.paged === 'ready', {
      timeout: 120000,
    })
    const generatedPageCount = await page.$$eval('.pagedjs_page', (pages) => pages.length)
    if (generatedPageCount < 2) {
      throw new Error('Paged.js не сформировал страницы книги')
    }
    await page.pdf({ path: outputPdfPath, preferCSSPageSize: true, printBackground: true })
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

  await writeFile(printHtmlPath, printDocument)
  const { server, url } = await startStaticServer()
  try {
    await printPdf(url)
  } finally {
    await new Promise((resolveServer) => server.close(resolveServer))
  }
  await writeFile(outputManifestPath, `${JSON.stringify(completeManifest, null, 2)}\n`)
  await writeFile(pdfMetadataPath, `${JSON.stringify({
    title: metadata.title,
    version: metadata.version,
    generatedAt: metadata.generatedAt,
    sourcePages: pages.length,
    pdf: 'go-book.pdf',
  }, null, 2)}\n`)

  return { pageCount: pages.length, outputPdfPath, outputManifestPath, pdfMetadataPath }
}

async function main() {
  const result = await buildBook()
  console.log(`PDF книги создан: ${result.pageCount} страниц исходных материалов`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}

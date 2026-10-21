import { execFile as execFileCallback } from 'node:child_process'
import { access, cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { load } from 'cheerio'

import { prepareQuizForPrint } from './build-book.mjs'

const execFile = promisify(execFileCallback)
const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distDirectory = resolve(rootDirectory, 'docs/.vuepress/dist')
const publicDirectory = resolve(rootDirectory, 'docs/.vuepress/public')
const workDirectory = resolve(rootDirectory, '.book-build/epub')
const outputPath = resolve(publicDirectory, 'go-book.epub')
const outputMetadataPath = resolve(publicDirectory, 'book-epub-meta.json')

const xhtmlEscape = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const toEpubFilename = (index) => `text/${String(index + 1).padStart(3, '0')}.xhtml`

export const toEpubHref = (href, outputToFilename) => {
  if (!href || href.startsWith('#') || /^[a-z][a-z+.-]*:/iu.test(href)) return href
  if (!href.startsWith('/go-book/')) return href

  const [path, fragment] = href.slice('/go-book/'.length).split('#', 2)
  const normalized = path.endsWith('/') ? path : path || 'guide/'
  const filename = outputToFilename.get(normalized)
  return filename ? `${filename.replace(/^text\//, '')}${fragment ? `#${fragment}` : ''}` : href
}

function createXhtml({ title, body }) {
  const xhtmlBody = body.replace(
    /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\b[^>]*?)(?<!\/)>(?!<\/\1>)/giu,
    '<$1$2 />',
  )

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ru" lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>${xhtmlEscape(title)}</title>
    <link rel="stylesheet" type="text/css" href="../styles/book.css" />
  </head>
  <body>${xhtmlBody}</body>
</html>
`
}

function prepareHtmlForEpub(html, outputToFilename) {
  const $ = load(html)
  const content = $('#content')

  content.find('.vp-navbar, .vp-sidebar, .vp-page-nav, .vp-footer, .go-playground, button').remove()
  // Vue SSR-разметка квизов содержит радио-input с пользовательскими
  // значениями. Для EPUB заменяем её на статичный вопросник с ответами.
  content.find('.quiz-container').each((_, quizContainer) => {
    prepareQuizForPrint($, $(quizContainer))
  })
  content.find('.book-quiz__question h2').each((index, heading) => {
    const epubId = `quiz-${index + 1}`
    $(heading).attr('id', epubId)
    $(heading).find('a[href]').attr('href', `#${epubId}`)
  })
  content.find('script, style, svg').remove()
  content.find('details').attr('open', '')
  content.find('a[href]').each((_, link) => {
    const anchor = $(link)
    const href = anchor.attr('href')
    if (!href || (!href.startsWith('#') && !href.startsWith('/go-book/') && !/^[a-z][a-z+.-]*:/iu.test(href))) {
      // Неполная markdown-ссылка из исходного текста (например, [] в
      // сигнатуре generic-функции) не является навигацией книги.
      anchor.replaceWith(anchor.contents())
    } else if (href.startsWith('/go-book/') && !toEpubHref(href, outputToFilename).startsWith('text/')) {
      // Страница содержания сайта не входит в линейную книгу: EPUB уже имеет
      // собственную навигацию. Не оставляем покупателю битую ссылку.
      anchor.removeAttr('href').addClass('epub-unavailable-link')
    } else if (href) {
      anchor.attr('href', toEpubHref(href, outputToFilename))
    }
    anchor.removeAttr('target').removeAttr('rel')
  })
  content.find('img[src]').each((_, image) => {
    const source = $(image).attr('src')
    if (source?.startsWith('/go-book/')) $(image).attr('src', `../${source.slice('/go-book/'.length)}`)
  })

  return content.html() ?? ''
}

function createNavigation(pages) {
  const items = pages.map((page) => `<li><a href="${page.filename}">${xhtmlEscape(page.title)}</a></li>`).join('\n')
  return createXhtml({
    title: 'Содержание',
    body: `<nav epub:type="toc" id="toc" role="doc-toc">
      <h1>Содержание</h1>
      <ol>${items}</ol>
    </nav>`,
  }).replace('<html ', '<html xmlns:epub="http://www.idpf.org/2007/ops" ')
}

export function createPackageDocument(metadata, pages) {
  const manifestItems = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />',
    '<item id="css" href="styles/book.css" media-type="text/css" />',
    '<item id="cover" href="images/cover.png" media-type="image/png" properties="cover-image" />',
    ...pages.map((page, index) => `<item id="page-${index + 1}" href="${page.filename}" media-type="application/xhtml+xml" />`),
  ].join('\n    ')
  const spine = pages.map((_, index) => `<itemref idref="page-${index + 1}" />`).join('\n    ')
  const subjects = (metadata.subjects ?? []).map((subject) => `<dc:subject>${xhtmlEscape(subject)}</dc:subject>`).join('\n    ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${metadata.language}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${xhtmlEscape(metadata.identifier)}</dc:identifier>
    <dc:title>${xhtmlEscape(metadata.title)}</dc:title>
    <dc:creator>${xhtmlEscape(metadata.author)}</dc:creator>
    <dc:language>${xhtmlEscape(metadata.language ?? 'ru')}</dc:language>
    <dc:publisher>${xhtmlEscape(metadata.publisher ?? metadata.author)}</dc:publisher>
    <dc:description>${xhtmlEscape(metadata.description ?? metadata.title)}</dc:description>
    ${subjects}
    <meta property="dcterms:modified">${xhtmlEscape(metadata.generatedAt.replace(/\.\d{3}Z$/, 'Z'))}</meta>
    <meta property="rendition:layout">reflowable</meta>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine>
    ${spine}
  </spine>
</package>
`
}

const stylesheet = `@charset "UTF-8";
html { font-family: serif; line-height: 1.5; }
body { margin: 5%; color: #1b1b1f; }
h1, h2, h3, h4 { line-height: 1.2; break-after: avoid; }
h1 { margin-top: 0; }
pre { overflow-wrap: break-word; white-space: pre-wrap; tab-size: 2; padding: .8em; border: 1px solid #d0d7de; border-radius: .3em; background: #f6f8fa; }
code { font-family: monospace; font-size: .9em; }
table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
th, td { padding: .4em; border: 1px solid #d0d7de; vertical-align: top; }
blockquote { margin: 1em 0; padding: .1em 1em; border-inline-start: .3em solid #d0d7de; background: #f6f8fa; }
img { max-width: 100%; height: auto; }
details { margin: 1em 0; padding: .5em .75em; border: 1px solid #d0d7de; border-radius: .3em; }
summary { font-weight: 700; }
.hint-container { margin: 1em 0; padding: .75em 1em; border-inline-start: .3em solid #147a4b; background: #edf7f1; }
.quiz__result, .quiz-container__saved-notice { display: none; }
.example-source { margin: 1em 0; padding: .75em; border: 1px solid #d0d7de; border-radius: .3em; }
.epub-unavailable-link { color: inherit; text-decoration: none; }
`

export async function buildEpub() {
  const [metadata, manifest] = await Promise.all([
    JSON.parse(await readFile(resolve(publicDirectory, 'book-meta.json'), 'utf8')),
    JSON.parse(await readFile(resolve(publicDirectory, 'book-manifest.json'), 'utf8')),
  ])
  const outputToFilename = new Map(manifest.pages.map((page, index) => [page.output, toEpubFilename(index)]))
  const pages = []

  await rm(workDirectory, { recursive: true, force: true })
  await mkdir(resolve(workDirectory, 'META-INF'), { recursive: true })
  await mkdir(resolve(workDirectory, 'OEBPS/text'), { recursive: true })
  await mkdir(resolve(workDirectory, 'OEBPS/styles'), { recursive: true })
  await mkdir(resolve(workDirectory, 'OEBPS/images'), { recursive: true })

  await Promise.all([
    writeFile(resolve(workDirectory, 'mimetype'), 'application/epub+zip'),
    writeFile(resolve(workDirectory, 'META-INF/container.xml'), `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>
`),
    writeFile(resolve(workDirectory, 'OEBPS/styles/book.css'), stylesheet),
    cp(resolve(publicDirectory, 'icons/go-book-512.png'), resolve(workDirectory, 'OEBPS/images/cover.png')),
  ])

  for (const [index, entry] of manifest.pages.entries()) {
    const directoryIndexPath = resolve(distDirectory, entry.output, 'index.html')
    const filePath = resolve(distDirectory, entry.output)
    const htmlPath = await access(directoryIndexPath).then(() => directoryIndexPath).catch(() => filePath)
    const source = await readFile(htmlPath, 'utf8')
    const $ = load(source)
    const title = $('#content h1').first().text().trim()
    if (!title) throw new Error(`В EPUB не найден заголовок: ${entry.source}`)

    const filename = toEpubFilename(index)
    const body = prepareHtmlForEpub(source, outputToFilename)
    if (!body) throw new Error(`В EPUB не найдено содержимое: ${entry.source}`)
    await writeFile(resolve(workDirectory, 'OEBPS', filename), createXhtml({ title, body }))
    pages.push({ ...entry, title, filename })
  }

  await Promise.all([
    writeFile(resolve(workDirectory, 'OEBPS/nav.xhtml'), createNavigation(pages)),
    writeFile(resolve(workDirectory, 'OEBPS/package.opf'), createPackageDocument(metadata, pages)),
  ])

  await rm(outputPath, { force: true })
  await execFile('zip', ['-X0', outputPath, 'mimetype'], { cwd: workDirectory })
  await execFile('zip', ['-Xr9D', outputPath, 'META-INF', 'OEBPS'], { cwd: workDirectory })

  const stats = await stat(outputPath)
  const outputMetadata = {
    title: metadata.title,
    version: metadata.version,
    generatedAt: metadata.generatedAt,
    sourcePages: pages.length,
    epub: 'go-book.epub',
    bytes: stats.size,
  }
  await Promise.all([
    writeFile(outputMetadataPath, `${JSON.stringify(outputMetadata, null, 2)}\n`),
    cp(outputPath, resolve(distDirectory, 'go-book.epub')),
    cp(outputMetadataPath, resolve(distDirectory, 'book-epub-meta.json')),
  ])

  return outputMetadata
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await buildEpub()
  console.log(`EPUB книги создан: ${result.sourcePages} материалов, ${result.bytes} байт`)
}

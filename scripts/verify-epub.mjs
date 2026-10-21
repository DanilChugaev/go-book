import { execFile as execFileCallback } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFile = promisify(execFileCallback)
const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)))
const publicDirectory = resolve(rootDirectory, 'docs/.vuepress/public')
const distDirectory = resolve(rootDirectory, 'docs/.vuepress/dist')

async function readJson(name) {
  return JSON.parse(await readFile(resolve(publicDirectory, name), 'utf8'))
}

async function main() {
  const [metadata, manifest, epubMetadata, epub, deployedEpub, epubStats] = await Promise.all([
    readJson('book-meta.json'),
    readJson('book-manifest.json'),
    readJson('book-epub-meta.json'),
    readFile(resolve(publicDirectory, 'go-book.epub')),
    readFile(resolve(distDirectory, 'go-book.epub')),
    stat(resolve(publicDirectory, 'go-book.epub')),
  ])
  const { stdout } = await execFile('unzip', ['-Z1', resolve(publicDirectory, 'go-book.epub')])
  const entries = new Set(stdout.trim().split('\n'))
  const hash = (content) => createHash('sha256').update(content).digest('hex')

  if (epubStats.size < 100_000) throw new Error('EPUB книги слишком мал или пуст')
  if (!epub.subarray(0, 2).equals(Buffer.from('PK'))) throw new Error('Файл книги не является EPUB-архивом')
  if (epubMetadata.title !== metadata.title || epubMetadata.version !== metadata.version) {
    throw new Error('Метаданные EPUB не совпадают с данными книги')
  }
  if (epubMetadata.sourcePages !== manifest.pages.length) {
    throw new Error('Количество материалов EPUB не совпадает с манифестом')
  }
  for (const required of ['mimetype', 'META-INF/container.xml', 'OEBPS/package.opf', 'OEBPS/nav.xhtml', 'OEBPS/styles/book.css', 'OEBPS/images/cover.png']) {
    if (!entries.has(required)) throw new Error(`В EPUB отсутствует обязательный файл: ${required}`)
  }
  for (let index = 0; index < manifest.pages.length; index += 1) {
    const filename = `OEBPS/text/${String(index + 1).padStart(3, '0')}.xhtml`
    if (!entries.has(filename)) throw new Error(`В EPUB отсутствует материал: ${filename}`)
  }
  const pageSources = await Promise.all(manifest.pages.map((_, index) => execFile(
    'unzip',
    ['-p', resolve(publicDirectory, 'go-book.epub'), `OEBPS/text/${String(index + 1).padStart(3, '0')}.xhtml`],
  ).then(({ stdout }) => stdout)))
  const pageTargets = new Map(pageSources.map((source, index) => [
    `text/${String(index + 1).padStart(3, '0')}.xhtml`,
    new Set([...source.matchAll(/\bid="([^"]+)"/gu)].map((match) => match[1])),
  ]))
  for (const [index, source] of pageSources.entries()) {
    const currentFile = `text/${String(index + 1).padStart(3, '0')}.xhtml`
    for (const match of source.matchAll(/\bhref="([^"]+)"/gu)) {
      const href = match[1]
      if (/^[a-z][a-z+.-]*:/iu.test(href)) continue
      const [path, fragment] = href.split('#', 2)
      const targetFile = path || currentFile
      if (targetFile.startsWith('../')) continue
      if (!pageTargets.has(targetFile)) {
        throw new Error(`В EPUB битая внутренняя ссылка: ${currentFile} → ${href}`)
      }
      if (fragment && !pageTargets.get(targetFile).has(fragment)) {
        throw new Error(`В EPUB битый внутренний якорь: ${currentFile} → ${href}`)
      }
    }
  }
  if (hash(epub) !== hash(deployedEpub)) throw new Error('В публикуемой директории лежит не та версия EPUB')

  console.log(`EPUB проверен: ${manifest.pages.length} материалов, ${epubStats.size} байт`)
}

await main()

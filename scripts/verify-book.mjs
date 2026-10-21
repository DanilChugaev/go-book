import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { validatePrintDocument } from './build-book.mjs'

const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)))
const publicDirectory = resolve(rootDirectory, 'docs/.vuepress/public')
const distDirectory = resolve(rootDirectory, 'docs/.vuepress/dist')

async function readJson(name) {
  return JSON.parse(await readFile(resolve(publicDirectory, name), 'utf8'))
}

async function main() {
  const [bookMeta, pdfMeta, manifest, pdfStats, pdf, printDocument, deployedPdf] = await Promise.all([
    readJson('book-meta.json'),
    readJson('book-pdf-meta.json'),
    readJson('book-manifest.json'),
    stat(resolve(publicDirectory, 'go-book.pdf')),
    readFile(resolve(publicDirectory, 'go-book.pdf')),
    readFile(resolve(distDirectory, 'book-print.html'), 'utf8'),
    readFile(resolve(distDirectory, 'go-book.pdf')),
  ])

  if (pdfStats.size < 100_000) throw new Error('PDF книги слишком мал или пуст')
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    throw new Error('Файл книги не является PDF')
  }
  if (!pdf.subarray(-2_048).includes(Buffer.from('%%EOF'))) {
    throw new Error('PDF книги не содержит корректный завершающий маркер')
  }
  if (!Array.isArray(manifest.pages) || manifest.pages.length === 0) {
    throw new Error('В манифесте отсутствуют страницы книги')
  }
  if (!Array.isArray(manifest.contributors) || manifest.contributors.length === 0) {
    throw new Error('В манифесте отсутствуют контрибьюторы')
  }
  if (bookMeta.version !== pdfMeta.version) {
    throw new Error('Версия PDF не совпадает с метаданными книги')
  }
  if (bookMeta.generatedAt !== pdfMeta.generatedAt) {
    throw new Error('Время сборки PDF не совпадает с метаданными книги')
  }
  if (pdfMeta.sourcePages !== manifest.pages.length) {
    throw new Error('Количество материалов PDF не совпадает с манифестом')
  }
  if (!Number.isInteger(pdfMeta.pdfPages) || pdfMeta.pdfPages < 2) {
    throw new Error('PDF не содержит корректного количества сформированных страниц')
  }
  if (pdfMeta.title !== bookMeta.title || pdfMeta.pdf !== 'go-book.pdf') {
    throw new Error('Метаданные PDF не совпадают с данными книги')
  }

  validatePrintDocument(printDocument, manifest)

  const hash = (content) => createHash('sha256').update(content).digest('hex')
  if (hash(pdf) !== hash(deployedPdf)) {
    throw new Error('В публикуемой директории лежит не та версия PDF')
  }

  const epubMetadataPath = resolve(publicDirectory, 'book-epub-meta.json')
  const epubPath = resolve(publicDirectory, 'go-book.epub')
  const [epubMetadata, epubStats] = await Promise.all([
    readFile(epubMetadataPath, 'utf8').then(JSON.parse),
    stat(epubPath),
  ])
  if (epubStats.size < 100_000 || epubMetadata.version !== bookMeta.version) {
    throw new Error('EPUB не соответствует текущей версии книги')
  }

  console.log(`PDF и EPUB проверены: ${pdfMeta.pdfPages} страниц PDF, ${manifest.pages.length} материалов`)
}

await main()

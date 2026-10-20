import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)))
const publicDirectory = resolve(rootDirectory, 'docs/.vuepress/public')

async function readJson(name) {
  return JSON.parse(await readFile(resolve(publicDirectory, name), 'utf8'))
}

async function main() {
  const [bookMeta, pdfMeta, manifest, pdfStats] = await Promise.all([
    readJson('book-meta.json'),
    readJson('book-pdf-meta.json'),
    readJson('book-manifest.json'),
    stat(resolve(publicDirectory, 'go-book.pdf')),
  ])

  if (pdfStats.size < 1_000) throw new Error('PDF книги слишком мал или пуст')
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

  console.log(`PDF проверен: ${manifest.pages.length} материалов, ${pdfStats.size} байт`)
}

await main()

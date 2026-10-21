import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)))
const publicDirectory = resolve(rootDirectory, 'docs/.vuepress/public')
const distDirectory = resolve(rootDirectory, 'docs/.vuepress/dist')

async function main() {
  const [bookMetadata, kpfMetadata, kpf, deployedKpf, kpfStats] = await Promise.all([
    readFile(resolve(publicDirectory, 'book-meta.json'), 'utf8').then(JSON.parse),
    readFile(resolve(publicDirectory, 'book-kpf-meta.json'), 'utf8').then(JSON.parse),
    readFile(resolve(publicDirectory, 'go-book.kpf')),
    readFile(resolve(distDirectory, 'go-book.kpf')),
    stat(resolve(publicDirectory, 'go-book.kpf')),
  ])
  const hash = (content) => createHash('sha256').update(content).digest('hex')

  if (kpfStats.size < 100_000) throw new Error('KPF книги слишком мал или пуст')
  if (
    kpfMetadata.title !== bookMetadata.title
    || kpfMetadata.version !== bookMetadata.version
    || kpfMetadata.generatedAt !== bookMetadata.generatedAt
  ) {
    throw new Error('Метаданные KPF не совпадают с данными книги')
  }
  if (kpfMetadata.source !== 'go-book.epub' || kpfMetadata.kpf !== 'go-book.kpf') {
    throw new Error('KPF собран не из ожидаемого EPUB-артефакта')
  }
  if (hash(kpf) !== hash(deployedKpf)) throw new Error('В публикуемой директории лежит не та версия KPF')

  console.log(`KPF проверен: ${kpfStats.size} байт`)
}

await main()

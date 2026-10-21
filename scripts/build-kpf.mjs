import { execFile as execFileCallback } from 'node:child_process'
import { access, copyFile, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFile = promisify(execFileCallback)
const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)))
const publicDirectory = resolve(rootDirectory, 'docs/.vuepress/public')
const distDirectory = resolve(rootDirectory, 'docs/.vuepress/dist')
const epubPath = resolve(publicDirectory, 'go-book.epub')
const kpfPath = resolve(publicDirectory, 'go-book.kpf')
const kpfMetadataPath = resolve(publicDirectory, 'book-kpf-meta.json')
const kindleOutputPath = resolve(publicDirectory, 'KPF/go-book_epub.kpf')

const candidates = [
  process.env.KINDLE_PREVIEWER_PATH,
  '/Applications/Kindle Previewer 4.app/Contents/MacOS/KindlePreviewer4CLI',
  '/Applications/Kindle Previewer 4.app/Contents/MacOS/Kindle Previewer 4',
  '/Applications/Kindle Previewer 3.app/Contents/MacOS/Kindle Previewer 3',
  '/Applications/Kindle Previewer.app/Contents/MacOS/Kindle Previewer',
  'kindlepreviewer',
].filter(Boolean)

async function findKindlePreviewer() {
  for (const candidate of candidates) {
    try {
      if (candidate === 'kindlepreviewer') await execFile(candidate, ['--version'])
      else await access(candidate)
      return candidate
    } catch {
      // Проверяем следующий известный путь.
    }
  }
  return null
}

async function main() {
  const previewer = await findKindlePreviewer()
  if (!previewer) {
    throw new Error('Kindle Previewer не найден. Установите Kindle Previewer 3 или задайте KINDLE_PREVIEWER_PATH.')
  }

  // Kindle Previewer экспортирует KPF из EPUB через CLI. Формат команды
  // намеренно изолирован здесь: при обновлении Previewer изменяется только этот
  // адаптер, а EPUB остаётся независимым релизным источником.
  const outputDirectory = dirname(kpfPath)
  await rm(kpfPath, { force: true })
  await rm(resolve(publicDirectory, 'KPF'), { recursive: true, force: true })
  await execFile(previewer, [epubPath, '--convert', '--output', outputDirectory], {
    timeout: 10 * 60 * 1_000,
  })
  try {
    await stat(kindleOutputPath)
  } catch {
    throw new Error(`Kindle Previewer завершился без KPF в ${kindleOutputPath}. Проверьте логи в ${publicDirectory}/Logs.`)
  }
  await copyFile(kindleOutputPath, kpfPath)
  const kpfStats = await stat(kpfPath)
  if (kpfStats.size < 100_000) throw new Error('Kindle Previewer создал пустой KPF')

  const metadata = JSON.parse(await readFile(resolve(publicDirectory, 'book-meta.json'), 'utf8'))
  const kpfMetadata = {
    title: metadata.title,
    version: metadata.version,
    generatedAt: metadata.generatedAt,
    source: 'go-book.epub',
    kpf: 'go-book.kpf',
    bytes: kpfStats.size,
  }
  await Promise.all([
    writeFile(kpfMetadataPath, `${JSON.stringify(kpfMetadata, null, 2)}\n`),
    copyFile(kpfPath, resolve(distDirectory, 'go-book.kpf')),
    copyFile(kpfMetadataPath, resolve(distDirectory, 'book-kpf-meta.json')),
  ])
  await Promise.all([
    rm(resolve(publicDirectory, 'KPF'), { recursive: true, force: true }),
    rm(resolve(publicDirectory, 'Logs'), { recursive: true, force: true }),
    rm(resolve(publicDirectory, 'Summary_Log.csv'), { force: true }),
  ])

  console.log(`KPF книги создан: ${kpfStats.size} байт`)
}

await main()

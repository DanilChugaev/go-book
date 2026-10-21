import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const generatedModulePath = resolve(
  rootDirectory,
  'docs/.vuepress/generated/book-meta.ts',
)
const publicMetadataPath = resolve(
  rootDirectory,
  'docs/.vuepress/public/book-meta.json',
)

export function createBookMeta(version, timestamp = Date.now()) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`Некорректная версия книги: ${version}`)
  }

  if (!Number.isFinite(timestamp)) {
    throw new Error('Время сборки книги должно быть конечным числом')
  }

  const generatedAt = new Date(timestamp)

  return {
    title: 'Учебник Go',
    author: 'Данил Чугаев',
    authorUrl: 'https://github.com/DanilChugaev',
    identifier: 'urn:uuid:754eebd5-7ad2-4bb0-a080-f1565bf5d042',
    language: 'ru',
    publisher: 'Данил Чугаев',
    description: 'Последовательный русскоязычный курс по Go: от первой программы до backend-проекта.',
    subjects: ['Go', 'программирование', 'backend-разработка'],
    version,
    generatedAt: generatedAt.toISOString(),
    generatedDate: generatedAt.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  }
}

function serializeModule(metadata) {
  return [
    '// Этот файл создаётся командой npm run book:meta. Не редактируйте вручную.',
    `export const bookMeta = ${JSON.stringify(metadata, null, 2)} as const`,
    '',
  ].join('\n')
}

export async function generateBookMeta({ timestamp = Date.now() } = {}) {
  const packagePath = resolve(rootDirectory, 'package.json')
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
  const metadata = createBookMeta(packageJson.version, timestamp)

  await mkdir(dirname(generatedModulePath), { recursive: true })
  await writeFile(generatedModulePath, serializeModule(metadata))
  await writeFile(publicMetadataPath, `${JSON.stringify(metadata, null, 2)}\n`)

  return metadata
}

export async function syncBookMeta() {
  const metadata = JSON.parse(await readFile(publicMetadataPath, 'utf8'))

  await mkdir(dirname(generatedModulePath), { recursive: true })
  await writeFile(generatedModulePath, serializeModule(metadata))

  return metadata
}

async function main() {
  const isReleaseBuild = process.argv.includes('--release')
  const metadata = isReleaseBuild
    ? await generateBookMeta()
    : await syncBookMeta()
  const action = isReleaseBuild ? 'созданы' : 'синхронизированы'
  console.log(`Метаданные книги ${action}: v${metadata.version}, ${metadata.generatedDate}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}

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

async function main() {
  const metadata = await generateBookMeta()
  console.log(`Метаданные книги созданы: v${metadata.version}, ${metadata.generatedDate}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main()
}

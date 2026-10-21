import test from 'node:test'
import assert from 'node:assert/strict'

import { createBookMeta } from '../scripts/book-meta.mjs'

test('createBookMeta creates stable book metadata from version and build time', () => {
  const metadata = createBookMeta('1.2.3', Date.UTC(2026, 9, 20, 12, 30, 45))

  assert.deepEqual(metadata, {
    title: 'Учебник Go',
    author: 'Данил Чугаев',
    authorUrl: 'https://github.com/DanilChugaev',
    identifier: 'urn:uuid:754eebd5-7ad2-4bb0-a080-f1565bf5d042',
    language: 'ru',
    publisher: 'Данил Чугаев',
    description: 'Последовательный русскоязычный курс по Go: от первой программы до backend-проекта.',
    subjects: ['Go', 'программирование', 'backend-разработка'],
    version: '1.2.3',
    generatedAt: '2026-10-20T12:30:45.000Z',
    generatedDate: '20.10.2026',
  })
})

test('createBookMeta rejects an invalid semantic version', () => {
  assert.throws(() => createBookMeta('release-1'), /Некорректная версия книги/)
})

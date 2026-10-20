import test from 'node:test'
import assert from 'node:assert/strict'

import { createBookMeta } from '../scripts/book-meta.mjs'

test('createBookMeta creates stable book metadata from version and build time', () => {
  const metadata = createBookMeta('1.2.3', Date.UTC(2026, 9, 20, 12, 30, 45))

  assert.deepEqual(metadata, {
    title: 'Учебник Go',
    author: 'Данил Чугаев',
    version: '1.2.3',
    generatedAt: '2026-10-20T12:30:45.000Z',
    generatedDate: '20.10.2026',
  })
})

test('createBookMeta rejects an invalid semantic version', () => {
  assert.throws(() => createBookMeta('release-1'), /Некорректная версия книги/)
})

import test from 'node:test'
import assert from 'node:assert/strict'

import { markdownToOutputPath, parseSidebar } from '../scripts/book-manifest.mjs'

test('markdownToOutputPath preserves VuePress routes', () => {
  assert.equal(markdownToOutputPath('guide/README.md'), 'guide/')
  assert.equal(markdownToOutputPath('guide/functions/tests.md'), 'guide/functions/tests.html')
})

test('parseSidebar keeps page order and chapter name', () => {
  const sidebar = `
    text: 'Глава 1: Пример',
    children: [
      '/guide/example/README.md',
      '/guide/example/tests.md',
    ],
  `

  assert.deepEqual(parseSidebar(sidebar), [
    {
      chapter: 'Глава 1: Пример',
      source: 'docs/guide/example/README.md',
      output: 'guide/example/',
    },
    {
      chapter: 'Глава 1: Пример',
      source: 'docs/guide/example/tests.md',
      output: 'guide/example/tests.html',
    },
  ])
})

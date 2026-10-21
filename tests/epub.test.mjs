import test from 'node:test'
import assert from 'node:assert/strict'

import { createPackageDocument, toEpubHref } from '../scripts/build-epub.mjs'

test('toEpubHref rewrites internal VuePress links to EPUB pages', () => {
  const outputToFilename = new Map([
    ['guide/functions/', 'text/001.xhtml'],
  ])

  assert.equal(
    toEpubHref('/go-book/guide/functions/#scope', outputToFilename),
    '001.xhtml#scope',
  )
  assert.equal(
    toEpubHref('https://go.dev/doc/', outputToFilename),
    'https://go.dev/doc/',
  )
})

test('createPackageDocument contains EPUB 3 metadata and navigation', () => {
  const document = createPackageDocument({
    identifier: 'urn:uuid:test',
    title: 'Учебник Go',
    author: 'Автор',
    language: 'ru',
    publisher: 'Издатель',
    description: 'Описание',
    subjects: ['Go'],
    generatedAt: '2026-10-20T12:30:45.000Z',
  }, [{ filename: 'text/001.xhtml' }])

  assert.match(document, /version="3\.0"/)
  assert.match(document, /properties="nav"/)
  assert.match(document, /rendition:layout/) 
  assert.match(document, /text\/001\.xhtml/)
})

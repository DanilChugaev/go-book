import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

async function findPracticeFiles(directory = 'docs/guide') {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return findPracticeFiles(path)
    return entry.name === 'practice.md' ? [path] : []
  }))
  return nested.flat()
}

test('every practice page links to a documented source directory', async () => {
  const practiceFiles = await findPracticeFiles()
  const sourcePaths = await Promise.all(practiceFiles.map(async (practiceFile) => {
    const content = await readFile(practiceFile, 'utf8')
    const pathMatch = content.match(/<ExampleSource\s+path="([^"]+)"/u)
    assert.ok(pathMatch, `${practiceFile} must include an ExampleSource block`)
    return pathMatch[1]
  }))

  assert.equal(sourcePaths.length, 41)
  assert.equal(new Set(sourcePaths).size, sourcePaths.length)

  await Promise.all(sourcePaths.map(async (sourcePath) => {
    const readme = await readFile(join(sourcePath, 'README.md'), 'utf8')
    assert.match(readme, /^# Исходный код/m)
  }))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('documented example source directories exist', async () => {
  const paths = [
    'examples/01/hello-go/go.mod',
    'examples/01/task-manager-api/go.mod',
    'examples/32/task-manager-api/go.mod',
  ]

  await Promise.all(paths.map(async (path) => {
    const content = await readFile(path, 'utf8')
    assert.match(content, /^module\s+\S+/m)
  }))
})

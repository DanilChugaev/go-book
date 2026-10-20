import test from 'node:test'
import assert from 'node:assert/strict'
import { load } from 'cheerio'

import { preparePageForPrint } from '../scripts/build-book.mjs'

test('preparePageForPrint puts quiz answers on a separate print section', () => {
  const $ = load(`<main id="content">
    <div class="quiz-container">
      <div class="quiz">
        <h2 class="quiz__title">1. Что такое Go?</h2>
        <label class="quiz__option"><div><span>Язык программирования</span></div></label>
        <label class="quiz__option" data-correct="true"><div><span>Компилируемый язык</span></div></label>
      </div>
    </div>
  </main>`)

  preparePageForPrint($, $('#content'), { source: 'docs/guide/example/tests.md' })

  assert.equal($('.book-quiz__question').length, 1)
  assert.equal($('.book-quiz__answers').length, 1)
  assert.match($('.book-quiz__answers').text(), /Компилируемый язык/)
})

test('preparePageForPrint separates a task from its hints and solution', () => {
  const $ = load(`<main id="content">
    <h1>Задания</h1>
    <h2>Задание 1. Проверка</h2>
    <p>Условие задания.</p>
    <details><summary>Подсказка</summary><p>Подсказка.</p></details>
    <details><summary>Решение</summary><p>Решение.</p></details>
    <h2>Задание 2. Продолжение</h2>
    <p>Второе условие.</p>
  </main>`)

  preparePageForPrint($, $('#content'), { source: 'docs/guide/example/practice.md' })

  assert.equal($('.book-practice-task').length, 2)
  assert.equal($('.book-practice-solutions').length, 1)
  assert.match($('.book-practice-task').first().text(), /Условие задания/)
  assert.doesNotMatch($('.book-practice-task').first().text(), /Подсказка/)
  assert.equal($('.book-practice-solutions details[open]').length, 2)
})

test('preparePageForPrint does not duplicate an existing source-code block', () => {
  const $ = load(`<main id="content">
    <h1>Задания</h1>
    <div class="example-source"><strong>Полный исходный код</strong></div>
  </main>`)

  preparePageForPrint($, $('#content'), { source: 'docs/guide/example/practice.md' })

  assert.equal($('.example-source').length, 1)
  assert.equal($('.book-example-source').length, 0)
})

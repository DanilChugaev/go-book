---
prev: /guide/operators-and-expressions/README.md
next: /guide/operators-and-expressions/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что вычислит выражение 7 / 2, если оба значения имеют тип int?',
    options: [
      { text: '3', correct: true },
      { text: '3.5' },
      { text: '4' },
      { text: 'Ошибка компиляции' },
    ],
  },
  {
    text: 'Какой оператор возвращает остаток от деления?',
    options: [
      { text: '%', correct: true },
      { text: '/' },
      { text: '*' },
      { text: '&&' },
    ],
  },
  {
    text: 'Какой оператор проверяет равенство двух значений?',
    options: [
      { text: '==', correct: true },
      { text: '=' },
      { text: ':=' },
      { text: '!=' },
    ],
  },
  {
    text: 'Какое значение вернёт выражение true && false?',
    options: [
      { text: 'false', correct: true },
      { text: 'true' },
      { text: '0' },
      { text: 'Ошибка компиляции' },
    ],
  },
  {
    text: 'Что означает оператор ||?',
    options: [
      { text: 'Истина, если истинно хотя бы одно выражение', correct: true },
      { text: 'Истина, только если истинны оба выражения' },
      { text: 'Изменение значения на противоположное' },
      { text: 'Целочисленное деление' },
    ],
  },
  {
    text: 'Какой результат у выражения 2 + 3 * 4?',
    options: [
      { text: '14', correct: true },
      { text: '20' },
      { text: '24' },
      { text: '9' },
    ],
  },
  {
    text: 'Как записать увеличение taskCount на единицу?',
    options: [
      { text: 'taskCount++', correct: true },
      { text: '++taskCount' },
      { text: 'taskCount + 1' },
      { text: 'taskCount :=+ 1' },
    ],
  },
  {
    text: 'Можно ли использовать taskCount++ как часть выражения?',
    options: [
      { text: 'Нет, ++ — отдельная инструкция в Go', correct: true },
      { text: 'Да, только в функции main' },
      { text: 'Да, если taskCount имеет тип int' },
      { text: 'Только вместе с оператором :=' },
    ],
  },
  {
    text: 'Как проверить, что priority находится в диапазоне от 1 до 3 включительно?',
    options: [
      { text: 'priority >= 1 && priority <= 3', correct: true },
      { text: 'priority >= 1 || priority <= 3' },
      { text: 'priority = 1 && 3' },
      { text: 'priority in 1..3' },
    ],
  },
  {
    text: 'Что произойдёт с int8, равным 127, после увеличения на единицу?',
    options: [
      { text: 'Станет -128 из-за переполнения', correct: true },
      { text: 'Станет 128' },
      { text: 'Программа всегда остановится с ошибкой' },
      { text: 'Станет 0' },
    ],
  },
]
</script>

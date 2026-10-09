---
prev: /guide/control-flow/README.md
next: /guide/control-flow/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Когда выполняется блок if?',
    options: [
      { text: 'Когда условие равно true', correct: true },
      { text: 'Всегда' },
      { text: 'Когда условие равно false' },
      { text: 'Только после switch' },
    ],
  },
  {
    text: 'Как в Go записывают условие if?',
    options: [
      { text: 'if priority > 0 { }', correct: true },
      { text: 'if (priority > 0) { }' },
      { text: 'if priority > 0 then { }' },
      { text: 'if priority > 0 end' },
    ],
  },
  {
    text: 'Что произойдёт в цепочке if / else if / else, если истинны два условия?',
    options: [
      { text: 'Выполнится только первая подходящая ветвь', correct: true },
      { text: 'Выполнятся обе подходящие ветви' },
      { text: 'Всегда выполнится else' },
      { text: 'Будет ошибка компиляции' },
    ],
  },
  {
    text: 'Что проверяет условие len(title) == 0?',
    options: [
      { text: 'Что строка пустая', correct: true },
      { text: 'Что строка содержит нулевой байт' },
      { text: 'Что строка длиннее 120 байтов' },
      { text: 'Что title имеет тип int' },
    ],
  },
  {
    text: 'Где доступна переменная titleLength, объявленная в if titleLength := len(title); ...?',
    options: [
      { text: 'В условии и его ветвях', correct: true },
      { text: 'Во всём пакете' },
      { text: 'Только после if' },
      { text: 'Только внутри main до if' },
    ],
  },
  {
    text: 'Когда switch удобнее длинной цепочки else if?',
    options: [
      { text: 'Когда одно значение сравнивают с несколькими конкретными вариантами', correct: true },
      { text: 'Когда нужен цикл' },
      { text: 'Только для строк' },
      { text: 'Только для логических значений' },
    ],
  },
  {
    text: 'Нужно ли писать break после каждого case в обычном switch Go?',
    options: [
      { text: 'Нет, switch завершается после подходящей ветви', correct: true },
      { text: 'Да, иначе выполнится следующий case' },
      { text: 'Только в default' },
      { text: 'Только если case содержит fmt.Println' },
    ],
  },
  {
    text: 'Какая проверка корректно определяет допустимый приоритет от 1 до 3?',
    options: [
      { text: 'priority >= 1 && priority <= 3', correct: true },
      { text: 'priority >= 1 || priority <= 3' },
      { text: 'priority == 1 && 3' },
      { text: 'priority = 1..3' },
    ],
  },
  {
    text: 'Какое сообщение выведет switch с default, если ни один case не подошёл?',
    options: [
      { text: 'Инструкции из ветви default', correct: true },
      { text: 'Первый case' },
      { text: 'Ничего, default никогда не выполняется' },
      { text: 'Ошибка компиляции' },
    ],
  },
  {
    text: 'Почему проверку пустого названия стоит разместить перед проверкой максимальной длины?',
    options: [
      { text: 'Пустая строка тоже короче 120 байтов', correct: true },
      { text: 'Пустую строку нельзя передать в len' },
      { text: 'switch не поддерживает пустые строки' },
      { text: 'Иначе Go не скомпилирует программу' },
    ],
  },
]
</script>

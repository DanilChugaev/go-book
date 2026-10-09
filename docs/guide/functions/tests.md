---
prev: /guide/functions/README.md
next: /guide/functions/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Каким ключевым словом объявляют функцию в Go?',
    options: [
      { text: 'func', correct: true },
      { text: 'function' },
      { text: 'def' },
      { text: 'method' },
    ],
  },
  {
    text: 'Что делает вызов printWelcome()?',
    options: [
      { text: 'Выполняет код функции printWelcome', correct: true },
      { text: 'Создаёт новую функцию' },
      { text: 'Удаляет функцию printWelcome' },
      { text: 'Автоматически выводит имя функции' },
    ],
  },
  {
    text: 'Как правильно объявить функцию, принимающую название задачи?',
    options: [
      { text: 'func printTitle(title string) { }', correct: true },
      { text: 'func printTitle(string title) { }' },
      { text: 'function printTitle(title: string) { }' },
      { text: 'func printTitle(title) string { }' },
    ],
  },
  {
    text: 'Как в Go передаются аргументы функции?',
    options: [
      { text: 'По значению', correct: true },
      { text: 'Всегда по ссылке' },
      { text: 'Только через глобальные переменные' },
      { text: 'Только через указатели' },
    ],
  },
  {
    text: 'Как объявить функцию priorityLabel, возвращающую string?',
    options: [
      { text: 'func priorityLabel(priority int) string { }', correct: true },
      { text: 'func priorityLabel(priority int): string { }' },
      { text: 'func priorityLabel(priority int) returns string { }' },
      { text: 'string func priorityLabel(priority int) { }' },
    ],
  },
  {
    text: 'Что происходит после выполнения return в функции?',
    options: [
      { text: 'Функция сразу завершает выполнение', correct: true },
      { text: 'Цикл внутри функции повторяется' },
      { text: 'Программа всегда завершается' },
      { text: 'Go автоматически вызывает следующую функцию' },
    ],
  },
  {
    text: 'Как получить два результата validatePriority?',
    options: [
      { text: 'isValid, message := validatePriority(2)', correct: true },
      { text: 'isValid := message := validatePriority(2)' },
      { text: 'isValid = validatePriority(2, message)' },
      { text: 'validatePriority(2) -> isValid, message' },
    ],
  },
  {
    text: 'Как обозначить результат функции, который сейчас не нужен?',
    options: [
      { text: '_', correct: true },
      { text: 'null' },
      { text: 'skip' },
      { text: 'void' },
    ],
  },
  {
    text: 'Где доступна переменная, объявленная внутри функции?',
    options: [
      { text: 'Только внутри этой функции или вложенного блока', correct: true },
      { text: 'Во всех функциях пакета' },
      { text: 'Во всех файлах проекта' },
      { text: 'Только внутри main' },
    ],
  },
  {
    text: 'Почему полезно вернуть результат проверки, а не печатать его прямо в функции?',
    options: [
      { text: 'Функцию проще повторно использовать и проверить', correct: true },
      { text: 'fmt.Println нельзя вызывать в функциях' },
      { text: 'return работает только с bool' },
      { text: 'Функция с return не принимает параметры' },
    ],
  },
]
</script>

---
prev: /guide/variables-and-data-types/simple-data-types.md
next: /guide/variables-and-data-types/practice.md
---

# Самопроверка

Ответьте на вопросы без подсказок. Если ответ вызывает сомнение, вернитесь к примеру, измените его и запустите программу.

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какой вариант создаёт новую переменную внутри функции и позволяет компилятору вывести её тип?',
    options: [
      { text: 'title := "Купить продукты"', correct: true },
      { text: 'title = "Купить продукты"' },
      { text: 'const title := "Купить продукты"' },
      { text: 'string title = "Купить продукты"' },
    ],
  },
  {
    text: 'Где допустимо использовать короткое объявление :=?',
    options: [
      { text: 'Только внутри функции', correct: true },
      { text: 'Только за пределами функции' },
      { text: 'В любой части Go-файла' },
      { text: 'Только внутри блока const' },
    ],
  },
  {
    text: 'Какое значение получит переменная var completed bool без инициализации?',
    options: [
      { text: 'true' },
      { text: 'false', correct: true },
      { text: 'nil' },
      { text: 'Ошибка компиляции' },
    ],
  },
  {
    text: 'Что нужно использовать, если значение не должно меняться после объявления?',
    options: [
      { text: 'const', correct: true },
      { text: 'var' },
      { text: ':=' },
      { text: 'type' },
    ],
  },
  {
    text: 'Какое значение имеет первая строка с iota + 1 в блоке const?',
    options: [
      { text: '0' },
      { text: '1', correct: true },
      { text: 'Зависит от типа константы' },
      { text: 'iota нельзя использовать с арифметикой' },
    ],
  },
  {
    text: 'Какой тип обычно выбирают для обычного счётчика задач?',
    options: [
      { text: 'int', correct: true },
      { text: 'bool' },
      { text: 'string' },
      { text: 'rune' },
    ],
  },
  {
    text: 'Что возвращает len("Привет")?',
    options: [
      { text: 'Количество Unicode-символов: 6' },
      { text: 'Количество байтов: 12', correct: true },
      { text: '0, потому что строка не ASCII' },
      { text: 'Ошибку компиляции' },
    ],
  },
  {
    text: 'Как правильно посчитать количество рун в строке?',
    options: [
      { text: 'utf8.RuneCountInString(title)', correct: true },
      { text: 'len(title)' },
      { text: 'int(title)' },
      { text: 'title.Count()' },
    ],
  },
  {
    text: 'Что произойдёт при int(3.9)?',
    options: [
      { text: 'Получится 4' },
      { text: 'Получится 3', correct: true },
      { text: 'Будет ошибка компиляции' },
      { text: 'Получится 3.9' },
    ],
  },
  {
    text: 'Можно ли изменить отдельный символ строки так: title[0] = \'Г\'?',
    options: [
      { text: 'Нет, строки неизменяемы', correct: true },
      { text: 'Да, для строк на русском языке' },
      { text: 'Да, если использовать int' },
      { text: 'Только после вызова len' },
    ],
  },
]
</script>

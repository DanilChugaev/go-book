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
    text: 'Какое нулевое значение у переменной var title string?',
    options: [
      { text: 'Пустая строка ""', correct: true },
      { text: 'nil' },
      { text: 'false' },
      { text: 'Ошибка компиляции' },
    ],
  },
  {
    text: 'Как правильно преобразовать int priority в float64?',
    options: [
      { text: 'float64(priority)', correct: true },
      { text: 'priority.float64()' },
      { text: 'priority as float64' },
      { text: 'var value float64 = priority' },
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
    text: 'Что может произойти при преобразовании большого int в uint8?',
    options: [
      { text: 'Часть значения может быть потеряна', correct: true },
      { text: 'Go всегда автоматически выберет uint64' },
      { text: 'Значение обязательно станет nil' },
      { text: 'Преобразование всегда округляет число' },
    ],
  },
]
</script>

---
prev: /guide/loops/README.md
next: /guide/loops/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какой ключевой цикл есть в Go?',
    options: [
      { text: 'for', correct: true },
      { text: 'while' },
      { text: 'repeat' },
      { text: 'loop' },
    ],
  },
  {
    text: 'Сколько раз выполнится цикл for number := 1; number <= 3; number++?',
    options: [
      { text: '3 раза', correct: true },
      { text: '2 раза' },
      { text: '4 раза' },
      { text: 'Бесконечно' },
    ],
  },
  {
    text: 'Что делает break внутри цикла?',
    options: [
      { text: 'Завершает ближайший цикл', correct: true },
      { text: 'Пропускает только текущую итерацию' },
      { text: 'Увеличивает счётчик' },
      { text: 'Перезапускает программу' },
    ],
  },
  {
    text: 'Что делает continue внутри цикла?',
    options: [
      { text: 'Переходит к следующей итерации', correct: true },
      { text: 'Полностью завершает цикл' },
      { text: 'Возвращает значение из функции' },
      { text: 'Останавливает программу' },
    ],
  },
  {
    text: 'Как записать бесконечный цикл в Go?',
    options: [
      { text: 'for { }', correct: true },
      { text: 'while true { }' },
      { text: 'loop { }' },
      { text: 'for true; { }' },
    ],
  },
  {
    text: 'Почему цикл for taskNumber := 1; taskNumber < 3; taskNumber++ не выведет номер 3?',
    options: [
      { text: 'Условие taskNumber < 3 ложно при значении 3', correct: true },
      { text: 'Оператор ++ пропускает последнюю итерацию' },
      { text: 'for всегда заканчивается на 2' },
      { text: 'В Go нельзя использовать число 3 в циклах' },
    ],
  },
  {
    text: 'Что возвращает range при обходе строки?',
    options: [
      { text: 'Индекс в байтах и текущую руну', correct: true },
      { text: 'Номер слова и строку' },
      { text: 'Только число байтов' },
      { text: 'Всегда индекс символа и byte' },
    ],
  },
  {
    text: 'Почему в range для строки "Го" индексы равны 0 и 2?',
    options: [
      { text: 'Кириллические буквы занимают по два байта в UTF-8', correct: true },
      { text: 'range пропускает каждую вторую букву' },
      { text: 'Строка содержит только одну руну' },
      { text: 'Go считает индексы с нуля и двух' },
    ],
  },
  {
    text: 'Как обозначить неиспользуемый индекс в for range?',
    options: [
      { text: 'for _, symbol := range title', correct: true },
      { text: 'for null, symbol := range title' },
      { text: 'for *, symbol := range title' },
      { text: 'for skip, symbol := range title' },
    ],
  },
  {
    text: 'Что произойдёт, если в цикле с условием не изменять счётчик?',
    options: [
      { text: 'Цикл может стать бесконечным', correct: true },
      { text: 'Go автоматически увеличит счётчик' },
      { text: 'Компилятор всегда исправит код' },
      { text: 'break добавится автоматически' },
    ],
  },
]
</script>

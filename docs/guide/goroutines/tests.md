---
prev: /guide/goroutines/README.md
next: /guide/goroutines/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Как запустить вызов функции в новой goroutine?',
    options: [
      { text: 'go functionCall()', correct: true },
      { text: 'async functionCall()' },
      { text: 'goroutine functionCall()' },
      { text: 'parallel functionCall()' },
    ],
  },
  {
    text: 'Что происходит с незавершёнными goroutine при завершении main?',
    options: [
      { text: 'Они завершаются вместе с программой', correct: true },
      { text: 'Они всегда продолжают работу в фоне' },
      { text: 'Go автоматически ждёт каждую из них' },
      { text: 'Они превращаются в каналы' },
    ],
  },
  {
    text: 'Для чего нужен sync.WaitGroup?',
    options: [
      { text: 'Чтобы дождаться завершения группы goroutine', correct: true },
      { text: 'Чтобы записать JSON в файл' },
      { text: 'Чтобы заменить все каналы' },
      { text: 'Чтобы отсортировать слайс' },
    ],
  },
  {
    text: 'Что делает wg.Add(2)?',
    options: [
      { text: 'Увеличивает число ожидаемых завершений на 2', correct: true },
      { text: 'Создаёт две goroutine' },
      { text: 'Ждёт две секунды' },
      { text: 'Уменьшает счётчик на 2' },
    ],
  },
  {
    text: 'Где обычно размещают defer wg.Done()?',
    options: [
      { text: 'В начале тела goroutine', correct: true },
      { text: 'После wg.Wait() в main' },
      { text: 'Перед wg.Add()' },
      { text: 'Только в импортах' },
    ],
  },
  {
    text: 'Когда нужно вызвать wg.Add(1) относительно запуска go work(&wg)?',
    options: [
      { text: 'До запуска goroutine', correct: true },
      { text: 'После wg.Wait()' },
      { text: 'Только внутри work' },
      { text: 'Порядок не важен' },
    ],
  },
  {
    text: 'Почему WaitGroup передают как *sync.WaitGroup?',
    options: [
      { text: 'Чтобы все goroutine работали с одним счётчиком, а не с копией', correct: true },
      { text: 'Потому что WaitGroup содержит JSON' },
      { text: 'Потому что значения нельзя передавать в функции' },
      { text: 'Чтобы автоматически избежать всех гонок данных' },
    ],
  },
  {
    text: 'Почему time.Sleep не подходит для ожидания goroutine?',
    options: [
      { text: 'Он не гарантирует, что работа завершилась', correct: true },
      { text: 'time.Sleep всегда вызывает panic' },
      { text: 'Его нельзя использовать в main' },
      { text: 'Он создаёт канал' },
    ],
  },
  {
    text: 'Какой порядок вывода нескольких goroutine гарантирован без дополнительной синхронизации?',
    options: [
      { text: 'Никакой: порядок не определён', correct: true },
      { text: 'Строго в порядке их запуска' },
      { text: 'Строго в обратном порядке' },
      { text: 'По алфавиту имени функции' },
    ],
  },
  {
    text: 'Что опасно делать нескольким goroutine с одной переменной без синхронизации?',
    options: [
      { text: 'Одновременно изменять её — это может вызвать гонку данных', correct: true },
      { text: 'Читать её после wg.Wait()' },
      { text: 'Передавать её функции как параметр' },
      { text: 'Выводить её через fmt.Println' },
    ],
  },
]
</script>

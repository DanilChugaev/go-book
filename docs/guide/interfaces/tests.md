---
prev: /guide/interfaces/README.md
next: /guide/interfaces/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что определяет интерфейс в Go?',
    options: [
      { text: 'Набор методов, который должен быть доступен значению', correct: true },
      { text: 'Набор полей структуры' },
      { text: 'Размер массива' },
      { text: 'Порядок выполнения goroutine' },
    ],
  },
  {
    text: 'Как тип реализует интерфейс в Go?',
    options: [
      { text: 'Автоматически, если имеет методы с нужными сигнатурами', correct: true },
      { text: 'Через ключевое слово implements' },
      { text: 'Только через наследование' },
      { text: 'После регистрации в main' },
    ],
  },
  {
    text: 'Как правильно объявить интерфейс TaskFormatter?',
    options: [
      { text: 'type TaskFormatter interface { Summary() string }', correct: true },
      { text: 'interface TaskFormatter { Summary() string }' },
      { text: 'type TaskFormatter struct { Summary() string }' },
      { text: 'type TaskFormatter implements Summary() string' },
    ],
  },
  {
    text: 'Почему Task реализует TaskFormatter?',
    options: [
      { text: 'У Task есть метод Summary() string', correct: true },
      { text: 'Task обязательно содержит поле Title' },
      { text: 'Task хранится в слайсе' },
      { text: 'Task объявлен в main' },
    ],
  },
  {
    text: 'Что может принять функция printSummary(formatter TaskFormatter)?',
    options: [
      { text: 'Любое значение с методом Summary() string', correct: true },
      { text: 'Только Task' },
      { text: 'Только *Task' },
      { text: 'Только string' },
    ],
  },
  {
    text: 'Почему небольшие интерфейсы предпочтительнее?',
    options: [
      { text: 'Они описывают конкретную потребность кода и проще реализуются', correct: true },
      { text: 'Большие интерфейсы не компилируются' },
      { text: 'Интерфейс должен содержать ровно один метод по правилам Go' },
      { text: 'Они всегда работают быстрее' },
    ],
  },
  {
    text: 'Кто реализует интерфейс с методом Complete() bool, если Complete объявлен для *Task?',
    options: [
      { text: '*Task', correct: true },
      { text: 'Task и *Task' },
      { text: 'Только Task' },
      { text: 'Ни Task, ни *Task' },
    ],
  },
  {
    text: 'Кто реализует интерфейс с методом Summary() string, если Summary объявлен для Task?',
    options: [
      { text: 'Task и *Task', correct: true },
      { text: 'Только *Task' },
      { text: 'Только Task' },
      { text: 'Ни Task, ни *Task' },
    ],
  },
  {
    text: 'Чему равно неинициализированное интерфейсное значение?',
    options: [
      { text: 'nil', correct: true },
      { text: 'false' },
      { text: 'Пустой Task' },
      { text: 'Пустая строка' },
    ],
  },
  {
    text: 'Почему интерфейс с nil-указателем *Task внутри может не быть равен nil?',
    options: [
      { text: 'Интерфейс хранит конкретный тип *Task, даже если его значение nil', correct: true },
      { text: 'Go автоматически создаёт Task' },
      { text: 'Все интерфейсы всегда не равны nil' },
      { text: 'Указатели нельзя хранить в интерфейсах' },
    ],
  },
]
</script>

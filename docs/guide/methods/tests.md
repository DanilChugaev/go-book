---
prev: /guide/methods/README.md
next: /guide/methods/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Чем метод отличается от обычной функции?',
    options: [
      { text: 'У метода есть получатель определённого типа', correct: true },
      { text: 'Метод не может принимать параметры' },
      { text: 'Метод всегда изменяет структуру' },
      { text: 'Метод нельзя вызвать из main' },
    ],
  },
  {
    text: 'Как правильно объявить метод IsValid для типа Task?',
    options: [
      { text: 'func (task Task) IsValid() bool { }', correct: true },
      { text: 'func IsValid(task Task) method bool { }' },
      { text: 'method Task.IsValid() bool { }' },
      { text: 'func Task.IsValid() bool { }' },
    ],
  },
  {
    text: 'Как вызвать метод Summary у переменной task?',
    options: [
      { text: 'task.Summary()', correct: true },
      { text: 'Summary(task)' },
      { text: 'Task.Summary(task)' },
      { text: 'task->Summary()' },
    ],
  },
  {
    text: 'Какую функцию fmt стоит использовать, когда нужно вернуть отформатированную строку?',
    options: [
      { text: 'fmt.Sprintf', correct: true },
      { text: 'fmt.Println' },
      { text: 'fmt.Scan' },
      { text: 'fmt.Errorf' },
    ],
  },
  {
    text: 'Для каких методов подходит получатель по значению Task?',
    options: [
      { text: 'Для методов, которые только читают данные задачи', correct: true },
      { text: 'Только для методов, меняющих задачу' },
      { text: 'Только для работы с map' },
      { text: 'Ни для каких: всегда нужен указатель' },
    ],
  },
  {
    text: 'Что произойдёт после вызова MarkCompleted, если он объявлен как func (task Task) MarkCompleted()?',
    options: [
      { text: 'Изменится только копия task внутри метода', correct: true },
      { text: 'Исходная задача всегда станет выполненной' },
      { text: 'Программа не скомпилируется' },
      { text: 'Изменятся все задачи в слайсе' },
    ],
  },
  {
    text: 'Может ли метод вернуть bool?',
    options: [
      { text: 'Да, например IsValid() bool', correct: true },
      { text: 'Нет, методы всегда ничего не возвращают' },
      { text: 'Только если получатель — указатель' },
      { text: 'Только вместе с fmt.Println' },
    ],
  },
  {
    text: 'Где должны быть объявлены тип Task и его методы?',
    options: [
      { text: 'В одном пакете', correct: true },
      { text: 'Обязательно в одном файле' },
      { text: 'В разных модулях' },
      { text: 'Только внутри main' },
    ],
  },
  {
    text: 'Что делает метод IsValid для Task?',
    options: [
      { text: 'Проверяет данные и возвращает результат проверки', correct: true },
      { text: 'Автоматически сохраняет задачу в базу данных' },
      { text: 'Всегда печатает задачу в терминал' },
      { text: 'Удаляет некорректные поля' },
    ],
  },
  {
    text: 'Почему полезно разместить Summary рядом с типом Task?',
    options: [
      { text: 'Поведение задачи находится рядом с её данными', correct: true },
      { text: 'Так Go перестаёт копировать значения' },
      { text: 'Метод автоматически становится JSON' },
      { text: 'Нельзя писать функции вне структуры' },
    ],
  },
]
</script>

---
prev: /guide/time/README.md
next: /guide/time/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какой тип представляет конкретный момент времени?',
    options: [
      { text: 'time.Time', correct: true },
      { text: 'time.Duration' },
      { text: 'time.Context' },
      { text: 'time.String' },
    ],
  },
  {
    text: 'Как проверить, что DueAt не установлен?',
    options: [
      { text: 'task.DueAt.IsZero()', correct: true },
      { text: 'task.DueAt == nil' },
      { text: 'len(task.DueAt) == 0' },
      { text: 'task.DueAt.Empty()' },
    ],
  },
  {
    text: 'Что хранит time.Duration?',
    options: [
      { text: 'Интервал времени', correct: true },
      { text: 'Часовой пояс пользователя' },
      { text: 'Только дату без времени' },
      { text: 'JSON-тег' },
    ],
  },
  {
    text: 'Как добавить один час к моменту now?',
    options: [
      { text: 'now.Add(time.Hour)', correct: true },
      { text: 'now + time.Hour' },
      { text: 'time.Add(now, 1)' },
      { text: 'now.Append(time.Hour)' },
    ],
  },
  {
    text: 'Какой layout правильно отформатирует дату как 2026-10-12?',
    options: [
      { text: '"2006-01-02"', correct: true },
      { text: '"YYYY-MM-DD"' },
      { text: '"DD.MM.YYYY"' },
      { text: '"year-month-day"' },
    ],
  },
  {
    text: 'Какой метод корректно проверяет, что дедлайн уже прошёл?',
    options: [
      { text: 'time.Now().After(task.DueAt)', correct: true },
      { text: 'time.Now() == task.DueAt' },
      { text: 'len(task.DueAt) > 0' },
      { text: 'task.DueAt.Duration() < 0' },
    ],
  },
  {
    text: 'Что делает time.Parse без явно заданной Location?',
    options: [
      { text: 'Интерпретирует разобранное время в UTC', correct: true },
      { text: 'Всегда использует локальную зону компьютера' },
      { text: 'Автоматически определяет город пользователя' },
      { text: 'Возвращает только Duration' },
    ],
  },
  {
    text: 'Зачем в API обычно используют UTC?',
    options: [
      { text: 'Чтобы передавать один однозначный момент времени между системами', correct: true },
      { text: 'Чтобы автоматически показать время в городе пользователя' },
      { text: 'Чтобы time.Parse перестал возвращать error' },
      { text: 'Чтобы не хранить секунды' },
    ],
  },
  {
    text: 'Как time.Time сериализуется в JSON по умолчанию?',
    options: [
      { text: 'Как строка в формате RFC3339', correct: true },
      { text: 'Как число миллисекунд' },
      { text: 'Как map с полями времени' },
      { text: 'Никак, всегда возникает error' },
    ],
  },
  {
    text: 'Почему метод IsOverdue принимает now параметром?',
    options: [
      { text: 'Так результат предсказуем и метод проще тестировать', correct: true },
      { text: 'time.Now нельзя вызвать внутри метода' },
      { text: 'Так DueAt автоматически становится UTC' },
      { text: 'Это обязательно для JSON' },
    ],
  },
]
</script>

---
prev: /guide/strings-and-time/README.md
next: /guide/strings-and-time/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что делает strings.TrimSpace?',
    options: [
      { text: 'Удаляет пробельные символы в начале и конце строки', correct: true },
      { text: 'Удаляет все пробелы внутри строки' },
      { text: 'Переводит строку в нижний регистр' },
      { text: 'Считает количество символов' },
    ],
  },
  {
    text: 'Как выполнить поиск подстроки без учёта регистра?',
    options: [
      { text: 'Привести строку и подстроку к одному регистру через strings.ToLower', correct: true },
      { text: 'Использовать только len' },
      { text: 'Преобразовать строку в int' },
      { text: 'Вызвать time.Parse' },
    ],
  },
  {
    text: 'Что делает strings.Split("дом, покупки", ",")?',
    options: [
      { text: 'Возвращает слайс строк, разделённых запятой', correct: true },
      { text: 'Собирает слайс в строку' },
      { text: 'Удаляет запятые без создания слайса' },
      { text: 'Проверяет JSON' },
    ],
  },
  {
    text: 'Для чего используют strings.Builder?',
    options: [
      { text: 'Для эффективного построения большого текста', correct: true },
      { text: 'Для чтения JSON-файла' },
      { text: 'Для блокировки map' },
      { text: 'Для запуска goroutine' },
    ],
  },
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
    text: 'Как проверить, что DueAt не установлен и содержит нулевое время?',
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
]
</script>

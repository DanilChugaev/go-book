---
prev: /guide/packages-and-modules/README.md
next: /guide/packages-and-modules/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Что такое Go-модуль?',
    options: [
      { text: 'Проект или часть проекта с файлом go.mod', correct: true },
      { text: 'Один Go-файл' },
      { text: 'Только папка internal' },
      { text: 'Синоним функции main' },
    ],
  },
  {
    text: 'Что объединяет Go-пакет?',
    options: [
      { text: 'Go-файлы одной папки с одинаковым package', correct: true },
      { text: 'Все Go-файлы компьютера' },
      { text: 'Только один файл task.go' },
      { text: 'Только внешние зависимости' },
    ],
  },
  {
    text: 'Какая команда создаёт файл go.mod?',
    options: [
      { text: 'go mod init example.com/task-manager', correct: true },
      { text: 'go package init' },
      { text: 'go build mod' },
      { text: 'go run init' },
    ],
  },
  {
    text: 'Какой package нужен исполняемой Go-программе?',
    options: [
      { text: 'main', correct: true },
      { text: 'program' },
      { text: 'app' },
      { text: 'internal' },
    ],
  },
  {
    text: 'Как правильно импортировать internal/task из модуля example.com/task-manager?',
    options: [
      { text: '"example.com/task-manager/internal/task"', correct: true },
      { text: '"./internal/task"' },
      { text: '"../internal/task"' },
      { text: '"task.go"' },
    ],
  },
  {
    text: 'Как обратиться к экспортируемому типу Task пакета task?',
    options: [
      { text: 'task.Task', correct: true },
      { text: 'Task.task' },
      { text: 'task->Task' },
      { text: 'import.Task' },
    ],
  },
  {
    text: 'Какое имя доступно другому пакету?',
    options: [
      { text: 'ErrEmptyTitle', correct: true },
      { text: 'validateTitle' },
      { text: 'taskTitle' },
      { text: 'renameTask' },
    ],
  },
  {
    text: 'Зачем используют папку internal?',
    options: [
      { text: 'Чтобы запретить импорт пакета из независимых внешних модулей', correct: true },
      { text: 'Чтобы ускорить компиляцию любого кода' },
      { text: 'Чтобы автоматически экспортировать все имена' },
      { text: 'Чтобы хранить только тесты' },
    ],
  },
  {
    text: 'Можно ли держать Task и её методы в разных файлах папки internal/task?',
    options: [
      { text: 'Да, если во всех файлах указано package task', correct: true },
      { text: 'Нет, тип и методы всегда должны быть в одном файле' },
      { text: 'Только если используется map' },
      { text: 'Только с внешней зависимостью' },
    ],
  },
  {
    text: 'Почему Go сообщает об ошибке imported and not used?',
    options: [
      { text: 'Импортированный пакет не используется в файле', correct: true },
      { text: 'В пакете нет функции main' },
      { text: 'Модуль не содержит go.sum' },
      { text: 'Имя пакета начинается со строчной буквы' },
    ],
  },
]
</script>

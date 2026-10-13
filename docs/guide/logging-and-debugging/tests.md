---
prev: /guide/logging-and-debugging/README.md
next: /guide/logging-and-debugging/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какой пакет стандартной библиотеки предоставляет структурированное логирование?',
    options: [
      { text: 'log/slog', correct: true },
      { text: 'fmt/log' },
      { text: 'os/debug' },
      { text: 'sync/logger' },
    ],
  },
  {
    text: 'Как лучше записать ID задачи в структурированный лог?',
    options: [
      { text: 'logger.Info("задача добавлена", "task_id", task.ID)', correct: true },
      { text: 'logger.Info(fmt.Sprintf("задача %d добавлена", task.ID))' },
      { text: 'fmt.Println(task.ID)' },
      { text: 'panic(task.ID)' },
    ],
  },
  {
    text: 'Какой уровень подходит для нормального значимого события приложения?',
    options: [
      { text: 'Info', correct: true },
      { text: 'Error' },
      { text: 'Warn всегда' },
      { text: 'Fatal' },
    ],
  },
  {
    text: 'Какой уровень подходит для неуспешной операции сохранения?',
    options: [
      { text: 'Error', correct: true },
      { text: 'Info' },
      { text: 'Debug' },
      { text: 'Trace' },
    ],
  },
  {
    text: 'Для чего используют logger.With("task_id", id)?',
    options: [
      { text: 'Чтобы добавить общий контекст task_id ко всем логам дочернего logger', correct: true },
      { text: 'Чтобы изменить ID задачи в Store' },
      { text: 'Чтобы закрыть logger' },
      { text: 'Чтобы создать goroutine' },
    ],
  },
  {
    text: 'Как отключить вывод logger в unit-тесте?',
    options: [
      { text: 'Создать handler, который пишет в io.Discard', correct: true },
      { text: 'Удалить все вызовы logger из кода' },
      { text: 'Вызвать panic перед логом' },
      { text: 'Заменить logger на nil без проверки' },
    ],
  },
  {
    text: 'Какую команду используют для статического анализа подозрительных конструкций Go?',
    options: [
      { text: 'go vet ./...', correct: true },
      { text: 'go debug ./...' },
      { text: 'go lint встроенно' },
      { text: 'go profile ./...' },
    ],
  },
  {
    text: 'Как запустить только TestTaskRename в пакете internal/task?',
    options: [
      { text: 'go test ./internal/task -run "^TestTaskRename$"', correct: true },
      { text: 'go run TestTaskRename' },
      { text: 'go test -only TaskRename' },
      { text: 'go vet TestTaskRename' },
    ],
  },
  {
    text: 'С чего начать чтение stack trace после panic?',
    options: [
      { text: 'С первой строки, относящейся к коду проекта', correct: true },
      { text: 'С последней строки стандартной библиотеки' },
      { text: 'С удаления всех defer' },
      { text: 'С перезапуска компьютера' },
    ],
  },
  {
    text: 'Когда стоит начинать profiling через pprof?',
    options: [
      { text: 'Когда измерения показывают реальную проблему производительности', correct: true },
      { text: 'В каждом новом проекте до написания кода' },
      { text: 'Вместо unit-тестов' },
      { text: 'Только если приложение не компилируется' },
    ],
  },
]
</script>

---
prev: /guide/context/README.md
next: /guide/context/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Для чего обычно используют context.Context?',
    options: [
      { text: 'Для передачи отмены и дедлайна по цепочке операций', correct: true },
      { text: 'Для хранения всех задач приложения' },
      { text: 'Для замены любого параметра функции' },
      { text: 'Для сериализации JSON' },
    ],
  },
  {
    text: 'Где по соглашению передают context.Context в сигнатуре функции?',
    options: [
      { text: 'Первым параметром', correct: true },
      { text: 'Последним параметром' },
      { text: 'Только в возвращаемом значении' },
      { text: 'Внутри структуры Task' },
    ],
  },
  {
    text: 'Что возвращает context.WithCancel?',
    options: [
      { text: 'Дочерний context и функцию cancel', correct: true },
      { text: 'Только error' },
      { text: 'Канал строк' },
      { text: 'WaitGroup и Mutex' },
    ],
  },
  {
    text: 'Почему после WithTimeout обычно пишут defer cancel()?',
    options: [
      { text: 'Чтобы освободить ресурсы дочернего контекста при выходе из функции', correct: true },
      { text: 'Чтобы таймаут никогда не сработал' },
      { text: 'Чтобы превратить context в канал' },
      { text: 'Чтобы автоматически остановить все goroutine без проверок' },
    ],
  },
  {
    text: 'Что происходит с ctx.Done() после отмены контекста?',
    options: [
      { text: 'Канал закрывается', correct: true },
      { text: 'В него всегда отправляется строка' },
      { text: 'Он становится map' },
      { text: 'Контекст удаляет все файлы' },
    ],
  },
  {
    text: 'Что вернёт ctx.Err() после истечения WithTimeout?',
    options: [
      { text: 'context.DeadlineExceeded', correct: true },
      { text: 'context.Canceled всегда' },
      { text: 'nil' },
      { text: 'os.ErrNotExist' },
    ],
  },
  {
    text: 'Останавливает ли вызов cancel() goroutine принудительно?',
    options: [
      { text: 'Нет, goroutine должна сама проверить ctx.Done() или ctx.Err()', correct: true },
      { text: 'Да, runtime всегда немедленно завершает её' },
      { text: 'Да, но только goroutine с WaitGroup' },
      { text: 'Только если goroutine пишет JSON' },
    ],
  },
  {
    text: 'Как вернуть ошибку отмены из функции после получения сигнала Done?',
    options: [
      { text: 'return ctx.Err()', correct: true },
      { text: 'return context.Background()' },
      { text: 'return <-ctx.Done()' },
      { text: 'return nil' },
    ],
  },
  {
    text: 'Почему os.WriteFile не становится отменяемым сам после передачи context в функцию?',
    options: [
      { text: 'os.WriteFile не принимает context и не может автоматически слушать его отмену', correct: true },
      { text: 'Контекст работает только с map' },
      { text: 'Файлы нельзя использовать с goroutine' },
      { text: 'JSON отключает отмену' },
    ],
  },
  {
    text: 'Что не стоит передавать через context?',
    options: [
      { text: 'Обычные данные задачи, которые должны быть параметрами функции', correct: true },
      { text: 'Сигнал отмены' },
      { text: 'Дедлайн операции' },
      { text: 'Причину истечения таймаута через ctx.Err()' },
    ],
  },
]
</script>

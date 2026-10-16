---
prev: /guide/advanced-concurrency-patterns/goroutine-leaks.md
next: /guide/advanced-concurrency-patterns/practice.md
---

# Самопроверка: конкурентные паттерны

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какое утверждение лучше всего описывает worker pool?',
    options: [
      { text: 'Фиксированное число worker читает задания из общей очереди', correct: true },
      { text: 'Новая goroutine создаётся без лимита для каждого HTTP-запроса' },
      { text: 'Один mutex заменяет все каналы и context' },
      { text: 'Это канал, который всегда имеет бесконечный буфер' },
    ],
  },
  {
    text: 'Кто обычно закрывает канал jobs в worker pool?',
    options: [
      { text: 'Producer, который знает, что новых заданий больше не будет', correct: true },
      { text: 'Каждый worker после одного задания' },
      { text: 'Первый consumer, который получил задание' },
      { text: 'Любая goroutine после context cancellation' },
    ],
  },
  {
    text: 'Что означает backpressure в канальном pipeline?',
    options: [
      { text: 'Быстрый producer вынужден ждать, когда очередь заполнена или consumer не готов', correct: true },
      { text: 'Канал автоматически отбрасывает все старые задачи' },
      { text: 'Worker всегда становится быстрее после увеличения буфера' },
      { text: 'Отмена context происходит при каждом send' },
    ],
  },
  {
    text: 'Почему большой буфер не является универсальным решением зависания?',
    options: [
      { text: 'Он лишь откладывает блокировку, увеличивает память и может скрыть ошибку протокола', correct: true },
      { text: 'Буферизированные каналы нельзя читать через range' },
      { text: 'Буфер запрещает использовать context' },
      { text: 'Go runtime всегда игнорирует буфер больше одного элемента' },
    ],
  },
  {
    text: 'Как semaphore на buffered channel ограничивает число активных операций?',
    options: [
      { text: 'Каждая операция занимает token перед стартом и возвращает его при завершении', correct: true },
      { text: 'Канал автоматически отменяет лишние goroutine через panic' },
      { text: 'Он сортирует задания по приоритету' },
      { text: 'Он гарантирует порядок выполнения worker' },
    ],
  },
  {
    text: 'Чем fan-out отличается от fan-in?',
    options: [
      { text: 'Fan-out распределяет поток между worker, fan-in объединяет несколько потоков', correct: true },
      { text: 'Fan-out работает только с map, fan-in — только со слайсами' },
      { text: 'Fan-in запрещает несколько producer' },
      { text: 'Это два названия одного и того же паттерна' },
    ],
  },
  {
    text: 'Почему sender в отменяемом pipeline отправляет значение через select с ctx.Done()?',
    options: [
      { text: 'Чтобы не остаться навечно на send, если downstream перестал читать', correct: true },
      { text: 'Чтобы отправить одно значение сразу во все каналы' },
      { text: 'Чтобы закрыть ctx.Done() вручную' },
      { text: 'Чтобы заменить WaitGroup' },
    ],
  },
  {
    text: 'Что делает errgroup.WithContext при первой ненулевой ошибке функции группы?',
    options: [
      { text: 'Отменяет производный context; остальные функции должны сами заметить отмену', correct: true },
      { text: 'Принудительно уничтожает все goroutine в процессе' },
      { text: 'Автоматически закрывает все созданные каналы' },
      { text: 'Возвращает все ошибки через errors.Join' },
    ],
  },
  {
    text: 'Когда errgroup с первой ошибкой хуже, чем сбор всех ошибок?',
    options: [
      { text: 'Когда независимые задачи нужно выполнить best-effort и выдать полный отчёт', correct: true },
      { text: 'Когда нужно отменить обязательную batch-операцию при первой ошибке' },
      { text: 'Когда две обязательные HTTP-операции можно запустить параллельно' },
      { text: 'Когда не нужно ждать завершения ни одной goroutine' },
    ],
  },
  {
    text: 'Что означает graceful shutdown worker group в общем случае?',
    options: [
      { text: 'Остановить приём новой работы, сообщить об остановке, дождаться worker в пределах deadline', correct: true },
      { text: 'Немедленно вызвать os.Exit из первого worker' },
      { text: 'Сразу закрыть базу данных, пока handler ещё работают' },
      { text: 'Закрыть все каналы из любого consumer' },
    ],
  },
  {
    text: 'Какой сценарий является типичной утечкой goroutine?',
    options: [
      { text: 'Goroutine навечно ждёт send в канал, который caller больше не читает', correct: true },
      { text: 'Worker завершился после закрытия jobs' },
      { text: 'HTTP handler передал Request.Context в QueryContext' },
      { text: 'Координатор закрыл output после WaitGroup.Wait' },
    ],
  },
  {
    text: 'Для чего в тесте shutdown полезны каналы started и stopped?',
    options: [
      { text: 'Они задают детерминированные события вместо ожидания произвольного Sleep', correct: true },
      { text: 'Они автоматически находят все data race' },
      { text: 'Они заменяют context во всём приложении' },
      { text: 'Они позволяют не вызывать cancel' },
    ],
  },
]
</script>

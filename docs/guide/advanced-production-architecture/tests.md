---
prev: /guide/advanced-production-architecture/security-review.md
next: /guide/advanced-production-architecture/practice.md
---

# Самопроверка: архитектура production-сервиса

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какое направление зависимостей предпочтительно для Task Manager API?',
    options: [
      { text: 'Gin handler → service → интерфейс repository; PostgreSQL реализует интерфейс снаружи', correct: true },
      { text: 'Domain package импортирует Gin и database/sql' },
      { text: 'Repository выбирает HTTP-статус и JSON response' },
      { text: 'Каждый handler открывает своё подключение к PostgreSQL' },
    ],
  },
  {
    text: 'Где обычно объявляют небольшой интерфейс зависимости?',
    options: [
      { text: 'Рядом с потребителем, которому нужна конкретная возможность', correct: true },
      { text: 'В общем пакете common до появления использования' },
      { text: 'Только в пакете конкретной PostgreSQL-реализации' },
      { text: 'В main вместе со всеми env-переменными' },
    ],
  },
  {
    text: 'Что является главной ролью composition root в main?',
    options: [
      { text: 'Загрузить config, создать конкретные реализации, связать зависимости и управлять lifecycle', correct: true },
      { text: 'Хранить SQL всех repository' },
      { text: 'Проверять JSON body каждого запроса' },
      { text: 'Заменять unit-тесты интеграцией' },
    ],
  },
  {
    text: 'Почему нельзя логировать Config целиком?',
    options: [
      { text: 'В нём могут быть DSN, пароли и tokens; логируют только безопасные поля', correct: true },
      { text: 'slog не умеет логировать структуры' },
      { text: 'Config всегда содержит только числа' },
      { text: 'Это нарушает правила компилятора Go' },
    ],
  },
  {
    text: 'Что должна отвечать liveness probe?',
    options: [
      { text: 'Жив ли процесс; проверка должна быть лёгкой и не зависеть от внешних сервисов', correct: true },
      { text: 'Доступен ли каждый downstream API в интернете' },
      { text: 'Сколько задач в PostgreSQL' },
      { text: 'Какая версия JWT у текущего клиента' },
    ],
  },
  {
    text: 'Как readiness должна вести себя в начале graceful shutdown?',
    options: [
      { text: 'Перестать принимать новый трафик, например вернуть 503 со статусом draining', correct: true },
      { text: 'Продолжать отвечать ready до os.Exit' },
      { text: 'Сразу закрыть базу данных' },
      { text: 'Отправить клиентам stack trace' },
    ],
  },
  {
    text: 'Почему task_id нельзя добавлять как label HTTP-метрики?',
    options: [
      { text: 'Он создаёт неограниченную cardinality time series', correct: true },
      { text: 'Числовые labels запрещены Prometheus' },
      { text: 'TaskID нельзя использовать в Go' },
      { text: 'Метрики всегда должны содержать полный request body' },
    ],
  },
  {
    text: 'Что нужно передавать в service и downstream client для сохранения отмены и trace context?',
    options: [
      { text: 'c.Request.Context()', correct: true },
      { text: 'Новый context.Background() в каждом методе' },
      { text: 'Только X-Request-ID как string' },
      { text: 'Глобальный mutable context' },
    ],
  },
  {
    text: 'Когда retry обычно безопаснее применять?',
    options: [
      { text: 'Для ограниченной idempotent операции и только при временной ошибке в пределах deadline', correct: true },
      { text: 'Для любого POST без idempotency policy' },
      { text: 'Бесконечно, пока dependency не ответит' },
      { text: 'После любого 400 validation error' },
    ],
  },
  {
    text: 'Как idempotency key помогает POST создания?',
    options: [
      { text: 'Повтор того же логического запроса возвращает первоначальный результат вместо создания дубликата', correct: true },
      { text: 'Автоматически авторизует пользователя' },
      { text: 'Шифрует database password' },
      { text: 'Заменяет transaction в PostgreSQL' },
    ],
  },
  {
    text: 'Почему in-memory rate limiter не даёт строгий общий лимит при нескольких replicas?',
    options: [
      { text: 'У каждого процесса собственное состояние и клиент может распределить запросы между ними', correct: true },
      { text: 'Gin запрещает limiter при Docker Compose' },
      { text: 'Rate limit всегда должен быть равен нулю' },
      { text: 'Redis не поддерживает rate limiting' },
    ],
  },
  {
    text: 'Чем authentication отличается от authorization?',
    options: [
      { text: 'Authentication устанавливает identity, authorization проверяет право на конкретное действие/ресурс', correct: true },
      { text: 'Это два названия JWT signature verification' },
      { text: 'Authorization выполняется только на frontend' },
      { text: 'Authentication заменяет проверку owner задачи' },
    ],
  },
]
</script>

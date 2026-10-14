---
prev: /guide/configuration-and-lifecycle/README.md
next: /guide/configuration-and-lifecycle/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Почему настройки окружения не стоит хранить в исходном коде?',
    options: [
      { text: 'Они отличаются между средами и могут содержать секреты', correct: true },
      { text: 'Go не поддерживает константы' },
      { text: 'Их нельзя передать Docker' },
      { text: 'Иначе JSON перестанет работать' },
    ],
  },
  {
    text: 'Чем os.LookupEnv отличается от os.Getenv?',
    options: [
      { text: 'LookupEnv сообщает, была ли переменная задана, отдельно от её значения', correct: true },
      { text: 'LookupEnv автоматически читает .env' },
      { text: 'Getenv возвращает time.Duration' },
      { text: 'Ничем' },
    ],
  },
  {
    text: 'Зачем нужен .env.example?',
    options: [
      { text: 'Чтобы показать требуемые переменные без публикации настоящих секретов', correct: true },
      { text: 'Чтобы заменить production secrets' },
      { text: 'Чтобы Go автоматически загрузил env' },
      { text: 'Чтобы не писать тесты конфигурации' },
    ],
  },
  {
    text: 'Когда нужно проверять обязательный URL внешнего сервиса?',
    options: [
      { text: 'При старте приложения, до запуска HTTP-сервера', correct: true },
      { text: 'Только после первого HTTP-запроса пользователя' },
      { text: 'Только в браузере' },
      { text: 'Никогда: URL всегда корректен' },
    ],
  },
  {
    text: 'Какие сигналы обычно запускают graceful shutdown?',
    options: [
      { text: 'SIGINT и SIGTERM', correct: true },
      { text: 'Только SIGKILL' },
      { text: 'Только HTTP 404' },
      { text: 'Сигнал JSON' },
    ],
  },
  {
    text: 'Что делает server.Shutdown(ctx)?',
    options: [
      { text: 'Перестаёт принимать новые запросы и ждёт активные до завершения ctx', correct: true },
      { text: 'Немедленно обрывает все соединения без ожидания' },
      { text: 'Удаляет Docker-контейнер' },
      { text: 'Перезагружает HTTP-сервер' },
    ],
  },
  {
    text: 'Почему shutdown context создают от context.Background(), а не от уже отменённого signal context?',
    options: [
      { text: 'Чтобы дать активным handler отдельное ограниченное время на завершение', correct: true },
      { text: 'Чтобы отмена сигнала никогда не работала' },
      { text: 'Чтобы JSON стал валидным' },
      { text: 'Чтобы пропустить закрытие сервера' },
    ],
  },
  {
    text: 'В каком порядке закрывать сервер и базу данных?',
    options: [
      { text: 'Сначала server.Shutdown, затем закрыть базу и остальные зависимости', correct: true },
      { text: 'Сначала базу, затем начать принимать новые запросы' },
      { text: 'Одновременно через os.Exit' },
      { text: 'Базу закрывать не нужно' },
    ],
  },
  {
    text: 'Как безопасно менять env в непараллельном unit-тесте?',
    options: [
      { text: 'Через t.Setenv', correct: true },
      { text: 'Через commit .env в репозиторий' },
      { text: 'Через time.Sleep' },
      { text: 'Через fmt.Println' },
    ],
  },
  {
    text: 'Каким должен быть базовый health-check?',
    options: [
      { text: 'Быстрым, без авторизации и тяжёлой работы', correct: true },
      { text: 'Обязательным запросом ко всем внешним API' },
      { text: 'Доступным только через POST' },
      { text: 'Запускающим миграции БД' },
    ],
  },
]
</script>

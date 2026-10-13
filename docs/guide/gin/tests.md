---
prev: /guide/gin/README.md
next: /guide/gin/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Какую часть Task Manager API заменяет Gin в этой главе?',
    options: [
      { text: 'Только HTTP-слой: маршрутизацию, handlers и middleware', correct: true },
      { text: 'Service и все бизнес-правила' },
      { text: 'Репозиторий и PostgreSQL' },
      { text: 'Модель Task и unit-тесты' },
    ],
  },
  {
    text: 'Как в Gin записывают path-параметр id в маршруте?',
    options: [
      { text: '/tasks/:id/complete', correct: true },
      { text: '/tasks/{id}/complete' },
      { text: '/tasks/<id>/complete' },
      { text: '/tasks/?id/complete' },
    ],
  },
  {
    text: 'Как получить path-параметр id в Gin handler?',
    options: [
      { text: 'c.Param("id")', correct: true },
      { text: 'c.PathValue("id")' },
      { text: 'c.Header("id")' },
      { text: 'c.JSON("id")' },
    ],
  },
  {
    text: 'Какой context нужно передавать из Gin handler в service?',
    options: [
      { text: 'c.Request.Context()', correct: true },
      { text: 'Сам *gin.Context' },
      { text: 'context.Background() для каждого запроса' },
      { text: 'Никакой context не нужен' },
    ],
  },
  {
    text: 'Почему для создания задачи подходит c.ShouldBindJSON?',
    options: [
      { text: 'Он связывает JSON со структурой и возвращает ошибку без автоматического ответа', correct: true },
      { text: 'Он запускает HTTP-сервер' },
      { text: 'Он автоматически сохраняет задачу в Store' },
      { text: 'Он заменяет проверку бизнес-правил в service' },
    ],
  },
  {
    text: 'Что нужно включить, чтобы Gin отклонял неизвестные JSON-поля?',
    options: [
      { text: 'gin.EnableJsonDecoderDisallowUnknownFields()', correct: true },
      { text: 'gin.EnableDebugPrintRouteFunc()' },
      { text: 'c.Abort()' },
      { text: 'http.MaxBytesReader() без decoder' },
    ],
  },
  {
    text: 'Зачем request ID добавляют в response header?',
    options: [
      { text: 'Чтобы клиент мог связать свой запрос с серверными логами', correct: true },
      { text: 'Чтобы заменить HTTP-статус' },
      { text: 'Чтобы передать пароль пользователя' },
      { text: 'Чтобы отключить middleware' },
    ],
  },
  {
    text: 'Что делает c.Abort() в middleware?',
    options: [
      { text: 'Останавливает выполнение оставшихся handlers текущей цепочки', correct: true },
      { text: 'Завершает весь HTTP-сервер' },
      { text: 'Удаляет request из логов' },
      { text: 'Перезапускает service' },
    ],
  },
  {
    text: 'Почему в проекте выбирают gin.New(), а не gin.Default()?',
    options: [
      { text: 'Чтобы явно подключить свой slog access log и recovery без дублирования встроенных middleware', correct: true },
      { text: 'gin.Default() не поддерживает маршруты' },
      { text: 'gin.New() автоматически подключает базу данных' },
      { text: 'Так Gin перестаёт использовать net/http' },
    ],
  },
  {
    text: 'Как тестировать Gin handler без запуска сервера на реальном порту?',
    options: [
      { text: 'Через httptest.NewRequest, httptest.NewRecorder и router.ServeHTTP', correct: true },
      { text: 'Только вручную через curl' },
      { text: 'Через time.Sleep после router.Run()' },
      { text: 'Никак: Gin требует реальную сеть' },
    ],
  },
]
</script>

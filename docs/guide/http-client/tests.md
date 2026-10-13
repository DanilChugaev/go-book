---
prev: /guide/http-client/README.md
next: /guide/http-client/practice.md
---

# Самопроверка

<QuizContainer :questions />

<script setup>
const questions = [
  {
    text: 'Почему http.Client обычно создают один раз и переиспользуют?',
    options: [
      { text: 'Он переиспользует соединения и безопасен для нескольких goroutine', correct: true },
      { text: 'Его нельзя передавать как зависимость' },
      { text: 'Он заменяет context.Context' },
      { text: 'Так JSON автоматически валидируется' },
    ],
  },
  {
    text: 'Как связать исходящий HTTP request с отменой входящей операции?',
    options: [
      { text: 'Создать его через http.NewRequestWithContext с полученным ctx', correct: true },
      { text: 'Всегда использовать context.Background()' },
      { text: 'Передать ctx только в заголовке' },
      { text: 'Вызвать time.Sleep перед Do' },
    ],
  },
  {
    text: 'Что нужно сделать сразу после успешного client.Do(request)?',
    options: [
      { text: 'Запланировать defer response.Body.Close()', correct: true },
      { text: 'Сразу вызвать panic' },
      { text: 'Игнорировать response и вернуть nil' },
      { text: 'Создать ещё один http.Client' },
    ],
  },
  {
    text: 'Почему статус HTTP нужно проверять отдельно от ошибки client.Do?',
    options: [
      { text: 'Не-2xx ответ обычно возвращает response и nil error транспорта', correct: true },
      { text: 'client.Do всегда превращает 404 в panic' },
      { text: 'HTTP не имеет статусов' },
      { text: 'JSON Decoder проверяет статус сам' },
    ],
  },
  {
    text: 'Как безопасно добавить пользовательское название задачи в query-параметр?',
    options: [
      { text: 'Через url.Parse, endpoint.Query и query.Encode', correct: true },
      { text: 'Конкатенацией строки URL и title' },
      { text: 'Через fmt.Println(title)' },
      { text: 'Через заголовок Content-Type' },
    ],
  },
  {
    text: 'Зачем внешний JSON декодируют в отдельный PriorityHint?',
    options: [
      { text: 'Чтобы внешний сервис не задавал поля внутренней модели Task', correct: true },
      { text: 'Чтобы не использовать json-теги' },
      { text: 'Чтобы HTTP перестал использовать JSON' },
      { text: 'Чтобы body не нужно было закрывать' },
    ],
  },
  {
    text: 'Что описывает Client.Timeout?',
    options: [
      { text: 'Предельное время всей HTTP-операции клиента', correct: true },
      { text: 'Только время JSON-декодирования' },
      { text: 'Максимальный размер response body' },
      { text: 'Количество retry' },
    ],
  },
  {
    text: 'Какой инструмент подходит для unit-теста HTTP-клиента без внешней сети?',
    options: [
      { text: 'httptest.Server', correct: true },
      { text: 'Публичный API в интернете' },
      { text: 'time.Sleep' },
      { text: 'go run сервера на фиксированном порту' },
    ],
  },
  {
    text: 'Как проверить ошибку неуспешного статуса, если она имеет тип *HTTPStatusError?',
    options: [
      { text: 'errors.As(err, &statusError)', correct: true },
      { text: 'Сравнить err.Error() с текстом' },
      { text: 'errors.Is(err, http.StatusTooManyRequests)' },
      { text: 'Игнорировать ошибку' },
    ],
  },
  {
    text: 'Почему не стоит автоматически повторять любой HTTP-запрос?',
    options: [
      { text: 'Повтор может создать дубликат, усилить нагрузку или нарушить политику внешнего сервиса', correct: true },
      { text: 'Go запрещает повторять запросы' },
      { text: 'GET никогда нельзя повторять' },
      { text: 'Retry автоматически закрывает body' },
    ],
  },
]
</script>

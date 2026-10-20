---
prev: /guide/resty/tests.md
next: /guide/resty/best-practices.md
---

# Задания: перенос клиента подсказок на Resty

Замените реализацию `internal/priorityclient` со стандартного `http.Client` на Resty. Внешний интерфейс `PrioritySuggester` и `TaskService` не меняйте: service не должен заметить, какую библиотеку использует инфраструктурный клиент.

## Задание 1. Подключите Resty и создайте клиент

Добавьте зависимость `github.com/go-resty/resty/v2`. В `priorityclient.New` создайте один `resty.Client` с base URL, timeout три секунды и общими заголовками `Accept: application/json` и `User-Agent: task-manager-api/1.0`. При необходимости конструктор может принимать `http.RoundTripper` для настройки транспорта.

**Критерии проверки:**

- зависимость добавлена командой `go get`;
- Resty импортируется как `github.com/go-resty/resty/v2`;
- base URL не имеет завершающего `/`;
- timeout устанавливается через `SetTimeout`;
- общие headers не повторяются в каждом `Suggest`;
- `TaskService` не импортирует Resty.

<details>
  <summary>Подсказка</summary>

```go
client := resty.New().
	SetBaseURL(strings.TrimRight(baseURL, "/")).
	SetTimeout(3 * time.Second).
	SetHeader("Accept", "application/json")
```
</details>

## Задание 2. Перенесите `Suggest`

Сохраните сигнатуру метода `Suggest(ctx, title)`. Через `client.R()` передайте context, query `title` и указатель на `PriorityHint` в `SetResult`, затем выполните GET `/v1/suggest`.

**Критерии проверки:**

- используется `SetContext(ctx)`;
- query задаётся через `SetQueryParam`;
- `SetResult` получает `*PriorityHint`;
- URL пути относительный к base URL;
- передаётся `GET /v1/suggest`;
- результат приоритета дополнительно проверяется от 1 до 5.

<details>
  <summary>Подсказка</summary>

```go
response, err := client.resty.R().
	SetContext(ctx).
	SetQueryParam("title", title).
	SetResult(&hint).
	Get("/v1/suggest")
```
</details>

## Задание 3. Сохраните HTTP-контракт ошибок

Верните `*HTTPStatusError` для любого ответа, который не входит в диапазон `2xx`. Используйте `response.IsError()` и `response.IsSuccess()`. Ошибки Resty оборачивайте через `%w`.

**Критерии проверки:**

- `4xx` и `5xx` становятся `*HTTPStatusError`;
- `3xx` также не принимается как успешный ответ;
- transport error сохраняет исходную причину для `errors.Is`;
- `HTTPStatusError` содержит код и текст статуса;
- `PriorityHint` не возвращается при неуспешном статусе.

<details>
  <summary>Подсказка</summary>

```go
if response.IsError() || !response.IsSuccess() {
	return PriorityHint{}, &HTTPStatusError{
		StatusCode: response.StatusCode(),
		Status:     response.Status(),
	}
}
```
</details>

## Задание 4. Добавьте безопасный hook логирования

Напишите функцию, которая получает `*resty.Client` и `*slog.Logger`, добавляет `OnAfterResponse` и записывает метод, URL, HTTP-статус и длительность. Не пишите токены, cookies и body.

**Критерии проверки:**

- используется `OnAfterResponse`;
- лог создаётся только после получения response;
- есть `method`, `url`, `status`, `duration`;
- hook возвращает `nil`;
- в лог не попадают `Authorization`, cookies и body;
- сетевые ошибки обрабатываются вне hook.

<details>
  <summary>Подсказка</summary>

```go
client.OnAfterResponse(func(_ *resty.Client, response *resty.Response) error {
	logger.Info("внешний HTTP-запрос завершён", "status", response.StatusCode())
	return nil
})
```
</details>

## Задание 5. Добавьте retry только для временного GET

Создайте отдельный Resty-клиент или настройте отдельный request для получения подсказки. Ограничьте retry двумя повторами и разрешите его только для `GET` с ответом `503`. Добавьте краткое пояснение, почему это правило нельзя бездумно перенести на `POST /tasks`.

**Критерии проверки:**

- `SetRetryCount(2)`;
- есть ограниченные `SetRetryWaitTime` и `SetRetryMaxWaitTime`;
- condition проверяет метод GET и статус `503`;
- retry не включён глобально для запросов изменения данных;
- в документации или комментарии указана опасность повтора `POST`;
- context передаётся в каждый request.

<details>
  <summary>Подсказка</summary>

```go
AddRetryCondition(func(response *resty.Response, err error) bool {
	return err == nil &&
		response.Request.Method == http.MethodGet &&
		response.StatusCode() == http.StatusServiceUnavailable
})
```
</details>

## Задание 6. Проверьте клиента через `httptest.Server`

Перенесите тесты из главы про `http.Client`: успешный ответ, `429`, некорректный JSON и отменённый context. Добавьте проверку, что `title` с символом `&` приходит одним query-параметром. Для retry добавьте отдельный handler с контролируемым счётчиком: он отвечает `503` первые две попытки и `200` на третью.

**Критерии проверки:**

- тесты не вызывают публичные сервисы;
- каждый `httptest.Server` закрывается;
- успешный тест проверяет метод, путь, заголовок и query;
- `429` проверяется через `errors.As`;
- отмена проверяется через `errors.Is(err, context.Canceled)` без `time.Sleep`;
- retry-тест детерминированно проверяет три попытки;
- `go test ./...` и `go test -race ./...` проходят.

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- объяснить, что Resty дополняет, а не заменяет `net/http`;
- передать context, query и DTO через Resty request;
- проверить только `2xx` как успешный контракт;
- безопасно логировать внешний вызов;
- ограничить retry идемпотентным запросом;
- сохранить независимость service от HTTP-библиотеки.

## Полный исходный код

Здесь будет размещён полный исходный код к практическим заданиям этой главы.

<ExampleSource
  path="examples/30/resty"
  description="заготовка для полного исходного кода практических заданий главы"
/>

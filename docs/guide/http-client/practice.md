---
prev: /guide/http-client/tests.md
next: /guide/http-client/best-practices.md
---

# Задания: клиент подсказок приоритета

Добавьте Task Manager API клиента внешнего сервиса приоритетов. Внешний HTTP-код должен жить в отдельном пакете, а service должен зависеть от маленького интерфейса, а не от конкретного `http.Client`.

## Задание 1. Создайте переиспользуемый клиент

Создайте пакет `internal/priorityclient` и тип `Client` с `baseURL` и `*http.Client`. Конструктор получает зависимости снаружи, удаляет завершающий `/` из base URL и создаёт клиент с таймаутом три секунды, если передан `nil`.

**Критерии проверки:**

- `Client` хранит один `*http.Client`;
- `baseURL` нормализуется через `strings.TrimRight`;
- `nil`-клиент заменяется на клиент с `Timeout`;
- новый `http.Client` не создаётся внутри каждого запроса;
- пакет не импортирует Gin.

<details>
  <summary>Подсказка</summary>

```go
func New(baseURL string, httpClient *http.Client) *Client {
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 3 * time.Second}
	}

	return &Client{
		baseURL:    strings.TrimRight(baseURL, "/"),
		httpClient: httpClient,
	}
}
```
</details>

## Задание 2. Реализуйте `Suggest`

Реализуйте метод:

```go
func (client *Client) Suggest(ctx context.Context, title string) (PriorityHint, error)
```

Он должен выполнить `GET /v1/suggest?title=...`, передать заголовок `Accept: application/json`, проверить любой `2xx` как успешный статус и декодировать `priority` и `source` из JSON.

**Критерии проверки:**

- request создаётся через `http.NewRequestWithContext`;
- query-параметр собирается через `net/url`;
- после успешного `Do` есть `defer response.Body.Close()`;
- response status проверяется до JSON-декодирования;
- JSON декодируется в `PriorityHint`, а не в `task.Task`;
- приоритет ответа проверяется в диапазоне 1–5.

<details>
  <summary>Подсказка</summary>

```go
query := endpoint.Query()
query.Set("title", title)
endpoint.RawQuery = query.Encode()
```
</details>

## Задание 3. Обработайте ошибки внешнего API

Создайте тип `HTTPStatusError` с `StatusCode` и `Status`. Для любого статуса вне диапазона `200–299` возвращайте указатель на этот тип. Ошибки `Do` оборачивайте через `%w`.

**Критерии проверки:**

- не-2xx ответ не декодируется как успешный JSON;
- ошибка содержит HTTP-статус без сравнения текста;
- тест может извлечь ошибку через `errors.As`;
- ошибка context не теряется при оборачивании;
- response body закрывается и при не-2xx ответе.

<details>
  <summary>Подсказка</summary>

```go
if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
	return PriorityHint{}, &HTTPStatusError{
		StatusCode: response.StatusCode,
		Status:     response.Status,
	}
}
```
</details>

## Задание 4. Внедрите интерфейс в service

Создайте интерфейс `PrioritySuggester` с методом `Suggest`. Передайте его в `TaskService`. Определите и задокументируйте правило: если пользователь не передал приоритет, service использует подсказку; если внешний сервис вернул ошибку, создание задачи завершается ошибкой **или** использует приоритет по умолчанию.

**Критерии проверки:**

- service зависит от интерфейса, а не от `priorityclient.Client`;
- в interface передаётся `context.Context`;
- выбранная политика ошибки явно описана;
- выбранная политика покрыта unit-тестом service;
- HTTP handler не знает base URL внешнего API.

## Задание 5. Протестируйте успешный запрос через `httptest.Server`

Создайте `httptest.Server`, который проверяет `GET`, путь `/v1/suggest`, query `title` и `Accept`. В ответ отправьте JSON с приоритетом 3. Проверьте, что `Suggest` вернул ожидаемый `PriorityHint`.

**Критерии проверки:**

- адрес тестового сервера передаётся в `New`;
- используется `server.Client()`;
- проверяется исходящий метод, путь, query и заголовок;
- проверяется полученный DTO;
- тест не требует доступа в интернет.

<details>
  <summary>Подсказка</summary>

```go
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// Проверки request и JSON-ответ.
}))
defer server.Close()

client := New(server.URL, server.Client())
```
</details>

## Задание 6. Протестируйте ошибки без задержек

Добавьте тесты для `429 Too Many Requests`, некорректного JSON и заранее отменённого context. Для статуса используйте `errors.As`, для отмены — `errors.Is(err, context.Canceled)`. Не используйте `time.Sleep`.

**Критерии проверки:**

- `429` возвращается как `*HTTPStatusError`;
- неверный JSON возвращает ошибку;
- отменённый до вызова context возвращает `context.Canceled`;
- каждый тест создаёт собственный `httptest.Server` при необходимости;
- отсутствуют публичные HTTP-вызовы и фиксированные задержки;
- `go test ./...` и `go test -race ./...` проходят.

<details>
  <summary>Подсказка</summary>

```go
ctx, cancel := context.WithCancel(context.Background())
cancel()

_, err := client.Suggest(ctx, "Купить молоко")
if !errors.Is(err, context.Canceled) {
	t.Fatalf("error = %v, ожидалась context.Canceled", err)
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- переиспользовать настроенный `http.Client`;
- создать request с родительским context;
- проверить HTTP-статус и закрыть response body;
- безопасно передать query и заголовки;
- отделить DTO внешнего API от модели Task;
- протестировать клиент через `httptest.Server` без сети и задержек.

---
prev: /guide/http-client/best-practices.md
next: /guide/resty/tests.md
---

# HTTP-клиент на Resty

## Цель урока

Переписать клиент подсказок приоритета на Resty и сравнить его со стандартным `http.Client`. Научиться настраивать base URL, заголовки, context, JSON-декодирование, обработку HTTP-статусов, ограниченный retry и тестировать Resty-клиент через `httptest.Server` без изменения интерфейса service.

Resty — сторонняя библиотека для HTTP-клиента. Она использует `net/http` под капотом, но сокращает повторяющийся код для query-параметров, заголовков, JSON и retry. Она не отменяет знания предыдущей главы: статусы, context, таймауты, безопасность данных и HTTP-контракт всё равно остаются ответственностью разработчика.

```text
TaskService → PrioritySuggester → Resty → net/http → внешний API
```

Как и Gin, Resty должен оставаться на границе приложения. `TaskService` зависит от интерфейса `PrioritySuggester`, а не от Resty.

## Установка

В корне Task Manager API выполните:

```bash
go get github.com/go-resty/resty/v2
```

Импорт пакета:

```go
import "github.com/go-resty/resty/v2"
```

Go добавит прямую зависимость в `go.mod`, а Resty и требуемые ей модули — в `go.sum`. Не редактируйте их вручную. После добавления запустите:

```bash
go test ./...
```

## Сравнение с `http.Client`

В предыдущей главе базовый вызов выглядел так:

```go
request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
if err != nil {
	return PriorityHint{}, err
}
request.Header.Set("Accept", "application/json")

response, err := httpClient.Do(request)
if err != nil {
	return PriorityHint{}, err
}
defer response.Body.Close()

if response.StatusCode < 200 || response.StatusCode >= 300 {
	return PriorityHint{}, &HTTPStatusError{...}
}

var hint PriorityHint
if err := json.NewDecoder(response.Body).Decode(&hint); err != nil {
	return PriorityHint{}, err
}
```

Resty делает тот же запрос компактнее:

```go
var hint PriorityHint

response, err := client.R().
	SetContext(ctx).
	SetQueryParam("title", title).
	SetResult(&hint).
	Get("/v1/suggest")
if err != nil {
	return PriorityHint{}, err
}

if response.IsError() {
	return PriorityHint{}, &HTTPStatusError{
		StatusCode: response.StatusCode(),
		Status:     response.Status(),
	}
}
```

`SetResult` автоматически декодирует JSON или XML для успешного статуса `2xx`, если сервер указал подходящий `Content-Type`. Но Resty не выбирает за вас политику статусов, проверки значений или публичную обработку ошибок.

## Настройка Resty-клиента

Как и `http.Client`, экземпляр Resty создают один раз и передают как зависимость. Настройте base URL, общий timeout и заголовки в конструкторе:

```go
type Client struct {
	resty *resty.Client
}

func New(baseURL string, transport http.RoundTripper) *Client {
	client := resty.New().
		SetBaseURL(strings.TrimRight(baseURL, "/")).
		SetTimeout(3 * time.Second).
		SetHeader("Accept", "application/json").
		SetHeader("User-Agent", "task-manager-api/1.0")

	if transport != nil {
		client.SetTransport(transport)
	}

	return &Client{resty: client}
}
```

В production чаще достаточно `resty.New()` и настроек Resty. Если программе нужен специально настроенный транспорт (proxy, TLS, собственный `RoundTripper`), передайте его явно и проверьте контракт тестами. `httptest.Server` предоставляет совместимый транспорт как `server.Client().Transport`.

::: warning Не смешивайте ответственность клиентов
`resty.Client.SetTimeout` задаёт общий таймаут Resty. Не нужно одновременно создавать новый `http.Client` с другим timeout на каждый запрос. Для отдельной операции используйте `SetContext` с дочерним context и `defer cancel()`.
:::

## Query-параметры и заголовки

Resty сам кодирует query-параметры:

```go
response, err := client.R().
	SetContext(ctx).
	SetQueryParam("title", title).
	Get("/v1/suggest")
```

Для нескольких параметров используйте `SetQueryParams`:

```go
SetQueryParams(map[string]string{
	"title":  title,
	"locale": "ru-RU",
})
```

Общие заголовки задают в конструкторе. Заголовок конкретного запроса добавляют через `SetHeader`:

```go
response, err := client.R().
	SetContext(ctx).
	SetHeader("X-Request-ID", requestID).
	Get("/v1/suggest")
```

Токены и пароли берите из конфигурации. Никогда не логируйте `Authorization`, cookies и body запроса целиком.

## Context и отмена

Resty не заменяет `context.Context`. Передайте context у конкретного запроса:

```go
response, err := client.R().
	SetContext(ctx).
	SetQueryParam("title", title).
	Get("/v1/suggest")
```

В Gin handler исходный context приходит из `c.Request.Context()`. Service передаёт его в `PrioritySuggester`, а реализация Resty вызывает `SetContext(ctx)`. Так отмена клиента и дедлайн распространяются от HTTP handler к внешнему API.

```text
c.Request.Context() → TaskService → PrioritySuggester.Suggest → Request.SetContext
```

Не используйте `context.Background()` внутри метода `Suggest`: это оборвёт цепочку отмены.

## JSON request и response

Для `GET` подсказки нужен только query. Если внешний API принимает JSON, Resty сериализует структуру через `SetBody`:

```go
request := struct {
	Title string `json:"title"`
}{Title: "Купить молоко"}

response, err := client.R().
	SetContext(ctx).
	SetHeader("Content-Type", "application/json").
	SetBody(request).
	SetResult(&hint).
	Post("/v1/suggest")
```

Для текущего GET-запроса ответ декодируется через `SetResult`:

```go
var hint PriorityHint

response, err := client.R().
	SetContext(ctx).
	SetQueryParam("title", title).
	SetResult(&hint).
	Get("/v1/suggest")
```

Не декодируйте внешний ответ в `task.Task`. `PriorityHint` остаётся отдельным DTO, а service решает, как применить его к правилам создания задачи.

## Полная реализация `Suggest`

Сохраним контракт предыдущей главы: service получает `PriorityHint`, а не знает, какая библиотека выполняет запрос.

```go
type PriorityHint struct {
	Priority int    `json:"priority"`
	Source   string `json:"source"`
}

type HTTPStatusError struct {
	StatusCode int
	Status     string
}

func (err *HTTPStatusError) Error() string {
	return fmt.Sprintf("сервис приоритетов вернул %s", err.Status)
}

func (client *Client) Suggest(ctx context.Context, title string) (PriorityHint, error) {
	var hint PriorityHint

	response, err := client.resty.R().
		SetContext(ctx).
		SetQueryParam("title", title).
		SetResult(&hint).
		Get("/v1/suggest")
	if err != nil {
		return PriorityHint{}, fmt.Errorf("выполнить запрос подсказки: %w", err)
	}

	if response.IsError() {
		return PriorityHint{}, &HTTPStatusError{
			StatusCode: response.StatusCode(),
			Status:     response.Status(),
		}
	}
	if !response.IsSuccess() {
		return PriorityHint{}, &HTTPStatusError{
			StatusCode: response.StatusCode(),
			Status:     response.Status(),
		}
	}
	if hint.Priority < 1 || hint.Priority > 5 {
		return PriorityHint{}, fmt.Errorf("некорректный приоритет внешнего сервиса: %d", hint.Priority)
	}

	return hint, nil
}
```

`response.IsError()` покрывает ответы `400–599`. Дополнительная проверка `!response.IsSuccess()` защищает контракт «принимаем только 2xx»: например, `304 Not Modified` — не ошибка Resty, но не является JSON-подсказкой в нашем API.

Resty управляет response body внутри `Execute`, поэтому вручную писать `defer response.Body.Close()` здесь не нужно. Но это не отменяет правило из предыдущей главы: в чистом `net/http` body всегда закрывает вызывающий код.

## Строгость JSON и размер ответа

`SetResult` удобен, но его стандартная JSON-десериализация не заменяет полный контроль предыдущей главы. Если внешний контракт требует запрета неизвестных полей, строгой проверки одного JSON-значения или своего лимита body, оставьте реализацию на `net/http` либо настройте отдельную обработку и покройте её тестами.

Для простой, доверенной интеграции `SetResult` делает код короче. Для критичной границы — платежи, безопасность, нестабильный внешний контракт — предпочтительнее явно читать и ограничивать body, как в главе про `http.Client`.

## Ограниченный retry

Resty поддерживает retry с backoff. Это не повод повторять каждый запрос. В нашем случае допустим пример только для идемпотентного `GET`, когда сервер вернул временный `503 Service Unavailable`:

```go
client := resty.New().
	SetBaseURL(baseURL).
	SetRetryCount(2).
	SetRetryWaitTime(100 * time.Millisecond).
	SetRetryMaxWaitTime(500 * time.Millisecond).
	AddRetryCondition(func(response *resty.Response, err error) bool {
		return err == nil && response.StatusCode() == http.StatusServiceUnavailable
	})
```

Это означает максимум три попытки: первоначальная и две повторные. Resty применяет backoff с jitter между попытками.

Не применяйте такой retry автоматически к `POST /tasks`: повтор может создать дубликат. Для безопасных повторов нужны идемпотентность, контекст, ограничение попыток, политика статусов и наблюдаемость. В базовой реализации `Suggest` retry выключен; пример нужен, чтобы понимать настройку, а не включать её без причины.

## Hooks и структурированное логирование

Resty позволяет добавить hook после получения ответа:

```go
func addAccessLog(client *resty.Client, logger *slog.Logger) {
	client.OnAfterResponse(func(_ *resty.Client, response *resty.Response) error {
		logger.Info(
			"внешний HTTP-запрос завершён",
			"method", response.Request.Method,
			"url", response.Request.URL,
			"status", response.StatusCode(),
			"duration", response.Time(),
		)
		return nil
	})
}
```

Hook полезен для наблюдаемости, но не должен выводить `Authorization`, cookies или response body. Он также не заменяет обработку `err`: при сетевой ошибке response может отсутствовать, поэтому логирование таких случаев делают на границе вызова или через `OnError` с аккуратной фильтрацией данных.

## Тестирование через `httptest.Server`

Resty-клиент проверяют так же, как версию на `http.Client`: тестовый сервер проверяет исходный request и отдаёт контролируемый ответ.

```go
func TestSuggest(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Fatalf("method = %s, ожидался GET", r.Method)
		}
		if r.URL.Path != "/v1/suggest" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		if got := r.URL.Query().Get("title"); got != "Купить молоко" {
			t.Fatalf("title = %q", got)
		}

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"priority":3,"source":"title-rules"}`)
	}))
	defer server.Close()

	client := New(server.URL, server.Client().Transport)
	hint, err := client.Suggest(context.Background(), "Купить молоко")
	if err != nil {
		t.Fatalf("Suggest вернул ошибку: %v", err)
	}
	if hint != (PriorityHint{Priority: 3, Source: "title-rules"}) {
		t.Fatalf("hint = %+v", hint)
	}
}
```

Тесты также должны покрыть `429`, некорректный JSON и отменённый context. Для отмены отмените context до вызова — это детерминированно и не требует `time.Sleep`.

## Когда выбрать `http.Client`, а когда Resty

| Ситуация | Выбор |
| --- | --- |
| Небольшой клиент, нужен минимальный набор зависимостей и полный контроль body | `net/http` |
| Обычные JSON API, много одинаковых headers/query/response DTO | Resty |
| Строгий контроль лимитов, формата тела и потокового чтения | `net/http` |
| Нужны готовые retry hooks, base URL и компактный код | Resty с явной политикой retry |

В итоговом Task Manager можно оставить реализацию на `http.Client` или заменить её на Resty: interface `PrioritySuggester` и service при этом не меняются. В этом курсе финальную реализацию клиента подсказок строим на Resty, а фундаментальная глава про стандартный клиент остаётся обязательной.

## Частые ошибки

### Считать `response.IsError()` единственной проверкой

`IsError()` не считает `3xx` ошибкой. Если контракт принимает только JSON-ответы `2xx`, после неё обязательно проверяйте `response.IsSuccess()`.

### Включить retry для всех методов

```go
client.SetRetryCount(3).AddRetryAfterErrorCondition()
```

Такая глобальная настройка может повторить опасные `POST`, `PATCH` и `DELETE`. Ограничивайте retry по методу и статусу либо назначайте его точечно конкретному GET-запросу.

### Привязать service к Resty

```go
type TaskService struct {
	priorities *resty.Client
}
```

Service должен получать интерфейс `PrioritySuggester`; Resty — деталь реализации инфраструктурного пакета.

### Считать SetResult достаточной валидацией

JSON может быть синтаксически корректным, но содержать недопустимый priority. Всегда проверяйте данные внешнего сервиса по собственному контракту.

## Дальше

Task Manager использует Resty для компактной реализации внешнего HTTP-клиента, сохраняя правила HTTP и независимость service. Далее настроим конфигурацию и жизненный цикл приложения: переменные окружения, проверку настроек, graceful shutdown и health-check.

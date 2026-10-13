---
prev: /guide/gin/best-practices.md
next: /guide/http-client/tests.md
---

# HTTP-клиент: внешние API

## Цель урока

Научиться вызывать внешний HTTP API через стандартный `http.Client`: строить request с `context.Context`, передавать query-параметры и заголовки, корректно закрывать response body, проверять HTTP-статус, декодировать JSON и тестировать клиент без реальной сети.

Task Manager API уже принимает запросы как HTTP-сервер. Backend часто выступает и клиентом: запрашивает данные у сервиса уведомлений, платежей, геокодирования или другого внутреннего API. В этой главе Task Manager обращается к условному внешнему сервису, чтобы получить подсказку приоритета для новой задачи.

## `http.Client` и request

Быстрый вызов можно сделать через `http.Get`, но для backend-кода обычно нужен явный `http.Client` и request:

```go
client := &http.Client{
	Timeout: 3 * time.Second,
}

request, err := http.NewRequestWithContext(
	ctx,
	http.MethodGet,
	"https://priority.example.com/v1/suggest?title=Купить+молоко",
	nil,
)
if err != nil {
	return err
}

response, err := client.Do(request)
if err != nil {
	return err
}
defer response.Body.Close()
```

`http.Client` можно безопасно переиспользовать между запросами и goroutine. Создавайте его один раз при сборке приложения и передавайте как зависимость. Создание нового `http.Client` на каждый вызов мешает переиспользованию соединений.

`http.NewRequestWithContext` связывает запрос со стандартным `context.Context`. Если входящий запрос Task Manager отменён, внешний вызов тоже должен завершиться:

```go
hint, err := priorityClient.Suggest(c.Request.Context(), title)
```

Не создавайте внутри клиента новый `context.Background()`: так отмена и дедлайн потеряются.

## Таймаут клиента и дедлайн context

У HTTP-вызова может быть два ограничения по времени:

```go
client := &http.Client{Timeout: 3 * time.Second}

ctx, cancel := context.WithTimeout(parentCtx, 1*time.Second)
defer cancel()
```

- `ctx` задаёт дедлайн **конкретной операции** и наследует отмену родителя;
- `Client.Timeout` — предельное время всей HTTP-операции клиента: соединения, редиректы и чтения body.

В Task Manager передавайте входящий `r.Context()` и настройте общий ограниченный `Client.Timeout`. Если для конкретной зависимости нужен более короткий дедлайн, создайте дочерний context от полученного родителя. Всегда вызывайте `cancel`.

```go
ctx, cancel := context.WithTimeout(parentCtx, 800*time.Millisecond)
defer cancel()

hint, err := priorityClient.Suggest(ctx, title)
```

Таймаут — не замена отмене: он ограничивает время, но код всё равно должен возвращать ошибку вызывающему слою. Не подбирайте таймауты «на глаз» для тестов; тесты этой главы не ждут реальные секунды.

## Контракт внешнего сервиса

Пусть сервис подсказок поддерживает запрос:

```http
GET /v1/suggest?title=%D0%9A%D1%83%D0%BF%D0%B8%D1%82%D1%8C+%D0%BC%D0%BE%D0%BB%D0%BE%D0%BA%D0%BE HTTP/1.1
Accept: application/json
User-Agent: task-manager-api/1.0
```

И отвечает:

```json
{
  "priority": 3,
  "source": "title-rules"
}
```

Внешний контракт не принадлежит нашей модели `Task`, поэтому выделим отдельный тип:

```go
type PriorityHint struct {
	Priority int    `json:"priority"`
	Source   string `json:"source"`
}
```

Не декодируйте ответ внешнего API напрямую в `task.Task`: внешний сервис не должен иметь возможности задавать ID, completed или другие поля нашей предметной модели.

## Клиент как зависимость

Спрячем детали HTTP в пакете `internal/priorityclient`:

```go
type Client struct {
	baseURL    string
	httpClient *http.Client
}

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

`baseURL` и `httpClient` передаются снаружи: production использует адрес из конфигурации, а тест — адрес `httptest.Server`. Так тест не обращается к интернету.

## Безопасная сборка URL

Не добавляйте пользовательский текст к URL конкатенацией строк:

```go
// Плохо: пробелы, &, ? и кириллица могут сломать запрос.
// endpoint := baseURL + "/v1/suggest?title=" + title
```

Используйте `net/url`:

```go
endpoint, err := url.Parse(client.baseURL + "/v1/suggest")
if err != nil {
	return PriorityHint{}, fmt.Errorf("разобрать URL сервиса приоритетов: %w", err)
}

query := endpoint.Query()
query.Set("title", title)
endpoint.RawQuery = query.Encode()
```

`query.Encode()` экранирует специальные символы. Например, название `Позвонить маме & купить чай` будет передано одним параметром `title`, а не превратится в несколько query-параметров.

## Полная реализация `Suggest`

Опишем ошибку неуспешного HTTP-статуса отдельно. Вызывающий код может проверить её через `errors.As` и решить, стоит ли повторять запрос или вернуть пользователю другой ответ:

```go
type HTTPStatusError struct {
	StatusCode int
	Status     string
}

func (err *HTTPStatusError) Error() string {
	return fmt.Sprintf("сервис приоритетов вернул %s", err.Status)
}
```

Реализация клиента:

```go
const maxResponseBytes = 1 << 20 // 1 MiB

func (client *Client) Suggest(ctx context.Context, title string) (PriorityHint, error) {
	endpoint, err := url.Parse(client.baseURL + "/v1/suggest")
	if err != nil {
		return PriorityHint{}, fmt.Errorf("разобрать URL сервиса приоритетов: %w", err)
	}

	query := endpoint.Query()
	query.Set("title", title)
	endpoint.RawQuery = query.Encode()

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return PriorityHint{}, fmt.Errorf("создать запрос подсказки: %w", err)
	}
	request.Header.Set("Accept", "application/json")
	request.Header.Set("User-Agent", "task-manager-api/1.0")

	response, err := client.httpClient.Do(request)
	if err != nil {
		return PriorityHint{}, fmt.Errorf("выполнить запрос подсказки: %w", err)
	}
	defer response.Body.Close()

	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return PriorityHint{}, &HTTPStatusError{
			StatusCode: response.StatusCode,
			Status:     response.Status,
		}
	}

	var hint PriorityHint
	if err := json.NewDecoder(io.LimitReader(response.Body, maxResponseBytes)).Decode(&hint); err != nil {
		return PriorityHint{}, fmt.Errorf("прочитать JSON-подсказку: %w", err)
	}
	if hint.Priority < 1 || hint.Priority > 5 {
		return PriorityHint{}, fmt.Errorf("некорректный приоритет внешнего сервиса: %d", hint.Priority)
	}

	return hint, nil
}
```

Ключевой порядок действий:

1. `Do` вернул response — сразу планируем `defer response.Body.Close()`;
2. проверяем статус **до** разбора JSON успеха;
3. ограничиваем размер читаемого response body;
4. декодируем в отдельный внешний DTO;
5. проверяем данные внешней системы, даже если ответ имеет статус `2xx`.

`response.Body.Close()` важен даже при ошибочном статусе: он освобождает ресурс и позволяет клиенту переиспользовать соединения.

## Проверка статусов и ошибки сети

HTTP-клиент не считает `404`, `429` или `500` ошибкой транспорта: в этих случаях `client.Do` обычно вернёт `response` и `nil` error. Поэтому статус нужно проверять самостоятельно.

```go
if response.StatusCode < 200 || response.StatusCode >= 300 {
	return PriorityHint{}, &HTTPStatusError{...}
}
```

Транспортная ошибка — это, например, отмена context, проблема DNS или недоступное соединение. Она приходит из `Do`:

```go
response, err := client.httpClient.Do(request)
if err != nil {
	if errors.Is(err, context.Canceled) {
		return PriorityHint{}, err
	}

	return PriorityHint{}, fmt.Errorf("выполнить запрос подсказки: %w", err)
}
```

На границе HTTP handler не превращайте все ошибки клиента во внутренний `500` автоматически. Например, отменённый клиентский запрос обычно уже не ждёт ответ; ограничение внешнего сервиса может требовать понятной политики. В этой главе client только возвращает причины, а решение о публичном HTTP-статусе остаётся за service или handler.

## Заголовки

Заголовки передают метаданные запроса:

```go
request.Header.Set("Accept", "application/json")
request.Header.Set("Authorization", "Bearer "+token)
request.Header.Set("X-Request-ID", requestID)
```

- `Accept` сообщает ожидаемый формат ответа;
- `Authorization` используют только при необходимости и получают token из конфигурации, а не из исходного кода;
- `X-Request-ID` связывает логи нескольких сервисов.

Не записывайте `Authorization`, cookies и полный body в логи. Если копируете входящий request ID во внешний запрос, сначала извлеките и проверьте его по правилам middleware из предыдущей главы.

## Где вызывать внешний клиент

HTTP handler не должен сам знать URL внешнего сервиса. Пусть service получает интерфейс:

```go
type PrioritySuggester interface {
	Suggest(ctx context.Context, title string) (priorityclient.PriorityHint, error)
}

type TaskService struct {
	store     TaskRepository
	priorities PrioritySuggester
}
```

При создании задачи service может применить подсказку, если пользователь не выбрал приоритет сам. Политику нужно определить явно: внешний сервис недоступен — создание задачи завершается ошибкой или используется приоритет по умолчанию? Для первого учебного API выберите один вариант и закрепите его тестом. Не скрывайте ошибку молча.

## Тестирование через `httptest.Server`

`httptest.Server` запускает настоящий HTTP-сервер только внутри теста и автоматически предоставляет адрес. Снаружи сеть не используется:

```go
func TestSuggest(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Fatalf("method = %s, ожидался GET", r.Method)
		}
		if got := r.URL.Query().Get("title"); got != "Купить молоко" {
			t.Fatalf("title = %q", got)
		}
		if got := r.Header.Get("Accept"); got != "application/json" {
			t.Fatalf("Accept = %q", got)
		}

		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"priority":3,"source":"title-rules"}`)
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	hint, err := client.Suggest(context.Background(), "Купить молоко")
	if err != nil {
		t.Fatalf("Suggest вернул ошибку: %v", err)
	}
	if hint != (PriorityHint{Priority: 3, Source: "title-rules"}) {
		t.Fatalf("hint = %+v", hint)
	}
}
```

Проверяйте контракт исходящего запроса: метод, путь, query и существенные заголовки. Затем проверяйте, как клиент обработал ответ.

### Неуспешный статус

```go
func TestSuggestStatusError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
	}))
	defer server.Close()

	client := New(server.URL, server.Client())
	_, err := client.Suggest(context.Background(), "Купить молоко")

	var statusError *HTTPStatusError
	if !errors.As(err, &statusError) {
		t.Fatalf("error = %v, ожидалась HTTPStatusError", err)
	}
	if statusError.StatusCode != http.StatusTooManyRequests {
		t.Fatalf("status = %d", statusError.StatusCode)
	}
}
```

### Отмена без `time.Sleep`

Чтобы детерминированно проверить связь request и context, отмените context **до** вызова. Клиент не должен пытаться ждать ответ:

```go
func TestSuggestCanceled(t *testing.T) {
	server := httptest.NewServer(http.NotFoundHandler())
	defer server.Close()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	client := New(server.URL, server.Client())
	_, err := client.Suggest(ctx, "Купить молоко")
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("error = %v, ожидалась context.Canceled", err)
	}
}
```

Тест не использует настоящую задержку и не зависит от доступности публичного сервиса.

## Повторы запросов

Не добавляйте автоматические retry «на всякий случай». Повтор может создать дубликат для `POST`, усилить нагрузку на недоступный сервис и ухудшить ситуацию при `429`.

Для идемпотентного `GET` повтор иногда оправдан после временной сетевой ошибки, но только с ограничением числа попыток, backoff, учётом context и понятной политикой. Эти сценарии относятся к более продвинутой production-надёжности; базовый клиент этой главы делает одну прозрачную попытку.

## Частые ошибки

### Не закрывать response body

```go
response, err := client.Do(request)
if err != nil {
	return err
}

// Пропущен response.Body.Close().
```

Это может истощить ресурсы и лишить клиента переиспользования соединений. Сразу после успешного `Do` пишите `defer response.Body.Close()`.

### Декодировать ошибочный ответ как успешный JSON

```go
json.NewDecoder(response.Body).Decode(&hint)
```

Сначала проверяйте статус. Сервер может прислать JSON другого формата, HTML или пустое тело с `404` и `500`.

### Создать новый context внутри клиента

```go
request, _ := http.NewRequestWithContext(context.Background(), ...)
```

Так отмена исходной операции не дойдёт до внешнего запроса. Получайте `ctx` параметром.

### Тестировать публичный сервис

Публичный сервис может быть недоступен, изменить контракт или ограничить число запросов. Для unit-тестов используйте `httptest.Server`; реальную интеграцию проверяйте отдельно и осознанно.

## Дальше

Task Manager умеет безопасно вызывать внешние API. Далее настроим конфигурацию и жизненный цикл приложения: переменные окружения, проверку настроек, graceful shutdown и health-check.

---
prev: /guide/http-server/best-practices.md
next: /guide/gin/tests.md
---

# HTTP API на Gin

## Цель урока

Перенести HTTP-слой Task Manager API со стандартного `net/http` на Gin, не изменяя service и repository. Научиться регистрировать маршруты, извлекать параметры, читать JSON, писать middleware для request ID и структурированного access log, восстанавливаться после panic и тестировать Gin handlers через `httptest`.

Gin — популярный HTTP-фреймворк Go. Он работает поверх стандартных типов `net/http`: сервер всё так же получает HTTP-запрос и отправляет HTTP-ответ. Gin добавляет более компактную маршрутизацию, `gin.Context`, binding JSON и удобный механизм middleware.

В предыдущей главе API работал через `http.ServeMux`. Теперь заменим **только transport-слой**:

```text
было:  net/http handler → service → repository / TaskStore
стало: Gin handler      → service → repository / TaskStore
```

`TaskService`, правила создания задач, ошибки Store и способ хранения задач не должны меняться. Это главный результат разделения слоёв.

## Установка Gin

В корне Task Manager API добавьте зависимость:

```bash
go get github.com/gin-gonic/gin
```

Go добавит Gin и его версии зависимостей в `go.mod` и `go.sum`. Не редактируйте эти файлы вручную. Проверить сборку можно так:

```bash
go test ./...
```

## Первый router

Вместо `http.NewServeMux` создайте `gin.Engine`:

```go
func (api *API) Router() *gin.Engine {
	router := gin.New()

	router.GET("/healthz", api.health)
	router.GET("/tasks", api.listTasks)
	router.POST("/tasks", api.createTask)
	router.POST("/tasks/:id/complete", api.completeTask)

	return router
}
```

`gin.Default()` автоматически добавляет встроенные middleware `gin.Logger()` и `gin.Recovery()`. В этой главе используем `gin.New()`, чтобы явно подключить middleware и писать access log через уже знакомый `log/slog`.

Сравнение маршрута:

| `net/http` | Gin |
| --- | --- |
| `mux.HandleFunc("GET /tasks", api.listTasks)` | `router.GET("/tasks", api.listTasks)` |
| `mux.HandleFunc("POST /tasks/{id}/complete", api.completeTask)` | `router.POST("/tasks/:id/complete", api.completeTask)` |
| `r.PathValue("id")` | `c.Param("id")` |

В Gin path-параметр записывают как `:id`, а не `{id}`.

## `gin.Context` и `context.Context`

Handler Gin получает `*gin.Context`:

```go
func (api *API) listTasks(c *gin.Context) {
	// ...
}
```

`*gin.Context` — объект Gin для текущего HTTP-обмена. Через него получают параметры, query, body и формируют ответ. Это **не** тот же тип, что стандартный `context.Context`.

Для service всё ещё нужен стандартный context из исходного HTTP-запроса:

```go
tasks, err := api.service.List(c.Request.Context())
```

Не передавайте `*gin.Context` в service, repository или `database/sql`. Это привяжет бизнес-логику к Gin и усложнит тестирование или будущую замену фреймворка.

## JSON-ответы

В `net/http` мы устанавливали заголовок, статус и вызывали `json.NewEncoder`. В Gin эту работу делает `c.JSON`:

```go
func (api *API) health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

type errorResponse struct {
	Error string `json:"error"`
}

func writeError(c *gin.Context, status int, message string) {
	c.JSON(status, errorResponse{Error: message})
}
```

Gin устанавливает JSON `Content-Type` и сериализует значение. `gin.H` — короткая запись для `map[string]any`; для стабильного публичного контракта ошибок лучше оставить отдельную структуру `errorResponse`.

## Группы маршрутов

Когда API разрастётся, маршруты удобно объединить общим префиксом:

```go
func (api *API) Router() *gin.Engine {
	router := gin.New()

	router.GET("/healthz", api.health)

	v1 := router.Group("/api/v1")
	v1.GET("/version", api.version)

	return router
}
```

Группа не создаёт новый сервер: она только добавляет общий путь и позволяет назначить middleware всем маршрутам внутри неё. Она пригодится, если позже появится версионирование, например `/api/v1`. При миграции в этой главе сохраняем публичные URL версии на `net/http`: цель — сравнить Gin со стандартной библиотекой, а не одновременно изменить контракт для клиентов.

Контракт маршрутов после миграции:

| Метод и путь | Ответ при успехе |
| --- | --- |
| `GET /healthz` | `200 OK` и `{"status":"ok"}` |
| `GET /tasks` | `200 OK` и массив задач |
| `POST /tasks` | `201 Created` и новая задача |
| `POST /tasks/:id/complete` | `200 OK` и выполненная задача |

## Входной JSON и сохранение контракта

`ShouldBindJSON` удобно для простых form и JSON-запросов, но в предыдущей главе API уже зафиксировал более строгий контракт: body не больше 1 MiB, неизвестные поля запрещены, а после одного JSON-объекта не должно быть другого значения. Сохраним эти правила в небольшом helper на стандартном `json.Decoder`:

```go
type createTaskRequest struct {
	Title    string `json:"title"`
	Priority int    `json:"priority"`
}

const maxRequestBodyBytes = 1 << 20 // 1 MiB

func decodeJSON(c *gin.Context, dst any) error {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxRequestBodyBytes)

	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(dst); err != nil {
		return err
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("в body должен быть один JSON-объект")
	}

	return nil
}
```

Helper использует `http.MaxBytesReader`, поэтому превышение лимита завершается ошибкой, а не чтением всего запроса в память. `DisallowUnknownFields` отклоняет опечатки наподобие `priorty`, а второй `Decode` гарантирует, что body содержит ровно один JSON-объект. Для этого фрагмента нужны импорты `encoding/json`, `errors` и `io`.

Handler создания задачи:

```go
func (api *API) createTask(c *gin.Context) {
	var request createTaskRequest
	if err := decodeJSON(c, &request); err != nil {
		writeError(c, http.StatusBadRequest, "некорректные данные задачи")
		return
	}

	request.Title = strings.TrimSpace(request.Title)
	if request.Title == "" {
		writeError(c, http.StatusBadRequest, "название задачи обязательно")
		return
	}
	if request.Priority < 1 || request.Priority > 5 {
		writeError(c, http.StatusBadRequest, "приоритет должен быть от 1 до 5")
		return
	}

	createdTask, err := api.service.Create(c.Request.Context(), task.CreateInput{
		Title:    request.Title,
		Priority: request.Priority,
	})
	if err != nil {
		api.logger.Error("не удалось создать задачу", "err", err)
		writeError(c, http.StatusInternalServerError, "внутренняя ошибка сервера")
		return
	}

	api.logger.Info("задача создана", "task_id", createdTask.ID)
	c.JSON(http.StatusCreated, createdTask)
}
```

Передавать `id` и `completed` по-прежнему нельзя: `createTaskRequest` содержит только разрешённые поля. Валидация title и priority остаётся в handler, а service повторяет бизнес-инварианты для других входов помимо HTTP.

## Параметры, статусы и доменные ошибки

Извлечём `id`, завершим задачу и сохраним прежний HTTP-контракт:

```go
func (api *API) completeTask(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id < 1 {
		writeError(c, http.StatusBadRequest, "идентификатор задачи должен быть положительным числом")
		return
	}

	completedTask, err := api.service.Complete(c.Request.Context(), id)
	if errors.Is(err, store.ErrTaskNotFound) {
		writeError(c, http.StatusNotFound, "задача не найдена")
		return
	}
	if err != nil {
		api.logger.Error("не удалось завершить задачу", "task_id", id, "err", err)
		writeError(c, http.StatusInternalServerError, "внутренняя ошибка сервера")
		return
	}

	c.JSON(http.StatusOK, completedTask)
}
```

Gin делает извлечение маршрута короче, но ответственность не меняется: handler проверяет форму входа и переводит известные ошибки домена в HTTP-статусы; service хранит бизнес-логику.

## Middleware: общая обвязка запроса

Middleware получает `*gin.Context`, выполняется до и/или после handler и вызывает `c.Next()`, чтобы передать управление дальше:

```go
func exampleMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// До handler.
		c.Next()
		// После handler.
	}
}
```

Порядок `router.Use` важен. Middleware, зарегистрированный раньше, начинает выполняться раньше и завершает часть «после handler» позже — как вложенные `defer`.

### Request ID

Каждому запросу полезен идентификатор: по нему можно связать access log, application log и сообщение об ошибке. Клиент может прислать `X-Request-ID`; если заголовка нет, сервер генерирует случайное значение.

```go
const (
	requestIDKey       = "request_id"
	maxRequestIDLength = 128
)
```

Чтобы не вводить дополнительную зависимость только ради ID, используем стандартные `crypto/rand` и `encoding/hex`:

```go
func newRequestID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes), nil
}
```

Полный middleware должен обработать редкую ошибку генератора и не продолжать запрос без ID:

```go
func requestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader("X-Request-ID")
		if len(id) > maxRequestIDLength {
			writeError(c, http.StatusBadRequest, "слишком длинный X-Request-ID")
			c.Abort()
			return
		}
		if id == "" {
			var err error
			id, err = newRequestID()
			if err != nil {
				writeError(c, http.StatusInternalServerError, "не удалось подготовить запрос")
				c.Abort()
				return
			}
		}

		c.Set(requestIDKey, id)
		c.Header("X-Request-ID", id)
		c.Next()
	}
}
```

`c.Abort()` останавливает оставшиеся handlers текущей цепочки. Не вызывайте `c.Next()` после него. Ограничение длины не позволяет передать в логи произвольно большой заголовок от клиента.

### Структурированный access log

Используем `slog`, чтобы access log был пригоден для поиска и машинной обработки:

```go
func accessLog(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		startedAt := time.Now()
		c.Next()

		requestID, _ := c.Get(requestIDKey)
		logger.Info(
			"HTTP-запрос завершён",
			"request_id", requestID,
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"duration", time.Since(startedAt),
		)
	}
}
```

Лог пишется после `c.Next()`, поэтому в него попадает итоговый статус. Значение из `c.Get` имеет тип `any`: middleware не должен паниковать, если ID отсутствует по ошибке конфигурации. В production можно дополнить запись размером ответа и IP клиента, но не логируйте тело запроса с паролями, токенами или персональными данными.

### Recovery

Panic не должен завершать весь HTTP-сервер. Gin содержит `gin.Recovery()` — middleware, который перехватывает panic, пишет её в `stderr` и отвечает `500`:

```go
router.Use(gin.Recovery())
```

В production чаще нужен структурированный лог panic. Тогда можно применить `gin.CustomRecovery`:

```go
func recovery(logger *slog.Logger) gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		logger.Error("panic в HTTP handler", "recovered", recovered)
		c.AbortWithStatusJSON(http.StatusInternalServerError, errorResponse{
			Error: "внутренняя ошибка сервера",
		})
	})
}
```

Не используйте recovery для ожидаемых ошибок валидации или доступа к данным. Он нужен как последняя защита от ошибок программирования; причину panic всё равно нужно исправить и закрепить тестом.

## Собираем router

Создадим middleware один раз при построении router:

```go
func (api *API) Router() *gin.Engine {
	router := gin.New()
	router.Use(requestID())
	router.Use(accessLog(api.logger))
	router.Use(recovery(api.logger))

	router.GET("/healthz", api.health)

	router.GET("/tasks", api.listTasks)
	router.POST("/tasks", api.createTask)
	router.POST("/tasks/:id/complete", api.completeTask)

	return router
}
```

Порядок выбран осознанно:

1. `requestID` добавляет ID в context и response header;
2. `accessLog` измеряет всю последующую обработку и видит итоговый статус;
3. `recovery` преобразует panic в ответ `500`;
4. handler выполняет бизнес-сценарий.

## Запуск приложения

`*gin.Engine` реализует `http.Handler`, поэтому сборка `http.Server` почти не меняется:

```go
server := &http.Server{
	Addr:              ":8080",
	Handler:           api.Router(),
	ReadHeaderTimeout: 5 * time.Second,
}

if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
	logger.Error("HTTP-сервер завершился с ошибкой", "err", err)
}
```

Не используйте `router.Run()` в финальном `main`: он создаёт сервер сам и не даёт централизованно задать `http.Server`. Таймауты и graceful shutdown добавим в следующей главе о жизненном цикле.

## Тестирование Gin handler

Gin также совместим с `httptest`: запуска сервера и реального порта не требуется. В тестах установите release mode, чтобы не видеть debug output Gin:

```go
func TestCreateTask(t *testing.T) {
	gin.SetMode(gin.TestMode)

	service := &fakeTaskService{
		createdTask: task.Task{ID: 1, Title: "Купить молоко", Priority: 2},
	}
	api := New(service, newTestLogger())

	request := httptest.NewRequest(
		http.MethodPost,
		"/tasks",
		strings.NewReader(`{"title":"Купить молоко","priority":2}`),
	)
	request.Header.Set("X-Request-ID", "test-request-1")
	recorder := httptest.NewRecorder()

	api.Router().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("status = %d, ожидался %d", recorder.Code, http.StatusCreated)
	}
	if got := recorder.Header().Get("X-Request-ID"); got != "test-request-1" {
		t.Fatalf("X-Request-ID = %q", got)
	}

	var got task.Task
	if err := json.NewDecoder(recorder.Body).Decode(&got); err != nil {
		t.Fatalf("не удалось прочитать JSON-ответ: %v", err)
	}
	if got != service.createdTask {
		t.Fatalf("ответ = %+v, ожидалось %+v", got, service.createdTask)
	}
}
```

Тест проверяет тот же HTTP-контракт, что и версия на `net/http`, а также поведение middleware. Fake service остаётся прежним: Gin не проник в бизнес-логику.

## Сравнение с `net/http`

| Задача | `net/http` | Gin |
| --- | --- | --- |
| Router | `http.NewServeMux()` | `gin.New()` |
| Маршрут | `"POST /tasks/{id}/complete"` | `POST("/tasks/:id/complete", ...)` |
| Параметр пути | `r.PathValue("id")` | `c.Param("id")` |
| JSON-ответ | helper + `json.Encoder` | `c.JSON(status, value)` |
| JSON-body | `json.Decoder` + ручная проверка | `c.ShouldBindJSON(&request)` + теги |
| Middleware | собственная обёртка `http.Handler` | `router.Use(...)` |
| Тест | `httptest` | тот же `httptest` |

Gin уменьшает объём транспортного кода, но не отменяет HTTP: по-прежнему нужно выбирать статусы, валидировать вход, передавать context и не раскрывать внутренние ошибки.

## Частые ошибки

### Передавать `*gin.Context` в service

```go
// Плохо: service теперь зависит от Gin.
api.service.Create(c, input)
```

Передавайте `c.Request.Context()`.

### Использовать `gin.Default()` вместе со своими logger и recovery

```go
router := gin.Default()
router.Use(accessLog(logger), recovery(logger))
```

Так будут два logger и два recovery middleware. Выберите `gin.Default()` с настройками по умолчанию **или** `gin.New()` с явной цепочкой. В этом проекте используется второй вариант.

### Отдавать panic клиенту

Не записывайте `fmt.Sprint(recovered)` в JSON. Логируйте подробность на сервере и возвращайте клиенту нейтральный `500`.

### Пропустить строгую проверку JSON

Если API ранее отвергал неизвестные поля, включите `gin.EnableJsonDecoderDisallowUnknownFields()` и добавьте тест. Иначе опечатка клиента может стать тихой ошибкой.

## Дальше

HTTP-слой Task Manager API теперь основан на Gin. В следующей главе изучим стандартный `http.Client` и научимся безопасно вызывать внешние HTTP API с context, таймаутами и проверкой статусов.

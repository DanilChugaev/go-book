---
prev: /guide/gin/tests.md
next: /guide/gin/best-practices.md
---

# Задания: миграция Task Manager API на Gin

Перенесите HTTP-слой из предыдущей главы на Gin. `TaskService`, TaskStore и правила работы с задачами не меняйте: новая глава должна заменить только router, handlers и общую HTTP-обвязку.

## Задание 1. Подключите Gin и перенесите health-check

Установите Gin, создайте `gin.New()` и перенесите `GET /healthz`. Ответ должен остаться прежним: JSON `{"status":"ok"}` со статусом `200`.

**Критерии проверки:**

- Gin добавлен через `go get github.com/gin-gonic/gin`;
- router создаётся через `gin.New()`;
- маршрут регистрируется методом `router.GET`;
- handler получает `*gin.Context`;
- ответ формируется через `c.JSON`;
- `TaskService` для health-check не вызывается.

<details>
  <summary>Подсказка</summary>

```go
func (api *API) health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
```
</details>

<details>
  <summary>Решение</summary>

```go
func (api *API) Router() *gin.Engine {
	router := gin.New()
	router.GET("/healthz", api.health)
	return router
}
```
</details>

## Задание 2. Перенесите маршруты задач без изменения URL

Перенесите `GET /tasks`, `POST /tasks` и `POST /tasks/:id/complete`, сохранив URL из версии на `net/http`. Во всех вызовах service передавайте `c.Request.Context()`. Для знакомства с группами отдельно создайте `router.Group("/api/v1")` и добавьте в него будущий маршрут-заглушку, например `GET /version`.

**Критерии проверки:**

- health-check остаётся вне группы;
- задачи остаются доступны по `/tasks`;
- ID в маршруте записан как `:id`;
- HTTP handler не получает прямой доступ к TaskStore;
- в service передаётся стандартный context запроса;
- service и repository не импортируют Gin.

<details>
  <summary>Подсказка</summary>

```go
v1 := router.Group("/api/v1")
v1.GET("/version", func(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"version": "v1"})
})
```
</details>

## Задание 3. Перенесите создание задачи на binding

Перепишите `POST /tasks` через `ShouldBindJSON`. Добавьте теги `binding` для обязательного названия и приоритета от 1 до 5, затем отдельно удалите внешние пробелы у названия.

**Критерии проверки:**

- используется `ShouldBindJSON`, а не `BindJSON`;
- структура запроса содержит `json` и `binding` теги;
- пустое или состоящее из пробелов название даёт `400`;
- `priority` вне диапазона 1–5 даёт `400`;
- успешный ответ имеет статус `201`;
- `id` и `completed` не принимаются из входного JSON.

<details>
  <summary>Подсказка</summary>

```go
type createTaskRequest struct {
	Title    string `json:"title" binding:"required"`
	Priority int    `json:"priority" binding:"required,gte=1,lte=5"`
}
```
</details>

<details>
  <summary>Фрагмент решения</summary>

```go
var request createTaskRequest
if err := c.ShouldBindJSON(&request); err != nil {
	writeError(c, http.StatusBadRequest, "некорректные данные задачи")
	return
}

request.Title = strings.TrimSpace(request.Title)
if request.Title == "" {
	writeError(c, http.StatusBadRequest, "название задачи обязательно")
	return
}
```
</details>

## Задание 4. Добавьте middleware

Подключите middleware в порядке `requestID`, `accessLog`, `recovery`. Request ID берите из `X-Request-ID` либо генерируйте 16 криптографически случайных байт через `crypto/rand`, кодируйте их в hex и возвращайте в response header. Access log должен содержать ID, метод, путь, статус и длительность. Recovery должен вернуть безопасный JSON `500`.

**Критерии проверки:**

- используется `gin.New()`, а не `gin.Default()`;
- request ID записывается в `c.Set` и `X-Request-ID`;
- middleware вызывает `c.Next()` только при успешном продолжении;
- access log создаётся после `c.Next()`;
- access log использует `slog.Logger`;
- panic не завершает процесс и не раскрывается клиенту;
- recovery завершает цепочку через `AbortWithStatusJSON`;
- порядок middleware соответствует заданию.

<details>
  <summary>Подсказка</summary>

```go
router.Use(requestID())
router.Use(accessLog(api.logger))
router.Use(recovery(api.logger))
```
</details>

<details>
  <summary>Фрагмент решения</summary>

```go
func accessLog(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		startedAt := time.Now()
		c.Next()

		requestID, _ := c.Get(requestIDKey)
		logger.Info("HTTP-запрос завершён",
			"request_id", requestID,
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"duration", time.Since(startedAt),
		)
	}
}
```
</details>

## Задание 5. Сохраните строгую проверку JSON

Включите `gin.EnableJsonDecoderDisallowUnknownFields()` при запуске приложения. Добавьте тест: запрос на создание задачи с опечаткой `priorty` должен вернуть `400`, а service не должен быть вызван.

**Критерии проверки:**

- глобальная настройка Gin включается один раз;
- запрос с неизвестным полем возвращает `400`;
- fake service не получил `Create`;
- тест не зависит от сети, задержек или порядка запуска;
- после настройки успешный корректный JSON продолжает обрабатываться.

<details>
  <summary>Подсказка</summary>

```go
gin.EnableJsonDecoderDisallowUnknownFields()
```
</details>

## Задание 6. Протестируйте маршрут и middleware

Через `httptest` проверьте успешный `POST /tasks`, передав `X-Request-ID: test-request-1`. Убедитесь, что ответ содержит `201`, JSON созданной задачи и тот же `X-Request-ID`. Затем проверьте handler с panic: response должен быть `500` с безопасным JSON.

**Критерии проверки:**

- перед тестами используется `gin.SetMode(gin.TestMode)`;
- сервер не запускается через `Run` или `ListenAndServe`;
- проверяются статус, JSON и request ID header;
- panic не попадает в response;
- logger пишет в `io.Discard`;
- `go test ./...` и `go test -race ./...` проходят.

<details>
  <summary>Подсказка</summary>

```go
request := httptest.NewRequest(http.MethodPost, "/tasks", body)
request.Header.Set("X-Request-ID", "test-request-1")
recorder := httptest.NewRecorder()

api.Router().ServeHTTP(recorder, request)
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- объяснить разницу между `*gin.Context` и `context.Context`;
- перенести маршруты `net/http` на Gin без изменения service;
- связать JSON с request DTO и проверить его;
- построить middleware для request ID, access log и recovery;
- проверить Gin router и middleware через `httptest`.

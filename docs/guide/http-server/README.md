---
prev: /guide/logging-and-debugging/best-practices.md
next: /guide/http-server/tests.md
---

# HTTP-сервер и JSON API

## Цель урока

Научиться создать первую HTTP-версию Task Manager API средствами стандартного пакета `net/http`: принять запрос, выбрать маршрут, проверить входной JSON, вызвать бизнес-логику, вернуть JSON-ответ и протестировать handler без запуска настоящего сервера.

В этой главе HTTP-слой намеренно строится без фреймворка. Так будет видно, из каких частей состоит API и что именно позже упростит Gin. Бизнес-логика задач не должна зависеть от конкретного способа доставки запроса: сегодня её вызывает HTTP handler, завтра — CLI или другой transport.

::: tip Требуется Go 1.22 или новее
Новые шаблоны маршрутов `ServeMux`, например `GET /tasks/{id}`, и `r.PathValue("id")` появились в Go 1.22. Проверьте установленную версию:

```bash
go version
```
:::

## Что происходит при HTTP-запросе

Клиент отправляет request, а сервер формирует response:

```text
клиент → HTTP request → ServeMux → handler → service → HTTP response → клиент
```

Request содержит метод, путь, заголовки и иногда тело. Response содержит статус, заголовки и тело.

```http
POST /tasks HTTP/1.1
Content-Type: application/json

{"title":"Купить молоко","priority":2}
```

Успешный ответ на создание задачи:

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"id":1,"title":"Купить молоко","priority":2,"completed":false}
```

## `net/http` и handler

HTTP handler — это код, который получает `http.ResponseWriter` и `*http.Request`:

```go
func health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}
```

- `r` содержит данные запроса: метод, URL, заголовки, body и `Context()`;
- `w` формирует ответ: заголовки, статус и body.

Метод `w.Write` неявно отправляет статус `200 OK`, если статус ещё не был записан. Обычно API удобнее создавать через `json.Encoder`, но порядок остаётся важным: сначала заголовки, затем `WriteHeader`, затем body.

## Запуск минимального сервера

```go
package main

import (
	"log"
	"net/http"
)

func health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", health)

	log.Println("сервер слушает http://localhost:8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}
```

Запустите сервер:

```bash
go run .
```

В другом терминале выполните:

```bash
curl -i http://localhost:8080/healthz
```

`http.NewServeMux` сопоставляет запрос с маршрутом. Шаблон `GET /healthz` задаёт **и метод, и путь**. Если зарегистрирован только этот шаблон, `POST /healthz` не попадёт в handler.

Для учебного сервера подойдёт `http.ListenAndServe`. В главе о конфигурации и жизненном цикле заменим его на `http.Server`, добавим таймауты и graceful shutdown.

## Маршруты Task Manager API

Сделаем небольшой контракт первой версии API:

| Метод и путь | Назначение | Успешный статус |
| --- | --- | --- |
| `GET /healthz` | Проверить, что приложение отвечает | `200 OK` |
| `GET /tasks` | Получить список задач | `200 OK` |
| `POST /tasks` | Создать задачу | `201 Created` |
| `POST /tasks/{id}/complete` | Отметить задачу выполненной | `200 OK` |

Регистрация маршрутов остаётся в одном месте:

```go
func (api *API) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", api.health)
	mux.HandleFunc("GET /tasks", api.listTasks)
	mux.HandleFunc("POST /tasks", api.createTask)
	mux.HandleFunc("POST /tasks/{id}/complete", api.completeTask)
	return mux
}
```

`{id}` — path-параметр. Извлечь его можно через `r.PathValue`:

```go
id, err := strconv.Atoi(r.PathValue("id"))
if err != nil || id < 1 {
	writeError(w, http.StatusBadRequest, "идентификатор задачи должен быть положительным числом")
	return
}
```

Не доверяйте параметрам URL: строка `abc`, `0` и `-1` не должны попадать в сервис как корректный ID.

## Слои приложения

HTTP handler отвечает только за HTTP: чтение запроса, валидацию формы данных, выбор статуса и кодирование ответа. Правила предметной области и работа с хранилищем остаются ниже:

```text
HTTP handler → service → repository / TaskStore
```

Для связи handler с приложением опишем небольшой интерфейс. Он зависит от потребностей handler, а не от конкретной реализации Store:

```go
type TaskService interface {
	List(ctx context.Context) ([]task.Task, error)
	Create(ctx context.Context, input task.CreateInput) (task.Task, error)
	Complete(ctx context.Context, id int) (task.Task, error)
}

type API struct {
	service TaskService
	logger  *slog.Logger
}

func New(service TaskService, logger *slog.Logger) *API {
	if logger == nil {
		logger = slog.Default()
	}

	return &API{service: service, logger: logger}
}
```

Здесь `task.CreateInput` — отдельный тип входных данных для бизнес-логики:

```go
type CreateInput struct {
	Title    string
	Priority int
}
```

Так HTTP-пакет не зависит от map, mutex или будущего PostgreSQL-репозитория. В тестах вместо настоящего сервиса можно передать маленький fake.

В текущей учебной реализации `TaskStore.Complete` уже возвращает `store.ErrTaskNotFound`. Когда сервис передаёт эту известную причину выше, HTTP-слой может преобразовать её в `404`. При появлении PostgreSQL service сохранит тот же внешний контракт и сам сопоставит ошибку репозитория с `store.ErrTaskNotFound` или отдельной доменной ошибкой.

## JSON-ответы

Повторяющийся код JSON-ответа вынесем в helper:

```go
func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(value); err != nil {
		// После WriteHeader нельзя безопасно изменить уже отправленный ответ.
		return
	}
}

type errorResponse struct {
	Error string `json:"error"`
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, errorResponse{Error: message})
}
```

`json.Encoder.Encode` добавляет перевод строки в конец JSON — это нормально. `Content-Type` нужно установить **до** `WriteHeader`: после отправки заголовков изменить их уже нельзя.

Список задач возвращается очень коротко:

```go
func (api *API) listTasks(w http.ResponseWriter, r *http.Request) {
	tasks, err := api.service.List(r.Context())
	if err != nil {
		api.logger.Error("не удалось получить задачи", "err", err)
		writeError(w, http.StatusInternalServerError, "внутренняя ошибка сервера")
		return
	}

	writeJSON(w, http.StatusOK, tasks)
}
```

`r.Context()` связан с жизненным циклом запроса. Передавайте его дальше в service, репозиторий и внешние вызовы, чтобы отмена клиента или будущий серверный дедлайн могли остановить ненужную работу.

## Чтение и проверка JSON-запроса

Для создания задачи определим HTTP-представление тела:

```go
type createTaskRequest struct {
	Title    string `json:"title"`
	Priority int    `json:"priority"`
}
```

Это не обязательно та же структура, что `task.Task`. Клиент не должен передавать `id` и `completed`: ID выдаёт приложение, а выполнение меняется отдельной операцией.

Создадим helper, который ограничивает размер body, запрещает неизвестные поля и принимает ровно одно JSON-значение:

```go
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // не больше 1 MiB

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "некорректный JSON-запрос")
		return false
	}

	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		writeError(w, http.StatusBadRequest, "в body должен быть один JSON-объект")
		return false
	}

	return true
}
```

`DisallowUnknownFields` защитит от опечатки клиента: поле `priorty` не будет молча проигнорировано. Проверка второго `Decode` не позволит передать два JSON-объекта подряд. Ограничение размера body — базовая защита от слишком больших запросов.

## Валидация и создание задачи

Handler проверяет, что запрос имеет корректную форму, а сервис обязан сохранять бизнес-инварианты и для других входов, не только HTTP.

```go
func (api *API) createTask(w http.ResponseWriter, r *http.Request) {
	var request createTaskRequest
	if !decodeJSON(w, r, &request) {
		return
	}

	request.Title = strings.TrimSpace(request.Title)
	if request.Title == "" {
		writeError(w, http.StatusBadRequest, "название задачи обязательно")
		return
	}
	if request.Priority < 1 || request.Priority > 5 {
		writeError(w, http.StatusBadRequest, "приоритет должен быть от 1 до 5")
		return
	}

	createdTask, err := api.service.Create(r.Context(), task.CreateInput{
		Title:    request.Title,
		Priority: request.Priority,
	})
	if err != nil {
		api.logger.Error("не удалось создать задачу", "err", err)
		writeError(w, http.StatusInternalServerError, "внутренняя ошибка сервера")
		return
	}

	api.logger.Info("задача создана", "task_id", createdTask.ID)
	writeJSON(w, http.StatusCreated, createdTask)
}
```

Для недопустимых входных данных возвращаем `400 Bad Request`, а не `500`: ошибка на стороне клиента. При успешном создании используем `201 Created`.

## Изменение существующей задачи и `404`

Превратим известную ошибку сервиса «задача не найдена» в HTTP-статус `404 Not Found`:

```go
func (api *API) completeTask(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id < 1 {
		writeError(w, http.StatusBadRequest, "идентификатор задачи должен быть положительным числом")
		return
	}

	completedTask, err := api.service.Complete(r.Context(), id)
	if errors.Is(err, store.ErrTaskNotFound) {
		writeError(w, http.StatusNotFound, "задача не найдена")
		return
	}
	if err != nil {
		api.logger.Error("не удалось завершить задачу", "task_id", id, "err", err)
		writeError(w, http.StatusInternalServerError, "внутренняя ошибка сервера")
		return
	}

	writeJSON(w, http.StatusOK, completedTask)
}
```

Сравнивайте причины через `errors.Is`, а не текст ошибки. Наружу не отдавайте технические детали: они полезны в структурированном логе, но не клиенту API.

## Сборка сервера

`main` соединяет зависимости приложения:

```go
logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
store := store.NewTaskStore(logger)
service := taskservice.New(store)
api := httpapi.New(service, logger)

server := &http.Server{
	Addr:              ":8080",
	Handler:           api.Router(),
	ReadHeaderTimeout: 5 * time.Second,
}

logger.Info("HTTP-сервер запущен", "address", server.Addr)
if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
	logger.Error("HTTP-сервер завершился с ошибкой", "err", err)
}
```

`http.Server` даёт место для настройки таймаутов. Сейчас сервер завершается обычным способом; корректную остановку через `signal.NotifyContext` и `server.Shutdown` добавим в главе о жизненном цикле.

## Проверка API через `curl`

После запуска сервера выполните:

```bash
curl -i http://localhost:8080/healthz

curl -i http://localhost:8080/tasks

curl -i -X POST http://localhost:8080/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Купить молоко","priority":2}'

curl -i -X POST http://localhost:8080/tasks/1/complete
```

Проверьте также ошибочные случаи: пустое название, приоритет `0`, некорректный JSON и несуществующий ID. API должен вернуть понятный JSON с корректным статусом, а не panic и не HTML-страницу.

## Тестирование handler без настоящего сервера

`httptest.NewRequest` создаёт тестовый request, а `httptest.NewRecorder` запоминает response. Сеть и порт не нужны:

```go
func TestCreateTask(t *testing.T) {
	service := &fakeTaskService{
		createdTask: task.Task{ID: 1, Title: "Купить молоко", Priority: 2},
	}
	api := New(service, newTestLogger())

	request := httptest.NewRequest(
		http.MethodPost,
		"/tasks",
		strings.NewReader(`{"title":"Купить молоко","priority":2}`),
	)
	recorder := httptest.NewRecorder()

	api.Router().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("status = %d, ожидался %d", recorder.Code, http.StatusCreated)
	}

	var got task.Task
	if err := json.NewDecoder(recorder.Body).Decode(&got); err != nil {
		t.Fatalf("не удалось прочитать JSON-ответ: %v", err)
	}
	if got != service.createdTask {
		t.Fatalf("ответ = %+v, ожидалось %+v", got, service.createdTask)
	}
	if service.createInput.Title != "Купить молоко" || service.createInput.Priority != 2 {
		t.Fatalf("service получил %+v", service.createInput)
	}
}
```

Минимальный fake реализует интерфейс и сохраняет входные данные. Он не должен повторять логику настоящего сервиса:

```go
type fakeTaskService struct {
	createdTask task.Task
	createInput task.CreateInput
	createErr   error
}

func (service *fakeTaskService) Create(_ context.Context, input task.CreateInput) (task.Task, error) {
	service.createInput = input
	return service.createdTask, service.createErr
}

func (service *fakeTaskService) List(context.Context) ([]task.Task, error) {
	return nil, nil
}

func (service *fakeTaskService) Complete(context.Context, int) (task.Task, error) {
	return task.Task{}, nil
}
```

Тест handler проверяет HTTP-контракт: статус, JSON и то, какие данные переданы в service. Проверка реальной бизнес-логики остаётся в её unit-тестах.

## Частые ошибки

### Записывать body до статуса

```go
w.Write([]byte(`{"error":"не найдено"}`))
w.WriteHeader(http.StatusNotFound) // Уже поздно: клиент получил 200.
```

Устанавливайте заголовки и статус до записи body.

### Смешивать HTTP и бизнес-логику

```go
func (api *API) createTask(w http.ResponseWriter, r *http.Request) {
	// Не храните задачи и не управляйте mutex прямо здесь.
}
```

Handler переводит HTTP в вызов service. Это позволит заменить `net/http` на Gin в следующей главе без переписывания логики задач.

### Игнорировать ошибку JSON-декодирования

Не продолжайте работу с нулевыми значениями структуры, если JSON не прочитан. Верните `400` и завершите handler.

### Возвращать клиенту техническую ошибку

```go
writeError(w, http.StatusInternalServerError, err.Error())
```

Сообщение может раскрыть пути файлов, детали базы данных или внутренние правила. Логируйте исходную ошибку, а клиенту отдавайте стабильное безопасное сообщение.

## Дальше

У вас есть первая рабочая HTTP-версия Task Manager API на стандартном `net/http`. В следующей главе реализуем тот же HTTP-слой на Gin, сравним объём кода и сохраним service и repository без изменений.

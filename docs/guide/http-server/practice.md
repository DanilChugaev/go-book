---
prev: /guide/http-server/tests.md
next: /guide/http-server/best-practices.md
---

# Задания: первый Task Manager API

Соберите HTTP-версию Task Manager API на стандартном `net/http`. Держите handler тонким: он читает HTTP, вызывает service и формирует HTTP-ответ, но не управляет хранилищем напрямую.

## Задание 1. Добавьте health-check

Создайте `GET /healthz`. Он должен вернуть статус `200 OK` и JSON:

```json
{"status":"ok"}
```

**Критерии проверки:**

- используется `http.NewServeMux`;
- маршрут зарегистрирован как `GET /healthz`;
- `Content-Type` содержит `application/json`;
- статус равен `http.StatusOK`;
- ответ формируется через общий `writeJSON`.

<details>
  <summary>Подсказка</summary>

```go
func (api *API) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
```
</details>

<details>
  <summary>Решение</summary>

```go
func (api *API) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", api.health)
	return mux
}

func (api *API) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
```
</details>

## Задание 2. Реализуйте `GET /tasks`

Добавьте метод `List(ctx)` в интерфейс `TaskService` и маршрут `GET /tasks`. При успехе верните слайс задач и `200`, при ошибке service — безопасный JSON с `500`.

**Критерии проверки:**

- handler передаёт в service именно `r.Context()`;
- успешный ответ имеет `200 OK`;
- service-ошибка логируется с ключом `err`;
- клиент получает сообщение без технического текста исходной ошибки;
- HTTP handler не читает `map` Store напрямую.

<details>
  <summary>Подсказка</summary>

```go
tasks, err := api.service.List(r.Context())
if err != nil {
	api.logger.Error("не удалось получить задачи", "err", err)
	writeError(w, http.StatusInternalServerError, "внутренняя ошибка сервера")
	return
}
```
</details>

<details>
  <summary>Решение</summary>

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
</details>

## Задание 3. Создайте задачу через JSON

Реализуйте `POST /tasks`. Примите `title` и `priority`, запретите неизвестные JSON-поля, удалите пробелы вокруг названия и проверьте приоритет от 1 до 5. После успеха вызовите `TaskService.Create` и верните созданную задачу с `201`.

**Критерии проверки:**

- размер body ограничен через `http.MaxBytesReader`;
- decoder использует `DisallowUnknownFields`;
- некорректный JSON, пустое название и неверный приоритет дают `400`;
- `id` и `completed` не принимаются из body;
- созданная задача возвращается с `201 Created`;
- service получает `task.CreateInput`, а не `http.Request`.

<details>
  <summary>Подсказка</summary>

```go
request.Title = strings.TrimSpace(request.Title)
if request.Title == "" {
	writeError(w, http.StatusBadRequest, "название задачи обязательно")
	return
}
```
</details>

<details>
  <summary>Решение</summary>

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
		Title: request.Title, Priority: request.Priority,
	})
	if err != nil {
		api.logger.Error("не удалось создать задачу", "err", err)
		writeError(w, http.StatusInternalServerError, "внутренняя ошибка сервера")
		return
	}

	writeJSON(w, http.StatusCreated, createdTask)
}
```
</details>

## Задание 4. Завершите задачу по ID

Создайте маршрут `POST /tasks/{id}/complete`. Преобразуйте `id` через `strconv.Atoi`, отклоните неположительные значения, вызовите `TaskService.Complete` и преобразуйте `store.ErrTaskNotFound` в `404`.

**Критерии проверки:**

- ID извлекается через `r.PathValue("id")`;
- некорректный и неположительный ID дают `400`;
- используется `errors.Is`, а не сравнение текста ошибки;
- отсутствующая задача даёт JSON-ответ с `404`;
- успешный ответ содержит обновлённую задачу и `200`.

<details>
  <summary>Подсказка</summary>

```go
if errors.Is(err, store.ErrTaskNotFound) {
	writeError(w, http.StatusNotFound, "задача не найдена")
	return
}
```
</details>

<details>
  <summary>Решение</summary>

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
</details>

## Задание 5. Протестируйте `POST /tasks` без сети

Создайте fake service, который сохраняет полученный `task.CreateInput`. Через `httptest.NewRequest` и `httptest.NewRecorder` проверьте успешный запрос и хотя бы один невалидный JSON-запрос.

**Критерии проверки:**

- тест не запускает `ListenAndServe` и не использует реальный порт;
- успешный сценарий проверяет статус `201`, JSON-ответ и входные данные service;
- невалидный JSON возвращает `400`;
- fake реализует интерфейс `TaskService`;
- logger в тесте пишет в `io.Discard`;
- отсутствуют `time.Sleep` и зависимость от порядка тестов.

<details>
  <summary>Подсказка</summary>

```go
request := httptest.NewRequest(http.MethodPost, "/tasks", strings.NewReader(`{"title":"Купить молоко","priority":2}`))
recorder := httptest.NewRecorder()

api.Router().ServeHTTP(recorder, request)
```
</details>

<details>
  <summary>Решение</summary>

```go
type fakeTaskService struct {
	createdTask task.Task
	createInput task.CreateInput
}

func (service *fakeTaskService) Create(_ context.Context, input task.CreateInput) (task.Task, error) {
	service.createInput = input
	return service.createdTask, nil
}

func (service *fakeTaskService) List(context.Context) ([]task.Task, error) {
	return nil, nil
}

func (service *fakeTaskService) Complete(context.Context, int) (task.Task, error) {
	return task.Task{}, nil
}

func newTestLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

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
	if contentType := recorder.Header().Get("Content-Type"); !strings.Contains(contentType, "application/json") {
		t.Fatalf("Content-Type = %q, ожидался JSON", contentType)
	}

	var got task.Task
	if err := json.NewDecoder(recorder.Body).Decode(&got); err != nil {
		t.Fatalf("не удалось прочитать JSON-ответ: %v", err)
	}
	if got != service.createdTask {
		t.Fatalf("ответ = %+v, ожидалось %+v", got, service.createdTask)
	}
	if service.createInput != (task.CreateInput{Title: "Купить молоко", Priority: 2}) {
		t.Fatalf("service получил %+v", service.createInput)
	}
}

func TestCreateTaskInvalidJSON(t *testing.T) {
	api := New(&fakeTaskService{}, newTestLogger())
	request := httptest.NewRequest(http.MethodPost, "/tasks", strings.NewReader(`{"title":`))
	recorder := httptest.NewRecorder()

	api.Router().ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, ожидался %d", recorder.Code, http.StatusBadRequest)
	}
}
```
</details>

## Проверьте себя

Перед переходом к Gin убедитесь, что вы можете:

- зарегистрировать маршрут в `ServeMux` с методом и path-параметром;
- вернуть JSON и корректный HTTP-статус;
- прочитать и проверить JSON-body без неявного игнорирования полей;
- отделить HTTP handler от service и хранилища;
- передать `r.Context()` в операцию;
- проверить HTTP-контракт через `httptest` без настоящей сети.

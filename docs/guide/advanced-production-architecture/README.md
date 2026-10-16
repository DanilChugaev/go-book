---
prev: /guide/advanced-reflection-unsafe-cgo/best-practices.md
next: /guide/advanced-production-architecture/config-health.md
---

# Продвинутый Go F: архитектура production-сервиса

## Цель главы

Научиться принимать архитектурные решения для production-сервиса: удерживать направление зависимостей, вводить интерфейсы на реальных границах, управлять конфигурацией и секретами, строить наблюдаемость, readiness/liveness, retries, idempotency, rate limiting и защиту HTTP API.

Task Manager API после основного маршрута уже имеет Gin, PostgreSQL, Docker, CI/CD, request ID и graceful shutdown. Эта глава не предлагает переписать его под «идеальную архитектуру». Она помогает развивать сервис по мере появления настоящих требований — внешних клиентов, нескольких экземпляров API, фоновых задач, SLA, атакующего трафика и изменений команды.

## Карта главы

1. **Эта страница** — зависимости, слои и интерфейсы без overengineering.
2. [Конфигурация, секреты и health-checks](config-health.md) — startup validation, liveness, readiness и lifecycle.
3. [Observability: логи, метрики и tracing](observability.md) — три сигнала и безопасный контекст операций.
4. [Timeouts, retries, idempotency и rate limiting](reliability.md) — надёжное поведение при сбоях и повторной доставке.
5. [Безопасность API и code review](security-review.md) — аутентификация, авторизация, input limits, HTTP hardening и checklist.

## Архитектура — это направление зависимостей

Слои нужны не ради количества папок. Они отвечают на вопрос: какой код знает о деталях инфраструктуры, а какой — только о правилах предметной области.

Для Task Manager полезна следующая зависимость:

```text
                 cmd/api (composition root)
                           │
                           ▼
Gin handler ───────► task service ◄─────── PrioritySuggester interface
     │                    │                          ▲
     │                    ▼                          │
     │          TaskRepository interface             │
     │                    ▲                          │
     ▼                    │                          │
HTTP request         PostgreSQL repository      HTTP client
```

Стрелка означает «знает тип и вызывает его». HTTP handler может знать Gin; PostgreSQL-repository может знать `database/sql`; Resty-клиент может знать Resty. Но `taskservice` не должен импортировать Gin, `database/sql`, pgx, Resty, переменные окружения или конкретный logger transport.

## Responsibilities важнее названий папок

Одна из понятных структур:

```text
task-manager-api/
├── cmd/api/main.go                 # composition root и lifecycle процесса
├── internal/
│   ├── task/                       # Task, TaskID, CreateInput, доменные ошибки
│   ├── taskservice/                # сценарии Create, Complete, List
│   ├── postgresrepo/               # SQL и *sql.DB
│   ├── priorityclient/             # HTTP-клиент внешнего сервиса
│   ├── ginapi/                     # router, handlers, HTTP DTO, middleware
│   ├── config/                     # Config, загрузка и startup validation
│   └── observability/              # создание logger/meter/tracer при необходимости
├── migrations/
└── compose.yaml
```

Это пример, не догма. Не создавайте package на каждую структуру или один огромный `internal/common`. Пакет должен иметь связную причину существования: доменные правила задач, PostgreSQL persistence, HTTP transport или сборка приложения.

## Domain не должен зависеть от delivery

Модель и бизнес-правила не должны знать, пришёл ли запрос по HTTP, из CLI, очереди или cron-job:

```go
package task

type CreateInput struct {
	Title    string
	Priority Priority
}

func (input CreateInput) Validate() error {
	if strings.TrimSpace(input.Title) == "" {
		return &ValidationError{Field: "title", Rule: "required"}
	}
	if !input.Priority.Valid() {
		return &ValidationError{Field: "priority", Rule: "range"}
	}
	return nil
}
```

Gin handler отвечает за HTTP-специфику: прочитать JSON, ограничить body, распарсить path, выбрать status и сериализовать response. Service отвечает за use case: проверить правило, сохранить задачу, при необходимости запросить подсказку приоритета. Repository отвечает за persistence contract. Такое разделение даёт быстрые unit-тесты service и отдельные integration-тесты SQL.

## Интерфейс объявляет потребитель

Интерфейс полезен не потому, что «всё нужно mock-ать», а потому, что потребителю нужна небольшая возможность. Service может определить её рядом с use case:

```go
package taskservice

type Repository interface {
	Create(ctx context.Context, input task.CreateInput) (task.Task, error)
	Get(ctx context.Context, id task.TaskID) (task.Task, error)
	Complete(ctx context.Context, id task.TaskID) (task.Task, error)
}

type PrioritySuggester interface {
	Suggest(ctx context.Context, title string) (task.Priority, error)
}

type Service struct {
	repository Repository
	priority   PrioritySuggester
}
```

`postgresrepo.Repository` реализует `Repository` неявно, а `priorityclient.Client` — `PrioritySuggester`. При этом service не зависит от пакетов с реализациями. Тест передаёт маленький fake, который моделирует только нужное поведение.

```go
type fakeRepository struct {
	create func(context.Context, task.CreateInput) (task.Task, error)
}

func (fake *fakeRepository) Create(ctx context.Context, input task.CreateInput) (task.Task, error) {
	return fake.create(ctx, input)
}
```

::: tip Не обязательно создавать интерфейс заранее
Если service использует только конкретную чистую функцию или value object, интерфейс не нужен. Если существует одна реализация и нет тестовой границы, сначала оставьте конкретный тип. Интерфейс должен выражать потребность потребителя, а не предсказывать все возможные будущие реализации.
:::

## Тонкий handler, конкретный service, изолированный repository

Хороший handler коротко переводит transport data в use case:

```go
func (api *API) createTask(c *gin.Context) {
	var request createTaskRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		writeError(c, http.StatusBadRequest, "invalid_request", "Некорректный JSON")
		return
	}

	created, err := api.service.Create(c.Request.Context(), task.CreateInput{
		Title:    request.Title,
		Priority: task.Priority(request.Priority),
	})
	if err != nil {
		api.writeServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, created)
}
```

Что **не** должен делать handler:

- собирать SQL и вызывать `db.QueryContext`;
- читать env на каждом запросе;
- запускать goroutine без ownership и shutdown contract;
- превращать `err.Error()` в публичный JSON;
- передавать `*gin.Context` в service/repository.

Что **не** должен делать service:

- выбирать HTTP status или создавать `gin.H`;
- открывать подключение к БД на каждый метод;
- читать токен из `os.Getenv`;
- скрывать бизнес-правило за общим CRUD, если операция имеет отдельную семантику.

Repository не обязан быть «тупым»: он переводит ожидаемые технические причины (`sql.ErrNoRows`) в domain errors, использует context и защищает SQL parameters. Но authorization обычно не прячут в случайных SQL predicate без явного уровня policy: сервису и review должно быть видно, кто имеет право завершить задачу.

## Composition root: `main` собирает graph зависимостей

Только entrypoint знает конкретные реализации:

```go
func run(ctx context.Context) error {
	config, err := config.Load()
	if err != nil {
		return fmt.Errorf("загрузить конфигурацию: %w", err)
	}

	logger := observability.NewLogger(config.LogLevel)
	database, err := postgresrepo.Open(ctx, config.DatabaseURL)
	if err != nil {
		return fmt.Errorf("подключить PostgreSQL: %w", err)
	}

	repository := postgresrepo.New(database)
	priorityClient := priorityclient.New(config.PriorityServiceURL, config.HTTPClientTimeout)
	service := taskservice.New(repository, priorityClient)
	api := ginapi.New(service, logger)

	server := newServer(config.HTTPAddress, api.Router())
	return serve(ctx, server, database, logger)
}
```

Здесь допустимо видеть все packages: это composition root. Внутренние слои остаются независимыми. Такая «ручная dependency injection» проста, проверяется компилятором и обычно лучше контейнера, который собирает зависимости reflection-магией.

## Границы бывают и у данных

Не передавайте database/HTTP модели прямо наружу:

```go
// Внутренняя доменная модель.
type Task struct {
	ID        TaskID
	Title     string
	Priority  Priority
	Completed bool
	CreatedAt time.Time
}

// HTTP response может развиваться отдельно.
type taskResponse struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Priority  int       `json:"priority"`
	Completed bool      `json:"completed"`
	CreatedAt time.Time `json:"created_at"`
}
```

Явный mapping кажется лишним для маленького API, но защищает от случайной публикации нового поля, изменения внутреннего типа или утечки metadata БД. Создавайте отдельные DTO там, где внешний contract действительно отличается. Не копируйте структуры механически, если модель уже является сознательно спроектированным публичным contract.

## Как добавлять новую функцию

Новая возможность проходит вопросы по слоям:

1. **Contract:** какой HTTP/CLI/queue вход и результат? Кто может выполнить действие?
2. **Domain:** какие инварианты и errors появляются?
3. **Use case:** какие зависимости нужны, какие side effects допустимы, нужна ли transaction?
4. **Persistence/integration:** какая миграция, SQL, внешний API, timeout и retry policy?
5. **Operations:** какие logs, metrics, traces, health/readiness изменения и dashboards/alerts потребуются?
6. **Delivery:** совместима ли миграция с rollback, есть ли tests, config и deploy plan?

Архитектура production-сервиса — это способность отвечать на эти вопросы перед тем, как изменение попадёт в `main` и production. Следующая страница продолжит с конфигурации и состояния готовности процесса.

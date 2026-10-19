---
prev: /guide/docker/best-practices.md
next: /guide/sql-postgresql/tests.md
---

# SQL и PostgreSQL

## Цель урока

Подключить Task Manager API к PostgreSQL из Docker Compose через `database/sql` и `pgx`, хранить структуру БД в SQL-миграциях Goose, реализовать CRUD-репозиторий задач с параметризованными запросами, применять context в операциях БД и проверять всё интеграционными тестами против отдельной тестовой базы.

В предыдущей главе PostgreSQL уже запущен как сервис `postgres` в Docker Compose. Сейчас он перестаёт быть только инфраструктурой: API подключается к нему и заменяет in-memory `TaskStore` на PostgreSQL-репозиторий.

```text
Gin handler → TaskService → TaskRepository → database/sql → pgx → PostgreSQL
```

Service по-прежнему зависит от интерфейса репозитория. Благодаря этому HTTP-слой Gin и бизнес-правила не должны знать SQL-запросы, а unit-тесты service могут использовать fake repository.

## PostgreSQL и DBeaver

Поднимите окружение из прошлой главы:

```bash
cd examples/task-manager-api
docker compose up -d
docker compose ps
```

Внутри Docker Compose приложение подключается к host `postgres`. DBeaver запускается на вашем компьютере, поэтому для него указывайте опубликованный локальный адрес:

| Поле DBeaver | Значение из `.env` по умолчанию |
| --- | --- |
| Host | `localhost` |
| Port | `5432` (`POSTGRES_PORT`) |
| Database | `task_manager` (`POSTGRES_DB`) |
| Username | `task_manager` (`POSTGRES_USER`) |
| Password | `local-development-only` (`POSTGRES_PASSWORD`) |

В DBeaver выберите **New Database Connection → PostgreSQL**, заполните поля и нажмите **Test Connection**. Если драйвер PostgreSQL ещё не скачан, DBeaver предложит сделать это сам.

Для учебного Docker Compose TLS не настроен. Если DBeaver требует SSL, на вкладке **SSL** выберите режим `disable`. В production режим TLS определяется требованиями инфраструктуры, а не этой локальной настройкой.

После выполнения миграций раскройте соединение в Database Navigator:

```text
Databases → task_manager → Schemas → public → Tables → tasks
```

Через DBeaver удобно просматривать таблицы, запускать `SELECT` и проверять результат миграций. Он не заменяет миграции: изменение таблицы вручную в UI не попадёт в Git и не повторится у другого разработчика.

::: tip Два разных hostname
Из API-container подключайтесь к `postgres:5432`. Из DBeaver на компьютере — к `localhost:5432`. `localhost` внутри container означает сам container, а не сервис PostgreSQL.
:::

## `database/sql` и pgx

`database/sql` — стандартный пакет Go с общим API для SQL-баз. Он управляет пулом соединений, `QueryContext`, `ExecContext`, `BeginTx` и транзакциями, но сам не умеет разговаривать с PostgreSQL. Для этого нужен драйвер.

Используем `pgx` через адаптер `stdlib`:

```bash
go get github.com/jackc/pgx/v5/stdlib
```

Зарегистрируйте драйвер blank-импортом один раз в пакете, где открываете базу:

```go
import (
	"database/sql"
	_ "github.com/jackc/pgx/v5/stdlib"
)
```

Пустой идентификатор означает: пакет нужен из-за side effect — он регистрирует драйвер с именем `pgx`. Теперь можно вызвать:

```go
db, err := sql.Open("pgx", databaseURL)
if err != nil {
	return nil, fmt.Errorf("открыть PostgreSQL: %w", err)
}
```

`sql.Open` не гарантирует, что соединение с базой уже установлено. Он создаёт `*sql.DB` — пул будущих соединений. Реальную доступность проверяет `PingContext`.

## Открытие и настройка пула

Создайте функцию подключения:

```go
func Open(ctx context.Context, databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("открыть PostgreSQL: %w", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(5 * time.Minute)

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := db.PingContext(pingCtx); err != nil {
		db.Close()
		return nil, fmt.Errorf("проверить PostgreSQL: %w", err)
	}

	return db, nil
}
```

Значения пула зависят от нагрузки и ограничений PostgreSQL. Эти числа — безопасный старт для учебного API, а не универсальный production-рецепт. Общее число подключений всех экземпляров API должно помещаться в лимит `max_connections` базы.

Если `PingContext` не удался, закрывайте уже созданный пул до возврата ошибки. В `main` после graceful shutdown передайте `db` в `closeAll`, который появился в прошлой главе:

```go
defer db.Close()
```

В реальном `run` закрытие должно идти **после** `server.Shutdown`, чтобы активный handler не потерял базу во время запроса.

## `DATABASE_URL`

Внутри Compose строка подключения имеет вид:

```text
postgresql://task_manager:local-development-only@postgres:5432/task_manager?sslmode=disable
```

Для запуска кода на компьютере и DBeaver hostname меняется на `localhost`:

```text
postgresql://task_manager:local-development-only@localhost:5432/task_manager?sslmode=disable
```

`sslmode=disable` допустим только для локального учебного окружения Docker. В production способ TLS-подключения выбирается требованиями инфраструктуры; не переносите это значение без проверки.

Добавьте в локальный `.env`:

```dotenv
DATABASE_URL=postgresql://task_manager:local-development-only@postgres:5432/task_manager?sslmode=disable
```

Значение внутри API-container использует `postgres`. Не выводите полный `DATABASE_URL` в лог: в нём есть пароль.

## Миграции Goose

Миграция — версия изменения схемы БД, которая хранится в Git и применяется одинаково у каждого разработчика и на CI. Не создавайте таблицы вручную только через DBeaver или `psql`: остальным окружениям это изменение не достанется.

Добавьте библиотеку и CLI Goose:

```bash
go get github.com/pressly/goose/v3
go install github.com/pressly/goose/v3/cmd/goose@latest
```

Создайте каталог `migrations` и первую миграцию:

```bash
mkdir migrations
goose -dir migrations create create_tasks_table sql
```

Файл будет иметь timestamp в имени. Например, `migrations/20261014120000_create_tasks_table.sql`:

```sql
-- +goose Up
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL CHECK (char_length(btrim(title)) > 0),
    priority SMALLINT NOT NULL CHECK (priority BETWEEN 1 AND 5),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tasks_completed_priority_idx ON tasks (completed, priority);

-- +goose Down
DROP TABLE tasks;
```

В `Up` находятся действия применения, в `Down` — откат именно этой миграции. После того как миграция попала в общую среду, не переписывайте её историю. Создайте следующую миграцию для нового изменения схемы.

Примените и проверьте миграции внутри API-container или на хосте с корректным `DATABASE_URL`:

```bash
goose -dir migrations postgres "$DATABASE_URL" status
goose -dir migrations postgres "$DATABASE_URL" up
goose -dir migrations postgres "$DATABASE_URL" status
```

Goose создаёт таблицу `goose_db_version`. В DBeaver убедитесь, что есть и `tasks`, и `goose_db_version`.

## Модель SQL и Go

Добавим время создания и обновления в модель, чтобы репозиторий мог читать их из PostgreSQL:

```go
type Task struct {
	ID        int64      `json:"id"`
	Title     string     `json:"title"`
	Priority  int        `json:"priority"`
	Completed bool       `json:"completed"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
```

Выбирайте `BIGSERIAL` и `int64` согласованно. PostgreSQL возвращает время с временной зоной в `time.Time`. JSON-кодировщик отдаст его в формате RFC 3339.

Для `INSERT ... RETURNING` создайте задачу и получите значения, которые назначила база:

```go
const createTaskQuery = `
INSERT INTO tasks (title, priority)
VALUES ($1, $2)
RETURNING id, title, priority, completed, created_at, updated_at`

func (repository *Repository) Create(ctx context.Context, input task.CreateInput) (task.Task, error) {
	var created task.Task
	err := repository.db.QueryRowContext(ctx, createTaskQuery, input.Title, input.Priority).Scan(
		&created.ID,
		&created.Title,
		&created.Priority,
		&created.Completed,
		&created.CreatedAt,
		&created.UpdatedAt,
	)
	if err != nil {
		return task.Task{}, fmt.Errorf("создать задачу: %w", err)
	}

	return created, nil
}
```

`QueryRowContext` подходит, когда ожидается ровно одна строка. `Scan` выполняет запрос и считывает результат. Порядок переменных должен совпадать с порядком столбцов в `RETURNING`.

## Параметры и SQL-инъекции

Никогда не собирайте значения пользователя через `fmt.Sprintf`:

```go
// Уязвимо и неверно:
// query := fmt.Sprintf("SELECT id FROM tasks WHERE title = '%s'", title)
```

Используйте placeholders PostgreSQL `$1`, `$2` и передавайте значения отдельными аргументами:

```go
const getTaskQuery = `
SELECT id, title, priority, completed, created_at, updated_at
FROM tasks
WHERE id = $1`

row := repository.db.QueryRowContext(ctx, getTaskQuery, id)
```

Драйвер сам передаёт `id` как значение, а не как часть SQL-синтаксиса. Placeholders применяются к **данным**, но не к именам таблиц, столбцов и `ORDER BY`-направлениям. Если позже понадобится динамическая сортировка, выбирайте имя столбца из закрытого whitelist, а не из строки клиента.

## `Get`, `List` и `sql.ErrNoRows`

`Get` преобразует отсутствие строки в доменную ошибку:

```go
var ErrTaskNotFound = errors.New("задача не найдена")

func (repository *Repository) Get(ctx context.Context, id int64) (task.Task, error) {
	var current task.Task
	err := repository.db.QueryRowContext(ctx, getTaskQuery, id).Scan(
		&current.ID,
		&current.Title,
		&current.Priority,
		&current.Completed,
		&current.CreatedAt,
		&current.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return task.Task{}, ErrTaskNotFound
	}
	if err != nil {
		return task.Task{}, fmt.Errorf("получить задачу %d: %w", id, err)
	}

	return current, nil
}
```

HTTP layer затем преобразует `ErrTaskNotFound` в `404`, не зная о `sql.ErrNoRows`.

Для нескольких строк используйте `QueryContext`. Всегда закрывайте `rows` и проверяйте `rows.Err()` после цикла:

```go
const listTasksQuery = `
SELECT id, title, priority, completed, created_at, updated_at
FROM tasks
ORDER BY id`

func (repository *Repository) List(ctx context.Context) ([]task.Task, error) {
	rows, err := repository.db.QueryContext(ctx, listTasksQuery)
	if err != nil {
		return nil, fmt.Errorf("получить список задач: %w", err)
	}
	defer rows.Close()

	tasks := make([]task.Task, 0)
	for rows.Next() {
		var current task.Task
		if err := rows.Scan(
			&current.ID,
			&current.Title,
			&current.Priority,
			&current.Completed,
			&current.CreatedAt,
			&current.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("прочитать задачу: %w", err)
		}
		tasks = append(tasks, current)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("обойти список задач: %w", err)
	}

	return tasks, nil
}
```

Пустой список возвращается как `[]`, а не `null`, поскольку слайс создаётся через `make`.

## Update и Delete

Завершим задачу через `UPDATE ... RETURNING`:

```go
const completeTaskQuery = `
UPDATE tasks
SET completed = TRUE, updated_at = NOW()
WHERE id = $1
RETURNING id, title, priority, completed, created_at, updated_at`

func (repository *Repository) Complete(ctx context.Context, id int64) (task.Task, error) {
	var completed task.Task
	err := repository.db.QueryRowContext(ctx, completeTaskQuery, id).Scan(
		&completed.ID,
		&completed.Title,
		&completed.Priority,
		&completed.Completed,
		&completed.CreatedAt,
		&completed.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return task.Task{}, ErrTaskNotFound
	}
	if err != nil {
		return task.Task{}, fmt.Errorf("завершить задачу %d: %w", id, err)
	}

	return completed, nil
}
```

Для удаления обычно достаточно `ExecContext` и проверки числа затронутых строк:

```go
func (repository *Repository) Delete(ctx context.Context, id int64) error {
	result, err := repository.db.ExecContext(ctx, `DELETE FROM tasks WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("удалить задачу %d: %w", id, err)
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("узнать число удалённых задач: %w", err)
	}
	if affected == 0 {
		return ErrTaskNotFound
	}

	return nil
}
```

## Context в SQL-операциях

Используйте методы с суффиксом `Context`: `PingContext`, `QueryContext`, `QueryRowContext`, `ExecContext`, `BeginTx`. Тогда отменённый HTTP-запрос или дедлайн не оставит бессмысленную SQL-операцию работать дальше.

```go
createdTask, err := repository.Create(c.Request.Context(), input)
```

Не подменяйте полученный context на `context.Background()` внутри репозитория. Исключение — отдельный lifecycle context при штатном завершении процесса, но это задача `main`, а не CRUD-метода.

## Транзакции

Транзакция нужна, когда несколько изменений должны пройти все вместе или ни одно. Например, создадим задачу и запись аудита:

```go
func (repository *Repository) CreateWithAudit(ctx context.Context, input task.CreateInput) (task.Task, error) {
	tx, err := repository.db.BeginTx(ctx, nil)
	if err != nil {
		return task.Task{}, fmt.Errorf("начать транзакцию: %w", err)
	}
	defer tx.Rollback() // после Commit вернёт sql.ErrTxDone и будет проигнорирован

	var created task.Task
	err = tx.QueryRowContext(ctx, createTaskQuery, input.Title, input.Priority).Scan(
		&created.ID, &created.Title, &created.Priority, &created.Completed,
		&created.CreatedAt, &created.UpdatedAt,
	)
	if err != nil {
		return task.Task{}, fmt.Errorf("создать задачу: %w", err)
	}

	if _, err := tx.ExecContext(ctx,
		`INSERT INTO task_audit (task_id, action) VALUES ($1, $2)`,
		created.ID, "created",
	); err != nil {
		return task.Task{}, fmt.Errorf("создать аудит: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return task.Task{}, fmt.Errorf("зафиксировать транзакцию: %w", err)
	}
	return created, nil
}
```

Не начинайте транзакцию вокруг каждого одиночного `INSERT` или `UPDATE`: PostgreSQL и так выполняет одиночную SQL-команду атомарно. `task_audit` здесь появится только в отдельной миграции, если такая функция действительно нужна.

## Интеграционные тесты через Docker Compose

Unit-тесты service остаются быстрыми и используют fake repository. PostgreSQL-репозиторий нужно также проверять против настоящей БД: SQL-синтаксис, типы, constraints и миграции нельзя надёжно подтвердить только mock-объектом.

Поднимите PostgreSQL из Compose и создайте отдельную тестовую БД один раз:

```bash
cd examples/task-manager-api
docker compose up -d postgres
docker compose exec postgres createdb -U task_manager task_manager_test
```

Задайте **только** тестовую строку подключения:

```bash
export TEST_DATABASE_URL='postgresql://task_manager:local-development-only@localhost:5432/task_manager_test?sslmode=disable'
```

Тесты никогда не должны получать `DATABASE_URL` production или development-базы. Разбирайте URL и проверяйте **именно имя базы**, а не наличие `_test` во всей строке: эта подстрока может случайно оказаться в имени пользователя, пароле или query-параметре.

```go
func testDatabaseURL(t *testing.T) string {
	t.Helper()

	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL не задан")
	}

	parsedURL, err := url.Parse(databaseURL)
	if err != nil {
		t.Fatalf("разобрать TEST_DATABASE_URL: %v", err)
	}

	databaseName := strings.TrimPrefix(parsedURL.Path, "/")
	if databaseName != "task_manager_test" {
		t.Fatalf("TEST_DATABASE_URL должен указывать на task_manager_test, получено %q", databaseName)
	}
	return databaseURL
}
```

Для этого helper понадобятся импорты `net/url` и `strings`. Если в вашем проекте тестовая БД называется иначе, вынесите разрешённое имя в константу и измените её явно.

Примените к ней миграции в `TestMain` или до тестового запуска:

```bash
goose -dir migrations postgres "$TEST_DATABASE_URL" up
go test -tags=integration ./internal/postgresrepo/...
```

Используйте build tag, чтобы обычный `go test ./...` не требовал запущенную БД:

```go
//go:build integration

package postgresrepo_test
```

Перед каждым тестом очищайте только тестовую таблицу:

```go
func truncateTasks(t *testing.T, db *sql.DB) {
	t.Helper()
	if _, err := db.Exec(`TRUNCATE tasks RESTART IDENTITY`); err != nil {
		t.Fatalf("очистить tasks: %v", err)
	}
}
```

Тест `Create` проверяет реальную вставку и чтение:

```go
func TestRepositoryCreateAndGet(t *testing.T) {
	db := openTestDatabase(t)
	t.Cleanup(func() { db.Close() })
	truncateTasks(t, db)

	repository := postgresrepo.New(db)
	created, err := repository.Create(context.Background(), task.CreateInput{
		Title: "Купить молоко", Priority: 2,
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if created.ID == 0 || created.CreatedAt.IsZero() {
		t.Fatalf("создана некорректная задача: %+v", created)
	}

	got, err := repository.Get(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if got.Title != created.Title || got.Priority != created.Priority {
		t.Fatalf("Get = %+v, ожидалась %+v", got, created)
	}
}
```

Не запускайте такие тесты с `t.Parallel`, если они используют одну БД и `TRUNCATE`. Для полной изоляции параллельных интеграционных тестов понадобятся отдельные схемы или базы — это отдельная задача.

## Частые ошибки

### Думать, что `sql.Open` уже подключился

`sql.Open` может успешно вернуть pool при недоступной БД. Проверяйте доступность через `PingContext` с timeout при старте.

### Подставлять значения в SQL строкой

```go
query := "DELETE FROM tasks WHERE id = " + id
```

Такой код уязвим и ломается на форматах данных. Используйте `$1` и аргументы `ExecContext`.

### Не закрывать `rows`

Незакрытые `rows` удерживают соединение пула. После успешного `QueryContext` сразу пишите `defer rows.Close()` и после обхода проверяйте `rows.Err()`.

### Запускать тесты против development-БД

`TRUNCATE` в тесте может уничтожить ваши локальные данные. Используйте отдельную `task_manager_test`, `TEST_DATABASE_URL` и защитную проверку имени базы.

### Редактировать уже применённую миграцию

У другого разработчика или CI эта версия могла уже примениться. Создайте новую миграцию, которая изменяет схему вперёд.

## Дальше

Task Manager хранит задачи в PostgreSQL, а схема воспроизводимо развивается через Goose. В следующей главе настроим CI/CD и деплой: тесты, проверку образа, secrets и health-check после доставки приложения.

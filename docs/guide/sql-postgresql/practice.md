---
prev: /guide/sql-postgresql/tests.md
next: /guide/sql-postgresql/best-practices.md
---

# Задания: PostgreSQL-репозиторий Task Manager

Подключите Task Manager API к PostgreSQL из Docker Compose. Сохраняйте границы приложения: Gin handler вызывает service, service зависит от интерфейса, а SQL остаётся в `internal/postgresrepo`.

## Задание 1. Подготовьте базу и DBeaver

Запустите PostgreSQL из Compose, затем подключитесь к нему через DBeaver по `localhost` и значениям `.env`.

```bash
cd examples/task-manager-api
docker compose up -d postgres
docker compose ps
```

**Критерии проверки:**

- PostgreSQL имеет статус `healthy`;
- DBeaver подключается к `localhost:${POSTGRES_PORT}`;
- выбраны база, пользователь и пароль из `.env`;
- API-container в будущей строке подключения использует `postgres:5432`;
- пароль остаётся только в локальном `.env` или безопасном хранилище secrets.

## Задание 2. Подключите `database/sql` и pgx

Добавьте `github.com/jackc/pgx/v5/stdlib`. Реализуйте `Open(ctx, databaseURL)`, который открывает драйвер `pgx`, настраивает пул и выполняет `PingContext` с timeout.

**Критерии проверки:**

- driver импортирован через blank import;
- используется `sql.Open("pgx", databaseURL)`;
- настраиваются `SetMaxOpenConns`, `SetMaxIdleConns`, `SetConnMaxLifetime`;
- `PingContext` имеет отдельный ограниченный context;
- при ошибке ping pool закрывается;
- полный DATABASE_URL не выводится в лог.

<details>
  <summary>Подсказка</summary>

```go
pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()

if err := db.PingContext(pingCtx); err != nil {
	db.Close()
	return nil, fmt.Errorf("проверить PostgreSQL: %w", err)
}
```
</details>

## Задание 3. Создайте и примените миграцию Goose

Установите Goose, создайте SQL-миграцию `create_tasks_table` и добавьте таблицу `tasks` с ID, названием, приоритетом, completed и timestamps. Добавьте constraints: название не пустое после `btrim`, приоритет от 1 до 5.

**Критерии проверки:**

- миграция хранится в `migrations/` и коммитится в Git;
- у неё есть разделы `-- +goose Up` и `-- +goose Down`;
- `id` согласован с `int64` в Go;
- есть `NOT NULL` и `CHECK` constraints;
- `goose status` показывает состояние миграций;
- в DBeaver видны `tasks` и `goose_db_version`.

<details>
  <summary>Подсказка</summary>

```sql
-- +goose Up
CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL CHECK (char_length(btrim(title)) > 0),
    priority SMALLINT NOT NULL CHECK (priority BETWEEN 1 AND 5),
    completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- +goose Down
DROP TABLE tasks;
```
</details>

## Задание 4. Реализуйте CRUD-репозиторий

Создайте `internal/postgresrepo.Repository` с методами `Create`, `Get`, `List`, `Complete` и `Delete`. Все методы должны принимать `context.Context`; значения передавайте через `$1`, `$2`; отсутствие строки превратите из `sql.ErrNoRows` в `ErrTaskNotFound`.

**Критерии проверки:**

- `Create` и `Complete` используют `RETURNING`;
- `Get` использует `QueryRowContext` и `Scan`;
- `List` использует `QueryContext`, `defer rows.Close` и `rows.Err`;
- `Delete` проверяет `RowsAffected`;
- нет SQL, собранного через конкатенацию пользовательских данных;
- технические SQL-ошибки обёрнуты с контекстом.

<details>
  <summary>Подсказка</summary>

```go
row := repository.db.QueryRowContext(ctx, getTaskQuery, id)
if err := row.Scan(&current.ID, &current.Title, ...); errors.Is(err, sql.ErrNoRows) {
	return task.Task{}, ErrTaskNotFound
}
```
</details>

## Задание 5. Добавьте одну транзакцию

Создайте отдельную миграцию для `task_audit`. Реализуйте `CreateWithAudit`: одна транзакция создаёт задачу и запись аудита. Если вставка аудита не удалась, задача не должна остаться в БД.

**Критерии проверки:**

- используется `BeginTx(ctx, nil)`;
- есть `defer tx.Rollback()`;
- оба SQL-вызова используют `tx`, а не `db`;
- `Commit` вызывается только после обоих успешных действий;
- ошибка любого шага откатывает изменение;
- одиночные CRUD-методы не обёрнуты в лишние транзакции.

## Задание 6. Напишите интеграционные тесты

Создайте отдельную `task_manager_test` в уже запущенном PostgreSQL. Задайте `TEST_DATABASE_URL`, примените миграции и добавьте integration-тесты Create/Get, List, Complete, Delete и отсутствующей задачи. Запускайте их build tag `integration`.

```bash
docker compose exec postgres createdb -U task_manager task_manager_test
export TEST_DATABASE_URL='postgresql://task_manager:local-development-only@localhost:5432/task_manager_test?sslmode=disable'
goose -dir migrations postgres "$TEST_DATABASE_URL" up
go test -tags=integration ./internal/postgresrepo/...
```

**Критерии проверки:**

- tests используют только `TEST_DATABASE_URL`;
- URL проверяется на отдельную test-БД;
- миграции применены до тестов;
- таблицы очищаются перед сценарием через `TRUNCATE ... RESTART IDENTITY`;
- tests не используют `t.Parallel`, публичную сеть и `time.Sleep`;
- обычный `go test ./...` не требует PostgreSQL;
- integration suite проходит с `-race`.

## Проверьте себя

Перед главой CI/CD убедитесь, что вы можете:

- подключить PostgreSQL через `database/sql` и pgx;
- создать миграцию и проверить её через Goose и DBeaver;
- реализовать SQL CRUD только с параметрами и context;
- отличить `QueryRowContext`, `QueryContext` и `ExecContext`;
- выбрать транзакцию только для нескольких зависимых изменений;
- безопасно запускать интеграционные тесты на отдельной базе.

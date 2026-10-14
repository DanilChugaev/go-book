---
prev: /guide/ci-cd-deploy/best-practices.md
next: /guide/final-integration/tests.md
---

# Итоговая интеграция

## Цель урока

Собрать все части курса в один завершённый Task Manager API: документировать структуру проекта и запуск, проверить PostgreSQL-миграции, выполнить HTTP-сценарии через Gin, убедиться в качестве кода, Docker-окружения и CI/CD, а затем составить осознанный план развития проекта.

Эта глава не добавляет новую библиотеку. Её цель — превратить набор отдельных тем в работающий backend-проект, который можно передать другому разработчику: он сможет клонировать репозиторий, поднять окружение, применить миграции, вызвать API и понять, как проверить изменения.

## Что получилось

Итоговый Task Manager API умеет:

- принимать и возвращать JSON через Gin;
- создавать, получать, завершать и удалять задачи;
- проверять входные данные и возвращать предсказуемые HTTP-статусы;
- передавать request context в service, внешний HTTP-клиент и PostgreSQL;
- писать структурированные логи, request ID и access log;
- хранить задачи в PostgreSQL;
- применять схему БД через Goose-миграции;
- запускаться в Docker Compose;
- корректно завершаться по `SIGINT`/`SIGTERM`;
- проходить unit, race и PostgreSQL integration-тесты;
- собираться в Docker image и доставляться через CI/CD.

## Итоговая архитектура

Разложите исходный код по обязанностям, а не по типам файлов. Один из возможных итоговых вариантов:

```text
task-manager-api/
├── cmd/
│   └── api/
│       └── main.go                 # сборка зависимостей и жизненный цикл
├── internal/
│   ├── config/                     # env и валидация Config
│   ├── task/                       # Task, CreateInput, доменные правила
│   ├── taskservice/                # бизнес-сценарии и интерфейсы зависимостей
│   ├── postgresrepo/               # SQL-реализация TaskRepository
│   ├── priorityclient/             # Resty-клиент внешнего API
│   └── ginapi/                     # Gin router, handlers, middleware
├── migrations/                     # Goose SQL-миграции
├── Dockerfile
├── compose.yaml                    # локальная разработка
├── compose.production.yaml         # VPS-окружение
├── .env.example
├── go.mod
├── go.sum
└── README.md
```

Направление зависимостей должно оставаться таким:

```text
Gin handler → TaskService → TaskRepository interface
                                  ↓
                         PostgreSQL repository

TaskService → PrioritySuggester interface
                        ↓
                  Resty client
```

`ginapi`, `postgresrepo` и `priorityclient` — детали доставки и инфраструктуры. Пакет `taskservice` не должен импортировать Gin, Resty, `database/sql` или конкретный PostgreSQL-драйвер. Благодаря этому unit-тесты service остаются быстрыми и не требуют HTTP-сервера либо БД.

## Контракт HTTP API

Зафиксируйте в README текущий контракт. В учебной версии он может выглядеть так:

| Метод | Путь | Описание | Успех |
| --- | --- | --- | --- |
| `GET` | `/healthz` | Быстрая проверка работы HTTP-сервера | `200` |
| `GET` | `/tasks` | Список задач | `200` |
| `POST` | `/tasks` | Создать задачу | `201` |
| `POST` | `/tasks/:id/complete` | Отметить задачу выполненной | `200` |
| `DELETE` | `/tasks/:id` | Удалить задачу | `204` |

Единый формат ошибки помогает клиентам API:

```json
{
  "error": "задача не найдена"
}
```

Базовое соответствие статусов:

| Ситуация | Статус |
| --- | --- |
| Некорректный JSON, ID или входные данные | `400 Bad Request` |
| Задача не найдена | `404 Not Found` |
| Задача создана | `201 Created` |
| Успешное удаление без body | `204 No Content` |
| Неожиданная внутренняя ошибка | `500 Internal Server Error` |

Не меняйте статусы или формат ошибки «по ходу» без обновления тестов и README: для внешнего клиента это публичный контракт.

## README проекта

README — первая точка входа. Он должен позволять запустить проект без личных объяснений автора. Минимальная структура:

```md
# Task Manager API

Краткое описание: JSON API для управления задачами на Go, Gin и PostgreSQL.

## Возможности

- создание, просмотр, завершение и удаление задач;
- PostgreSQL и Goose-миграции;
- Docker Compose для локального запуска;
- health-check и graceful shutdown.

## Требования

- Go версии из go.mod;
- Docker Desktop / Docker Engine и Docker Compose.

## Быстрый запуск

...

## Конфигурация

...

## Миграции

...

## API

...

## Проверки

...
```

Укажите настоящие команды и реальные имена переменных окружения именно вашего репозитория. README с командами, которые не запускались после последнего изменения, вводит в заблуждение сильнее, чем отсутствующий README.

## Быстрый локальный запуск

Ниже — рекомендуемый workflow для проекта с Docker Compose:

```bash
git clone <URL-вашего-репозитория>
cd task-manager-api

cp .env.example .env
docker compose up --build -d
docker compose ps
```

Проверьте API:

```bash
curl -i http://localhost:8080/healthz
```

Если в Compose API применяет миграции во время старта, после `healthy` можно сразу вызывать `/tasks`. Если миграции запускаются отдельной командой, явно задокументируйте её:

```bash
goose -dir migrations postgres "$DATABASE_URL" up
```

Для команды на компьютере разработчика `DATABASE_URL` использует `localhost`; внутри API-container — имя Compose-сервиса `postgres`. Не смешивайте эти две строки подключения.

Остановка окружения, сохраняющая данные БД:

```bash
docker compose down
```

Полный сброс local state:

```bash
docker compose down -v
```

Вторая команда удаляет named volume PostgreSQL. Укажите это предупреждение прямо в README.

## Примеры HTTP-запросов

### Health-check

```bash
curl -i http://localhost:8080/healthz
```

Ожидается `200 OK`:

```json
{"status":"ok"}
```

### Создание задачи

```bash
curl -i -X POST http://localhost:8080/tasks \
  -H 'Content-Type: application/json' \
  -H 'X-Request-ID: demo-create-1' \
  -d '{"title":"Подготовить README","priority":2}'
```

Ожидается `201 Created` и задача с ID, временными метками и `completed: false`:

```json
{
  "id": 1,
  "title": "Подготовить README",
  "priority": 2,
  "completed": false,
  "created_at": "2026-10-14T12:00:00Z",
  "updated_at": "2026-10-14T12:00:00Z"
}
```

Сохраните ID в shell-переменную, чтобы не подставлять его вручную:

```bash
TASK_ID=1
```

### Список задач

```bash
curl -i http://localhost:8080/tasks
```

Успешный пустой список — это JSON-массив, а не `null`:

```json
[]
```

### Завершение задачи

```bash
curl -i -X POST "http://localhost:8080/tasks/${TASK_ID}/complete"
```

### Удаление задачи

```bash
curl -i -X DELETE "http://localhost:8080/tasks/${TASK_ID}"
```

При `204 No Content` body отсутствует — не пытайтесь декодировать JSON-ответ там, где контракт его не обещает.

### Ошибочный запрос

```bash
curl -i -X POST http://localhost:8080/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"   ","priority":0}'
```

Ожидается `400 Bad Request` и безопасное JSON-сообщение. Текст SQL-ошибки, DSN, stack trace или panic не должны попадать в response.

## Миграции и DBeaver

После старта PostgreSQL примените миграции к development-базе и проверьте их состояние:

```bash
goose -dir migrations postgres "$DATABASE_URL" status
goose -dir migrations postgres "$DATABASE_URL" up
```

В DBeaver подключайтесь к PostgreSQL с хоста через `localhost:${POSTGRES_PORT}`. После миграции проверьте:

```text
Databases → task_manager → Schemas → public → Tables
```

Там должны быть `tasks` и `goose_db_version`. Используйте DBeaver для `SELECT` и диагностики, а изменения схемы записывайте только новыми Goose-миграциями.

## Проверки качества перед merge

Перед pull request выполните из корня API:

```bash
go mod tidy
git diff --exit-code -- go.mod go.sum
go vet ./...
go test ./...
go test -race ./...
docker compose config
docker build -t task-manager-api:local .
```

Если поднята отдельная тестовая PostgreSQL-база:

```bash
export TEST_DATABASE_URL='postgresql://task_manager:local-password@localhost:5432/task_manager_test?sslmode=disable'
goose -dir migrations postgres "$TEST_DATABASE_URL" up
go test -race -count=1 -tags=integration ./internal/postgresrepo/...
```

Проверьте, что URL действительно ведёт в `*_test` базу. Не запускайте destructive integration-тесты против development или production БД.

## Итоговый checklist

### Код и архитектура

- [ ] `main` собирает зависимости, а не содержит бизнес-логику.
- [ ] Gin используется только в HTTP-слое.
- [ ] Service зависит от интерфейсов repository и внешнего клиента.
- [ ] SQL находится в PostgreSQL-репозитории и использует `$1`, `$2`.
- [ ] Каждый внешний вызов и SQL-операция получает `context.Context`.
- [ ] Ошибки не сравниваются по тексту; используются `errors.Is` и `errors.As`.

### HTTP API

- [ ] Маршруты, статусы и JSON-форматы описаны в README.
- [ ] Невалидный ввод возвращает `400`, отсутствующий ресурс — `404`.
- [ ] Внутренние ошибки логируются, но не раскрывают секреты и SQL-детали клиенту.
- [ ] Есть `/healthz`, request ID, access log и recovery middleware.

### Данные и конфигурация

- [ ] Схема БД изменяется только Goose-миграциями.
- [ ] `DATABASE_URL`, пароли и токены не лежат в Git или логах.
- [ ] `.env.example` содержит безопасные примеры, а `.env` находится в `.gitignore`.
- [ ] PostgreSQL использует named volume локально и не опубликован наружу в production.

### Проверки и доставка

- [ ] Unit, race и PostgreSQL integration-тесты проходят.
- [ ] Dockerfile собирается; `docker compose config` валиден.
- [ ] CI запускает обязательные проверки на pull request.
- [ ] Production получает immutable SHA image, а не только `latest`.
- [ ] После deploy проверяется `/healthz`, известен предыдущий рабочий SHA и способ rollback.

## Демонстрация проекта

Перед показом проекта другому человеку начните с чистого окружения или отдельного Docker volume. Пройдите сценарий без ручных исправлений:

1. клонировать проект;
2. создать `.env` из `.env.example`;
3. поднять Compose;
4. применить миграции, если они не запускаются автоматически;
5. вызвать health-check;
6. создать, получить, завершить и удалить задачу;
7. посмотреть изменения в DBeaver;
8. запустить проверки качества;
9. остановить окружение, не удаляя volume.

Если один из шагов требует устной подсказки автора, добавьте её в README или автоматизируйте. Это лучший способ заметить недостающую документацию.

## Куда развивать проект

Рабочий CRUD API — хорошая база, но не повод добавлять всё сразу. Выберите следующую задачу по реальной потребности и спроектируйте контракт, миграции, тесты и наблюдаемость до реализации.

### Аутентификация и авторизация

Добавьте пользователей, безопасное хранение паролей, выдачу/проверку токенов и middleware авторизации. До реализации определите модель прав: кто видит и меняет какую задачу. Не ограничивайтесь проверкой, что заголовок `Authorization` просто существует.

### Фильтрация, сортировка и пагинация

Для большого списка задач добавьте query-параметры, например `completed`, `priority`, `limit` и cursor. Все динамические поля сортировки выбирайте из whitelist; лимит ограничивайте сверху. Для стабильной пагинации определите порядок, например `id ASC`.

### Метрики и tracing

Логи помогают расследовать событие, но не показывают общую картину. Следующий шаг — latency, число запросов, ошибки и состояние пула БД через metrics. Для запросов через несколько сервисов добавляют distributed tracing. Не записывайте в labels высококардинальные значения вроде ID задачи или request ID.

### Rate limiting

Защитите API от чрезмерного числа запросов. Определите единицу лимита — IP, пользователь, API-key или endpoint — и ответ `429 Too Many Requests`. Лимитер в памяти не подойдёт для нескольких экземпляров API без общей координации.

### Другие возможные улучшения

- soft delete и восстановление задачи;
- теги, дедлайны и напоминания;
- фоновая обработка и outbox-паттерн;
- OpenAPI-спецификация и генерация клиента;
- backup и восстановление PostgreSQL;
- более строгие production политики образов и supply-chain security.

## Итог курса

Вы прошли путь от первых переменных и функций Go до backend-приложения с HTTP API, PostgreSQL, Docker и CI/CD. Самое ценное не конкретный список библиотек, а инженерный цикл: сформулировать контракт, отделить слои, написать тесты, проверить реальную инфраструктуру, наблюдать работу и безопасно доставить изменение.

Дальше можно переходить к продвинутым темам Go или развивать Task Manager по одному осмысленному улучшению за раз.

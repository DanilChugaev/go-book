---
prev: /guide/configuration-and-lifecycle/best-practices.md
next: /guide/docker/tests.md
---

# Docker и локальное окружение

## Цель урока

Научиться упаковывать Task Manager API в Docker-образ, запускать API и PostgreSQL через Docker Compose, сохранять данные базы в volume, проверять её готовность через health-check и подготавливать повторяемое локальное окружение для следующей главы про SQL.

До этой главы для запуска проекта нужны были Go, переменные окружения и локальные зависимости. Docker описывает окружение в файлах репозитория: другой разработчик может получить одинаковые API и PostgreSQL без ручной установки конкретных версий в систему.

::: tip Что будет сделано сейчас
PostgreSQL уже запускается в Compose, но Task Manager пока продолжает использовать in-memory `TaskStore`. Подключение через `database/sql`, таблицы и миграции появятся в следующей главе. Это разделение помогает отлаживать инфраструктуру и SQL отдельно.
:::

## Основные понятия

| Термин | Значение |
| --- | --- |
| **Image** | неизменяемый шаблон файловой системы и команды запуска |
| **Container** | запущенный экземпляр image |
| **Dockerfile** | рецепт сборки image |
| **Volume** | хранилище данных вне жизненного цикла container |
| **Port mapping** | публикация порта container на компьютере разработчика |
| **Docker Compose** | описание нескольких связанных сервисов в одном YAML-файле |

Образ не равен container: один image можно запускать много раз. Удаление container не обязательно удаляет image, а удаление container PostgreSQL без volume удалит и его данные.

## Учебный проект главы

В репозитории создан самостоятельный минимальный пример:

```text
examples/32/task-manager-api/
├── cmd/api/main.go
├── Dockerfile
├── .dockerignore
├── compose.yaml
├── .env.example
└── go.mod
```

Это намеренно небольшой API с `GET /healthz`. Он позволяет проверить Docker-контракт до того, как в следующей главе появится настоящий PostgreSQL-репозиторий. Перед командами перейдите в эту директорию:

```bash
cd examples/32/task-manager-api
```

## Проверка Docker

Проверьте, что Docker Desktop или Docker Engine запущен:

```bash
docker version
docker compose version
```

Если клиент Docker установлен, но демон недоступен, команды сборки покажут ошибку подключения. На macOS и Windows обычно нужно открыть Docker Desktop и дождаться статуса **Running**.

## Multi-stage Dockerfile для Go

Файл `examples/32/task-manager-api/Dockerfile` использует две стадии:

```dockerfile
# syntax=docker/dockerfile:1

FROM golang:1.24-alpine AS build

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/task-manager-api ./cmd/api

FROM alpine:3.21

RUN addgroup -S app && adduser -S -G app app
USER app

COPY --from=build /out/task-manager-api /task-manager-api

EXPOSE 8080
ENTRYPOINT ["/task-manager-api"]
```

Первая стадия содержит компилятор Go и зависимости, вторая — только скомпилированный бинарный файл и минимальную ОС. Поэтому конечный image не содержит исходный код, Go toolchain и кэш модулей.

### Порядок `COPY` и кэш

Сначала копируются `go.mod`/`go.sum`, затем выполняется `go mod download`. Docker может использовать этот слой повторно, если зависимости не изменились. Только после этого копируется исходный код.

Когда в проекте появится `go.sum`, добавьте его в команду:

```dockerfile
COPY go.mod go.sum ./
RUN go mod download
```

### Почему `CGO_ENABLED=0`

Текущий пример не использует C-зависимости. Статический бинарник проще запустить в компактном final image. Не добавляйте эту настройку механически в любой проект: драйверы, библиотеки с CGO или системные сертификаты могут требовать другой образ и конфигурацию.

### Непривилегированный пользователь

`USER app` не позволяет приложению работать от root внутри container. Это не заменяет другие меры безопасности, но снижает последствия ошибки в приложении.

`EXPOSE 8080` документирует порт приложения внутри image. Сам по себе `EXPOSE` не открывает порт на компьютере: публикацию задаёт Compose через `ports`.

## `.dockerignore`

При `docker build .` Docker отправляет build context демону. В `.dockerignore` перечислено то, что не должно попасть в context:

```dockerignore
.git
.env
.env.*
*.md
bin
tmp
coverage.out
```

Это ускоряет сборку и не даёт случайно скопировать локальные секреты в image. `.dockerignore` не заменяет `.gitignore`: первый управляет контекстом Docker, второй — индексом Git.

## Сборка и запуск одного container

Из `examples/32/task-manager-api`:

```bash
docker build -t task-manager-api:local .

docker run --rm -p 8080:8080 task-manager-api:local
```

В другом терминале проверьте API:

```bash
curl -i http://localhost:8080/healthz
```

Ожидаемый результат:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"ok"}
```

Остановить foreground-container можно через Ctrl+C. Флаг `--rm` удалит container после остановки, но image останется для следующих запусков.

## Docker Compose

Task Manager состоит из нескольких сервисов. `examples/32/task-manager-api/compose.yaml` описывает API, PostgreSQL и volume:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-task_manager}:${POSTGRES_PASSWORD:-local-development-only}@postgres:5432/${POSTGRES_DB:-task_manager}?sslmode=disable
    ports:
      - "${API_PORT:-8080}:8080"
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-task_manager}
      POSTGRES_USER: ${POSTGRES_USER:-task_manager}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-local-development-only}
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

Compose создаёт внутреннюю сеть. Внутри неё API обращается к БД по hostname **`postgres`** — имени сервиса, а не `localhost`:

```text
postgresql://task_manager:...@postgres:5432/task_manager?sslmode=disable
```

`localhost` внутри API-container означает сам API-container, а не компьютер разработчика и не PostgreSQL. Это одна из самых частых ошибок при переходе на Docker.

## Локальные переменные Compose

Скопируйте шаблон:

```bash
cp .env.example .env
```

Файл `.env` служит Compose для подстановки значений `${...}`. Он содержит только учебные локальные значения и не должен попадать в Git. Для Docker Compose shell-переменные имеют более высокий приоритет, поэтому можно временно переопределить порт:

```bash
API_PORT=8081 docker compose up --build
```

В Docker и production передавайте реальные secrets через безопасный механизм платформы. Пароль `local-development-only` в примере существует исключительно для локальной учебной среды.

## PostgreSQL, volume и health-check

PostgreSQL хранит каталог данных в `/var/lib/postgresql/data`. Named volume:

```yaml
volumes:
  - postgres-data:/var/lib/postgresql/data
```

переживает пересоздание container. Это означает:

```bash
docker compose down
docker compose up -d
```

не удалит данные базы.

Полное удаление окружения **вместе с данными**:

```bash
docker compose down -v
```

Используйте `-v` осознанно: для локальной разработки это удобный способ начать с чистой БД, но команда удаляет volume без возможности восстановления.

Health-check ждёт, пока PostgreSQL начнёт принимать подключения:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
  interval: 5s
  timeout: 3s
  retries: 10
```

Двойной `$` нужен, чтобы Compose передал `$POSTGRES_USER` внутрь container, а не подставил переменную на компьютере разработчика. `depends_on.condition: service_healthy` запускает API после успешного health-check БД. Это не заменяет корректную обработку ошибок подключения в самом приложении: в production зависимость может стать недоступной уже после запуска.

## Порт PostgreSQL только для разработки

В Compose задано:

```yaml
ports:
  - "127.0.0.1:${POSTGRES_PORT:-5432}:5432"
```

Это делает PostgreSQL доступным с вашего компьютера на `localhost:5432`, например для DBeaver в следующей главе, но не публикует его на внешние сетевые интерфейсы. API внутри Compose всё равно использует `postgres:5432` и не зависит от этой публикации порта.

В production БД обычно не публикуют наружу через `ports`; к ней обращаются только сервисы во внутренней сети.

## Основные команды Compose

Запустить или пересобрать окружение в foreground:

```bash
docker compose up --build
```

Запустить в фоне:

```bash
docker compose up --build -d
```

Проверить статус и health:

```bash
docker compose ps
```

Посмотреть логи всех сервисов или только API:

```bash
docker compose logs -f
docker compose logs -f api
```

Проверить API:

```bash
curl -i http://localhost:8080/healthz
```

Выполнить `psql` внутри PostgreSQL-container:

```bash
docker compose exec postgres psql -U task_manager -d task_manager
```

Остановить и удалить containers и сеть, оставив volume:

```bash
docker compose down
```

## Подготовка к SQL-главе

После `docker compose up -d` инфраструктура следующей главы уже известна:

| Настройка приложения | Внутри Compose | На компьютере разработчика |
| --- | --- | --- |
| Host | `postgres` | `localhost` |
| Port | `5432` | `${POSTGRES_PORT:-5432}` |
| Database | `task_manager` | `task_manager` |
| User | `task_manager` | `task_manager` |

В следующей главе добавим PostgreSQL-драйвер, `database/sql`, `PingContext`, миграции и репозиторий. DBeaver будет подключаться к `localhost`, а API-container — к сервису `postgres`.

## Проверка Docker-файлов без запуска

До запуска Docker можно проверить развёрнутый Compose-конфиг:

```bash
docker compose config
```

Команда подставит значения `.env` и defaults, покажет итоговые порты, volumes и переменные. Это помогает найти ошибку YAML или переменной до создания containers.

## Частые ошибки

### Писать `localhost` в DATABASE_URL API

```text
postgresql://task_manager:password@localhost:5432/task_manager
```

Для API-container это неверно: `localhost` указывает на него самого. Используйте имя Compose-сервиса `postgres`.

### Хранить данные только в файловой системе container

Без named volume данные исчезнут после пересоздания PostgreSQL-container. Используйте volume для каталога данных базы.

### Добавить `.env` в image

```dockerfile
COPY . .
```

без `.dockerignore` может скопировать локальные секреты в build context и image layer. Добавьте `.env` и `.env.*` в `.dockerignore`.

### Считать `depends_on` полной гарантией

Без `condition: service_healthy` обычный `depends_on` задаёт только порядок старта. Даже с health-check приложение обязано обрабатывать ошибки БД: она может перезапуститься позже.

### Использовать `docker compose down -v` без предупреждения

Команда полезна, когда нужна чистая база, но удаляет named volumes. Для обычной остановки используйте `docker compose down`.

## Дальше

Локальное окружение теперь воспроизводимо: API и PostgreSQL поднимаются одной командой, а данные базы сохраняются в volume. Далее подключим API к этой базе через `database/sql`, создадим таблицы и проверим их в DBeaver.

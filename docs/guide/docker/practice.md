---
prev: /guide/docker/tests.md
next: /guide/docker/best-practices.md
---

# Задания: Docker-окружение Task Manager API

Используйте учебный проект из `examples/32/task-manager-api`. Сначала проверьте его локально через Go, затем соберите image и поднимите API вместе с PostgreSQL. База в этой главе — инфраструктура: не добавляйте `database/sql` до следующей главы.

## Задание 1. Проверьте минимальный API без Docker

Перейдите в каталог примера, запустите API через Go и проверьте `GET /healthz` с `curl`.

```bash
cd examples/32/task-manager-api
go run ./cmd/api
```

**Критерии проверки:**

- `go vet ./...` проходит;
- API запускается на `:8080`;
- `/healthz` возвращает `200` и JSON `{"status":"ok"}`;
- вы можете остановить процесс через Ctrl+C;
- в этом шаге PostgreSQL не требуется.

## Задание 2. Разберите и соберите Dockerfile

Откройте `Dockerfile`, найдите build и final стадии. Соберите image:

```bash
docker build -t task-manager-api:local .
```

Запустите его отдельно:

```bash
docker run --rm -p 8080:8080 task-manager-api:local
```

В другом терминале выполните `curl -i http://localhost:8080/healthz`.

**Критерии проверки:**

- Dockerfile содержит минимум две стадии `FROM`;
- бинарник копируется в final stage через `COPY --from=build`;
- final stage не запускается от root;
- API отвечает из container;
- container удаляется после остановки благодаря `--rm`.

<details>
  <summary>Подсказка</summary>

Проверить размер и параметры image можно так:

```bash
docker image inspect task-manager-api:local
docker image ls task-manager-api
```
</details>

## Задание 3. Проверьте `.dockerignore`

Создайте локальный `.env` из шаблона и убедитесь, что `.env` и `.env.*` есть в `.dockerignore`. Объясните разницу между `.gitignore` и `.dockerignore`.

```bash
cp .env.example .env
```

**Критерии проверки:**

- `.env` не отображается в `git status`;
- `.env` и `.env.*` перечислены в `.dockerignore`;
- `.git` не отправляется в build context;
- вы не добавляете локальный пароль в Dockerfile;
- изменения source code всё ещё попадают в image после `docker build`.

## Задание 4. Поднимите API и PostgreSQL через Compose

Проверьте развёрнутую конфигурацию и запустите сервисы в фоне:

```bash
docker compose config
docker compose up --build -d
docker compose ps
```

Проверьте API и логи:

```bash
curl -i http://localhost:8080/healthz
docker compose logs -f api
```

**Критерии проверки:**

- сервисы `api` и `postgres` имеют статус running;
- PostgreSQL становится `healthy`;
- API стартует после health-check PostgreSQL;
- API доступен на порту из `API_PORT`;
- `DATABASE_URL` использует hostname `postgres`, а не `localhost`;
- API пока не обязан открывать подключение к БД.

## Задание 5. Проверьте PostgreSQL и сохранность volume

Откройте `psql` в database-container:

```bash
docker compose exec postgres psql -U task_manager -d task_manager
```

В `psql` выполните:

```sql
CREATE TABLE docker_check (id integer PRIMARY KEY);
INSERT INTO docker_check (id) VALUES (1);
SELECT * FROM docker_check;
```

Выйдите через `\q`, остановите окружение без `-v`, затем поднимите снова и убедитесь, что строка сохранилась.

```bash
docker compose down
docker compose up -d
docker compose exec postgres psql -U task_manager -d task_manager -c 'SELECT * FROM docker_check;'
```

**Критерии проверки:**

- таблица и строка переживают `docker compose down`;
- named volume подключён к `/var/lib/postgresql/data`;
- вы понимаете, что `docker compose down -v` удалит эту строку;
- порт PostgreSQL опубликован только на `127.0.0.1`;
- в репозиторий не попадают данные volume.

## Задание 6. Подготовьте окружение для SQL-главы

Дополните `.env.example` комментариями о назначении `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`. Выведите в README примера или в заметках две строки подключения: для API-container и для DBeaver на хосте.

**Критерии проверки:**

- внутри Compose host — `postgres`;
- для DBeaver host — `localhost`;
- порт, база и пользователь совпадают с `.env`;
- password не попадает в Git вне безопасного учебного примера;
- указано, что в production PostgreSQL-порт обычно не публикуют наружу.

## Полный исходный код

После выполнения упражнений сверяйтесь с готовой Docker-конфигурацией сквозного проекта.

<ExampleSource
  path="examples/32/task-manager-api"
  description="Dockerfile, Compose-конфигурация и точка входа Task Manager API"
/>

## Проверьте себя

Перед SQL-главой убедитесь, что вы можете:

- отличить image, container и volume;
- собрать и проверить multi-stage Go image;
- объяснить назначение `.dockerignore`;
- запустить API и PostgreSQL одной командой;
- объяснить разницу `postgres:5432` и `localhost:5432`;
- сохранить или осознанно удалить данные volume.

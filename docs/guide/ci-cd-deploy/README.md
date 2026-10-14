---
prev: /guide/sql-postgresql/best-practices.md
next: /guide/ci-cd-deploy/tests.md
---

# CI/CD и деплой

## Цель урока

Настроить для Task Manager API GitHub Actions: автоматически запускать проверку Go-кода и PostgreSQL integration-тесты, собирать Docker-образ, публиковать проверенный образ в GitHub Container Registry (GHCR) и безопасно доставлять его на VPS через Docker Compose с health-check и возможностью отката.

**CI** (continuous integration) отвечает на вопрос «можно ли объединить это изменение?»: собирает проект и запускает проверки. **CD** (continuous delivery/deployment) отвечает на вопрос «как доставить уже проверенный образ в окружение?». Сначала сделаем CI надёжным, затем отдельно подготовим delivery и deployment.

```text
pull request / push
        ↓
GitHub Actions: vet → unit/race → PostgreSQL integration → Docker build
        ↓
GHCR: неизменяемый Docker image по SHA commit
        ↓
VPS: docker compose pull/up → /healthz → rollback при проблеме
```

## Что должно быть до CI

Финальный Task Manager API должен содержать:

- `go.mod` и `go.sum`;
- unit-тесты, запускаемые через `go test ./...`;
- миграции Goose в `migrations/`;
- integration-тесты PostgreSQL с build tag `integration`;
- `Dockerfile`;
- endpoint `GET /healthz`;
- `compose.production.yaml` для VPS.

Не копируйте workflow в учебник как есть, если пути и имя модуля отличаются. Сначала запустите все команды локально — CI должен автоматизировать уже работающий workflow, а не заменять отладку.

## CI: unit-тесты, race detector и Docker build

Создайте `.github/workflows/ci.yml` в репозитории **Task Manager API**:

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:

permissions:
  contents: read

jobs:
  unit:
    name: Unit tests and static checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
          cache: true

      - name: Check module files
        run: |
          go mod tidy
          git diff --exit-code -- go.mod go.sum

      - name: Vet
        run: go vet ./...

      - name: Unit tests with race detector
        run: go test -race ./...

      - name: Build API
        run: go build ./cmd/api

  docker:
    name: Docker build
    runs-on: ubuntu-latest
    needs: unit
    steps:
      - uses: actions/checkout@v4

      - name: Validate Compose configuration
        working-directory: examples/task-manager-api
        run: docker compose config

      - name: Build image
        working-directory: examples/task-manager-api
        run: docker build --tag task-manager-api:ci .
```

`go mod tidy` **может менять** `go.mod` и `go.sum`, поэтому сразу после него выполняется `git diff --exit-code`. Так CI не только сообщает, что файлы модулей неактуальны, но и не оставляет незаметное изменение в runner.

Docker build зависит от `unit`: нет смысла тратить время на сборку образа, если код не прошёл статический анализ или тесты. В production workflow можно использовать cache BuildKit, но сначала добейтесь воспроизводимой простой сборки.

## PostgreSQL integration-тесты в GitHub Actions

Для integration-тестов используем service container PostgreSQL. Он живёт только во время job и не требует Docker Compose или отдельной тестовой инфраструктуры:

```yaml
  integration:
    name: PostgreSQL integration tests
    runs-on: ubuntu-latest
    needs: unit
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: task_manager_test
          POSTGRES_USER: task_manager
          POSTGRES_PASSWORD: test-password-only
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U task_manager -d task_manager_test"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 10

    env:
      TEST_DATABASE_URL: postgresql://task_manager:test-password-only@localhost:5432/task_manager_test?sslmode=disable

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
          cache: true

      - name: Install Goose
        run: go install github.com/pressly/goose/v3/cmd/goose@v3.29.0

      - name: Apply migrations
        run: $HOME/go/bin/goose -dir migrations postgres "$TEST_DATABASE_URL" up

      - name: Integration tests
        run: go test -race -count=1 -tags=integration ./internal/postgresrepo/...
```

Пароль в этом примере не секрет: это одноразовая тестовая БД внутри ephemeral runner. Настоящие пароли, токены и SSH-ключи никогда не записывают прямо в workflow — для них используются GitHub Actions Secrets.

Тесты должны обращаться только к `TEST_DATABASE_URL`. Проверка имени базы с суффиксом `_test` из прошлой главы остаётся дополнительной защитой от разрушительного `TRUNCATE` не той базы.

`-count=1` отключает тестовый кэш: integration-тест действительно выполняется против service container. Команда `go test -race` медленнее обычной, но для небольшого backend-проекта это оправданная проверка конкурентных ошибок.

## Матрица проверок

| Job | Что подтверждает | Чего не подтверждает |
| --- | --- | --- |
| `unit` | компиляцию, unit-тесты, race detector, актуальность модулей | реальный SQL PostgreSQL |
| `integration` | миграции, SQL, constraints и PostgreSQL-репозиторий | production-конфигурацию VPS |
| `docker` | Dockerfile и Compose YAML | работоспособность приложения после запуска образа |
| deployment | доставку конкретного образа и `/healthz` | полную бизнес-нагрузку production |

Каждый job нужен для отдельного риска. Не заменяйте PostgreSQL-тесты проверкой `docker build`, а health-check после деплоя — unit-тестами.

## Публикация образа в GHCR

GitHub Container Registry хранит Docker-образы рядом с репозиторием. Публикуйте только образ, прошедший CI, и маркируйте его неизменяемым SHA commit. `latest` удобен для просмотра, но не годится как единственный production-тег: по нему нельзя понять, какой именно код работает и как откатиться.

Создайте `.github/workflows/publish-image.yml`:

```yaml
name: Publish image

on:
  push:
    branches: [master]

permissions:
  contents: read
  packages: write

env:
  # GitHub image names должны быть lowercase.
  IMAGE_NAME: ghcr.io/danilchugaev/task-manager-api

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_NAME }}
          tags: |
            type=raw,value=latest
            type=sha,format=long

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

Замените `danilchugaev/task-manager-api` на lowercase-имя владельца и образа вашего конечного API. Если registry package закрыт, VPS понадобится токен с разрешением `read:packages`; не используйте personal token с избыточными правами.

::: warning Не публикуйте образ до CI
Самостоятельный publish workflow запускается на `push`, но GitHub Actions не гарантирует порядок разных workflow. Для строгого правила «publish только после зелёного CI» объедините CI и publish в один workflow: job `publish` должен иметь `needs: [unit, integration, docker]`. Альтернатива — запускать publish только после защищённого merge в `master`, где branch protection требует успешный CI.
:::

Практический вариант одного workflow:

```yaml
  publish:
    needs: [unit, integration, docker]
    if: github.event_name == 'push' && github.ref == 'refs/heads/master'
    # login, metadata и build-push-action здесь
```

Это безопаснее для первого production-проекта, потому что зависимость job выражена явно.

## Production Compose на VPS

На VPS создайте каталог, например `/opt/task-manager`, и поместите туда `compose.production.yaml` и закрытый `.env`:

```yaml
services:
  api:
    image: ${IMAGE:?IMAGE is required}
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      # Reverse proxy на том же сервере обращается к API локально.
      - "127.0.0.1:8080:8080"
    restart: unless-stopped

  postgres:
    image: postgres:17-alpine
    env_file: .env
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

volumes:
  postgres-data:
```

В production у PostgreSQL **нет** `ports`: он доступен только в сети Compose. API опубликован лишь на `127.0.0.1`; внешний HTTPS-трафик принимает отдельный reverse proxy (например, Caddy или Nginx). TLS, домен и reverse proxy заслуживают отдельной настройки, поэтому не выдавайте HTTP-порт API напрямую в интернет как финальное решение.

Пример закрытого `/opt/task-manager/.env`:

```dotenv
POSTGRES_DB=task_manager
POSTGRES_USER=task_manager
POSTGRES_PASSWORD=replace-with-a-long-random-secret
DATABASE_URL=postgresql://task_manager:replace-with-a-long-random-secret@postgres:5432/task_manager?sslmode=disable
PRIORITY_SERVICE_URL=https://priority.example.com
SHUTDOWN_TIMEOUT=10s
```

Файл принадлежит пользователю деплоя и имеет ограниченные права:

```bash
chmod 600 /opt/task-manager/.env
```

Не коммитьте production `.env`, не копируйте его в Docker image и не выводите командой `docker compose config` в публичные CI-логи: результат содержит подставленные secrets.

## Первый деплой и проверка

На VPS сначала авторизуйтесь в GHCR. Для private image создайте отдельный токен только с `read:packages` и передайте его через stdin:

```bash
printf '%s' "$GHCR_READ_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
```

Затем разверните конкретный immutable image:

```bash
cd /opt/task-manager
export IMAGE=ghcr.io/danilchugaev/task-manager-api:sha-0123456789abcdef
docker compose -f compose.production.yaml pull api
docker compose -f compose.production.yaml up -d

curl --fail --retry 10 --retry-connrefused --retry-delay 1 \
  http://127.0.0.1:8080/healthz
```

`curl --fail` возвращает ненулевой код на `4xx`/`5xx`, поэтому команда подходит для проверки после delivery. Сохраняйте SHA-тег успешной версии в release notes или deploy-логе.

## Откат

Откат должен использовать предыдущий известный рабочий immutable тег, а не `latest`:

```bash
cd /opt/task-manager
export IMAGE=ghcr.io/danilchugaev/task-manager-api:sha-previous-known-good
docker compose -f compose.production.yaml pull api
docker compose -f compose.production.yaml up -d --no-deps api

curl --fail http://127.0.0.1:8080/healthz
```

Откат образа не откатывает схему PostgreSQL. Поэтому миграции должны быть backward-compatible в течение времени, когда возможен rollback: например, сначала добавить nullable столбец, затем обновить приложение, а удалять старый столбец отдельным поздним релизом.

## Автоматический deployment workflow

Когда ручной деплой понятен и проверен, его можно запускать из GitHub Actions. Не добавляйте ключ VPS в репозиторий. Создайте GitHub Secrets:

| Secret | Назначение |
| --- | --- |
| `VPS_HOST` | hostname или IP сервера |
| `VPS_USER` | отдельный пользователь деплоя без root-логина |
| `VPS_SSH_PRIVATE_KEY` | приватный SSH-ключ только для deploy user |
| `VPS_KNOWN_HOSTS` | заранее проверенный fingerprint/known_hosts сервера |

Фрагмент `.github/workflows/deploy.yml`:

```yaml
  deploy:
    needs: publish
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Configure SSH
        env:
          SSH_KEY: ${{ secrets.VPS_SSH_PRIVATE_KEY }}
          KNOWN_HOSTS: ${{ secrets.VPS_KNOWN_HOSTS }}
        run: |
          install -m 700 -d ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts

      - name: Deploy immutable image
        env:
          HOST: ${{ secrets.VPS_HOST }}
          USER: ${{ secrets.VPS_USER }}
          IMAGE: ghcr.io/danilchugaev/task-manager-api:sha-${{ github.sha }}
        run: |
          ssh "$USER@$HOST" "
            set -eu
            cd /opt/task-manager
            export IMAGE='$IMAGE'
            docker compose -f compose.production.yaml pull api
            docker compose -f compose.production.yaml up -d --no-deps api
            curl --fail --retry 10 --retry-connrefused --retry-delay 1 http://127.0.0.1:8080/healthz
          "
```

Environment `production` позволяет настроить required reviewers и отдельные environment secrets в GitHub. `VPS_KNOWN_HOSTS` важен: не заменяйте проверку хоста на `StrictHostKeyChecking=no`, иначе workflow становится уязвимым к подмене SSH-сервера.

Автоматический deploy не отменяет rollback-план. Перед включением workflow вручную проверьте: доступ VPS к GHCR, права deploy user на Docker, наличие `.env`, volume PostgreSQL, reverse proxy и health-check.

## Частые ошибки

### Заменить CI одним `go test ./...`

Так не проверятся `go vet`, гонки, миграции, SQL-привязка к PostgreSQL и Dockerfile. Разделите unit, integration и image build на явные jobs.

### Передать production пароль в YAML workflow

```yaml
env:
  DATABASE_URL: postgresql://user:real-password@host/database
```

Это секрет в истории Git. Используйте GitHub Secrets для CI/CD и закрытый `.env` с правами `600` на VPS.

### Деплоить `latest`

`latest` меняется при каждом publish и не задаёт точную версию. Деплойте SHA-тег и сохраняйте предыдущий рабочий SHA для rollback.

### Публиковать PostgreSQL наружу на VPS

```yaml
ports:
  - "5432:5432"
```

Это увеличивает поверхность атаки. Для API и PostgreSQL достаточно внутренней Compose-сети; внешний доступ организуют только при осознанной необходимости и защите.

### Откатывать код после несовместимой миграции

Предыдущий image может ожидать старую схему. Делайте миграции совместимыми в несколько этапов и планируйте их вместе с rollback.

## Дальше

Task Manager теперь имеет CI, проверяемый image и понятный путь доставки на VPS. Последняя глава соберёт все части проекта вместе: структура репозитория, README, запуск, примеры API и итоговый чек-лист качества.

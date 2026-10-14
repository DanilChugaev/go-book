---
prev: /guide/ci-cd-deploy/tests.md
next: /guide/ci-cd-deploy/best-practices.md
---

# Задания: доставка Task Manager API

Настройте GitHub Actions и delivery-процесс для финального Task Manager API. Выполняйте задания в отдельном репозитории API, а не в репозитории учебника: этот сайт не содержит Go-модуль и не должен пытаться запускать Go CI.

## Задание 1. Создайте базовый CI workflow

Создайте `.github/workflows/ci.yml`, который запускается на `push` в `master` и `pull_request`. Добавьте job с checkout, `setup-go`, `go mod tidy`, проверкой diff, `go vet`, `go test -race` и `go build ./cmd/api`.

**Критерии проверки:**

- workflow имеет минимальное `contents: read` разрешение;
- версия Go читается из `go.mod`;
- cache Go включён;
- `go mod tidy` не меняет незакоммиченные module-файлы;
- `go vet ./...` и `go test -race ./...` проходят;
- сборка API проверяется до merge.

<details>
  <summary>Подсказка</summary>

```yaml
- name: Check module files
  run: |
    go mod tidy
    git diff --exit-code -- go.mod go.sum
```
</details>

## Задание 2. Добавьте PostgreSQL integration job

Добавьте service container `postgres:17-alpine`, тестовую БД `task_manager_test`, `TEST_DATABASE_URL`, установку Goose, применение миграций и запуск integration-тестов с `-race`, `-count=1` и `-tags=integration`.

**Критерии проверки:**

- service container имеет health-check через `pg_isready`;
- база называется `task_manager_test`;
- URL передаётся через `TEST_DATABASE_URL`, а не `DATABASE_URL`;
- Goose применяет миграции перед тестами;
- integration job не использует production secrets;
- тесты не запускаются против development-базы.

<details>
  <summary>Подсказка</summary>

```yaml
services:
  postgres:
    image: postgres:17-alpine
    env:
      POSTGRES_DB: task_manager_test
```
</details>

## Задание 3. Проверяйте Docker-артефакты

Добавьте job `docker`, зависящий от unit job. Он запускает `docker compose config` и собирает image с тегом `task-manager-api:ci`.

**Критерии проверки:**

- job использует `needs: unit`;
- YAML Compose валидируется до сборки;
- Docker build использует production Dockerfile;
- image build не публикуется из pull request;
- failure Dockerfile делает CI красным.

## Задание 4. Публикуйте проверенный image в GHCR

Добавьте publish job в тот же workflow после `unit`, `integration` и `docker`. Войдите в `ghcr.io` через `GITHUB_TOKEN`, публикуйте `latest` и SHA-тег, но для deployment используйте только SHA.

**Критерии проверки:**

- workflow имеет `packages: write` только там, где это необходимо;
- publish идёт только после успешных CI jobs;
- image name полностью в lowercase;
- `docker/login-action` не получает пароль в открытом тексте;
- SHA-tag записан в логи релиза или deployment;
- pull request не публикует production image.

<details>
  <summary>Подсказка</summary>

```yaml
publish:
  needs: [unit, integration, docker]
  if: github.event_name == 'push' && github.ref == 'refs/heads/master'
```
</details>

## Задание 5. Подготовьте VPS Compose

На VPS создайте `/opt/task-manager` с `compose.production.yaml` и закрытым `.env`. API должен получать image через `${IMAGE}`, PostgreSQL — использовать named volume без published `ports`, а API — слушать только `127.0.0.1:8080` для reverse proxy.

**Критерии проверки:**

- production `.env` не находится в Git;
- права `.env` — `600`;
- database password отличается от учебного локального примера;
- PostgreSQL не имеет `ports`;
- API использует `restart: unless-stopped`;
- PostgreSQL имеет health-check;
- `docker compose config` на VPS проходит без ошибок.

## Задание 6. Выполните deploy, проверку и rollback

Войдите на VPS в GHCR токеном только с `read:packages`. Разверните SHA-tag через `docker compose pull/up`, проверьте `/healthz`, затем выполните учебный rollback на предыдущий известный SHA-tag. После ручной проверки создайте deployment workflow с GitHub Secrets и `VPS_KNOWN_HOSTS`.

**Критерии проверки:**

- deploy использует immutable SHA-tag;
- `/healthz` проверяется через `curl --fail`;
- rollback не использует `latest`;
- команда rollback проверена до аварийной ситуации;
- SSH private key хранится только в GitHub Secret;
- проверка SSH host key включена;
- secrets не попадают в workflow output и shell history.

## Проверьте себя

Перед итоговой главой убедитесь, что вы можете:

- объяснить разницу CI, delivery и deployment;
- запустить unit, race и PostgreSQL integration-проверки в GitHub Actions;
- собрать и опубликовать image в GHCR только после CI;
- безопасно передать secrets и проверить SSH-host;
- развернуть SHA-tag на VPS, проверить `/healthz` и откатиться;
- объяснить, почему migrations нужно планировать вместе с rollback.

---
prev: /guide/final-integration/tests.md
next: /guide/final-integration/best-practices.md
---

# Задания: выпуск Task Manager API

Завершите Task Manager API как самостоятельный backend-проект. Цель — не добавить новую технологию, а доказать, что проект воспроизводимо запускается, имеет проверяемый HTTP-контракт и готов к безопасному дальнейшему развитию.

## Задание 1. Проведите ревизию структуры

Сопоставьте реальные каталоги проекта с итоговой архитектурой. Вынесите код из `main`, если там остались handlers, SQL-запросы или бизнес-правила. Убедитесь, что Gin, Resty и PostgreSQL не проникают в доменную модель и service.

**Критерии проверки:**

- `cmd/api/main.go` собирает зависимости и запускает приложение;
- Gin находится в HTTP-пакете;
- SQL находится в PostgreSQL-репозитории;
- service зависит от интерфейсов;
- доменные типы не импортируют Gin, Resty и `database/sql`;
- package names объясняют назначение кода.

## Задание 2. Напишите README с нуля

Попросите коллегу или самого себя в чистом каталоге выполнить README без устных подсказок. Включите требования, `.env.example`, Docker Compose, миграции, тесты и таблицу API.

**Критерии проверки:**

- README объясняет назначение проекта одной-двумя фразами;
- перечислены минимальные требования;
- есть команды copy `.env.example`, `docker compose up`, migrations и health-check;
- описаны все переменные без настоящих секретов;
- есть API-таблица с методами, путями и статусами;
- есть отдельное предупреждение для `docker compose down -v`.

<details>
  <summary>Подсказка</summary>

Проверьте README в новом shell: не используйте уже экспортированные переменные и локально запомненные шаги.
</details>

## Задание 3. Закрепите HTTP-контракт

Добавьте или обновите handler-тесты для `GET /healthz`, `GET /tasks`, `POST /tasks`, `POST /tasks/:id/complete` и `DELETE /tasks/:id`. Проверьте успешные ответы, `400`, `404`, формат error JSON и `204` без body.

**Критерии проверки:**

- tests используют `httptest`, а не реальный порт;
- каждый маршрут проверяет корректный HTTP-статус;
- error response соответствует одной структуре;
- тест удаления проверяет `204` и пустое body;
- не найденная задача возвращает `404`;
- request ID middleware не ломает HTTP-контракт.

<details>
  <summary>Подсказка</summary>

```go
if recorder.Code != http.StatusNoContent {
	t.Fatalf("status = %d, ожидался %d", recorder.Code, http.StatusNoContent)
}
if recorder.Body.Len() != 0 {
	t.Fatalf("204 не должен содержать body: %q", recorder.Body.String())
}
```
</details>

## Задание 4. Пройдите сценарий API вручную

Поднимите проект на чистом Docker volume, примените миграции и выполните сценарий: health-check → create → list → complete → delete. Посмотрите таблицу `tasks` и `goose_db_version` через DBeaver.

**Критерии проверки:**

- Docker Compose показывает healthy PostgreSQL;
- `curl` создаёт задачу с `201`;
- `GET /tasks` возвращает JSON-массив;
- complete меняет `completed` и `updated_at`;
- delete возвращает `204`;
- DBeaver показывает те же данные, что API;
- миграции не создавались вручную только через UI.

## Задание 5. Выполните release-проверки

Запустите весь список проверок перед release. Исправьте все предупреждения, а не отключайте проверки.

```bash
go mod tidy
git diff --exit-code -- go.mod go.sum
go vet ./...
go test ./...
go test -race ./...
docker compose config
docker build -t task-manager-api:release .
```

При доступной test-БД добавьте integration suite.

**Критерии проверки:**

- module-файлы не меняются после tidy;
- unit и race tests проходят;
- integration tests используют только `TEST_DATABASE_URL`;
- Dockerfile собирается;
- Compose YAML валиден;
- GitHub Actions проходит для pull request;
- нет незакоммиченных `.env`, secrets, бинарников или локальных volume-данных.

## Задание 6. Подготовьте первое улучшение

Выберите **одно** направление: авторизация, фильтрация/пагинация, метрики или rate limiting. До кода создайте короткий design note в issue, README или `docs/`:

1. проблема пользователя;
2. HTTP-контракт;
3. изменения модели и миграций;
4. правила доступа или ограничения;
5. unit, integration и handler-тесты;
6. логи, метрики и rollout/rollback-риски.

**Критерии проверки:**

- выбран ровно один небольшой scope;
- контракт описан до реализации;
- возможная миграция совместима с rollback;
- нет SQL-конкатенации для фильтров и сортировки;
- определено, какие данные нельзя логировать;
- есть понятный критерий готовности изменения.

## Проверьте себя

Вы завершили основной курс, если можете:

- с чистого окружения запустить проект только по README;
- объяснить границы Gin, service, repository и внешнего клиента;
- выполнить и проверить HTTP CRUD-сценарий;
- работать с PostgreSQL через миграции, integration tests и DBeaver;
- собрать image, пройти CI и задеплоить SHA-версию;
- выбрать следующее улучшение и спроектировать его до кода.

## Полный исходный код

Здесь будет размещён полный исходный код к практическим заданиям этой главы.

<ExampleSource
  path="examples/35/final-integration"
  description="заготовка для полного исходного кода практических заданий главы"
/>

---
prev: /guide/advanced-production-architecture/tests.md
next: /guide/advanced-production-architecture/best-practices.md
---

# Задания: архитектура production-сервиса

Эти задания развивают Task Manager API по одному production-требованию. Не пытайтесь реализовать все middleware, metrics и policies одновременно. Для каждого изменения сначала опишите contract, затем добавьте код, тесты и operational documentation.

## Задание 1. Выделите service boundary и fake repository

Опишите use case `Complete(ctx, actor, taskID)` в пакете `taskservice`. Service должен зависеть от маленького repository interface, а не от `*sql.DB` или Gin. Введите `Actor` и проверку: owner может завершить свою задачу, admin — любую, другой user получает `ErrForbidden`.

**Критерии проверки:**

- package `taskservice` не импортирует Gin, `database/sql` или PostgreSQL driver;
- interface объявлен рядом с service и содержит только нужные методы;
- `context.Context` передаётся в repository;
- unit-тест использует fake repository, не настоящую БД;
- тесты покрывают owner, admin, другой user и отсутствующую задачу;
- HTTP handler переводит `ErrForbidden` в документированный status без раскрытия repository details.

<details>
  <summary>Подсказка</summary>

```go
type Repository interface {
	Get(ctx context.Context, id task.TaskID) (task.Task, error)
	Complete(ctx context.Context, id task.TaskID) (task.Task, error)
}
```
</details>

<details>
  <summary>Направление решения</summary>

Не передавайте `*gin.Context` в `Complete`. Authentication middleware может создать минимальный `Actor`, handler передаст его в use case, а service выполнит policy check на domain data. PostgreSQL repository остаётся отдельной реализацией interface и проверяется integration-тестами.
</details>

## Задание 2. Config и безопасный startup log

Добавьте `DATABASE_URL`, `HTTP_CLIENT_TIMEOUT`, `SHUTDOWN_TIMEOUT` и `LOG_LEVEL` в `Config`. Все значения должны быть разобраны и проверены при старте. Напишите функцию безопасного логирования startup configuration, которая не выводит DSN, password и token.

**Критерии проверки:**

- обязательный `DATABASE_URL` без default вызывает startup error;
- durations парсятся и должны быть положительными;
- URL внешнего сервиса проверяется как absolute URL;
- `.env.example` и README содержат новые переменные без production secrets;
- unit-тесты используют `t.Setenv` без `t.Parallel`;
- log содержит HTTP address/log level, но не `DATABASE_URL` и credentials.

<details>
  <summary>Подсказка</summary>

Создайте отдельную функцию, например `LogStartup(logger, config)`, и тестируйте output через `slog` handler в `bytes.Buffer` либо проверяйте список разрешённых fields в собственном adapter.
</details>

## Задание 3. Разделите `/livez` и `/readyz`

Добавьте два endpoint:

- `GET /livez` всегда быстро возвращает `200` для живого процесса;
- `GET /readyz` возвращает `200`, только когда service не находится в draining state и `PingContext` критической БД проходит с коротким timeout; иначе — безопасный `503`.

Добавьте `draining` state, который выставляется до `server.Shutdown`.

**Критерии проверки:**

- liveness не делает SQL/HTTP call;
- readiness получает dependency через маленький `ReadinessChecker` interface;
- timeout readiness дочерний от request context и всегда отменяется;
- `503` не раскрывает DSN или текст SQL error;
- handler-тесты покрывают ready, DB failure и draining;
- README/Compose/оркестратор documentation описывают назначение обоих endpoints.

<details>
  <summary>Подсказка</summary>

```go
if api.draining.Load() {
	c.JSON(http.StatusServiceUnavailable, gin.H{"status": "draining"})
	return
}
```
</details>

## Задание 4. Контракт retry и idempotency

Спроектируйте два независимых контракта:

1. priority HTTP client делает максимум две попытки только для retryable `GET`, учитывает context и фиксирует metric/log outcome;
2. `POST /tasks` принимает ограниченный `Idempotency-Key`, сохраняет key + request hash + response атомарно с созданием задачи и возвращает тот же ответ на повтор.

В первой итерации достаточно design note, SQL migration и тестов contract — не требуется писать полноценную distributed очередь.

**Критерии проверки:**

- retry не срабатывает на `400` и не продолжается после cancel/deadline;
- delay ограничен, имеет backoff/jitter design и входит в request budget;
- idempotency key scoped к authenticated actor, имеет проверку длины/формата;
- same key + same request возвращает первоначальный status/body;
- same key + different request возвращает documented conflict;
- key persistence и создание Task находятся в одной transaction/unique constraint protocol;
- retention/cleanup и PII policy для key records описаны.

<details>
  <summary>Подсказка</summary>

В таблице idempotency key используйте `(actor_id, key)` как unique identity и hash нормализованного request, а не raw credentials или неограниченный body.
</details>

## Задание 5. Rate limit и API security review

Добавьте middleware или gateway policy для дорогого `POST /tasks` / export endpoint. Опишите identity key, limit/burst, поведение `429`, `Retry-After` и multi-replica semantics. Проведите security review существующего API по checklist этой главы.

**Критерии проверки:**

- untrusted `X-Forwarded-For` не считается надёжным identity без настройки trusted proxy;
- limiter не создаёт безграничную map состояний по client-controlled ключам;
- при отказе возвращается `429` с безопасным JSON contract и downstream service не вызывается;
- body имеет лимит до decoding; pagination/filter/sort имеют bounds и whitelist;
- authentication и authorization проверяются отдельными тестами;
- debug/pprof/admin endpoints не опубликованы наружу;
- review содержит action items с owner/приоритетом, а не только список общих слов.

<details>
  <summary>Направление решения</summary>

In-memory `rate.Limiter` может быть достаточен для single-instance internal service с documented best-effort policy. Для публичного многорепличного API выберите gateway или shared-store design и отдельно оцените availability/cost этой инфраструктуры. Rate limiting не заменяет authorization, WAF, body limits или observability.
</details>

## Проверьте себя

Перед выпуском production-изменения убедитесь, что вы можете:

- показать направление зависимостей от HTTP/infrastructure к service/domain;
- назвать owner каждого secret и доказать, что он не попадает в response/log/config dump;
- объяснить semantics startup, liveness и readiness во время drain;
- выбрать bounded labels для metrics и передать trace/cancellation context вниз;
- обосновать timeout budget, retry policy и idempotency на create side effect;
- определить scope и storage rate limiter для числа replicas;
- отделить authentication от authorization и проверить доступ к чужому ресурсу;
- показать reviewer тесты, migration/deploy plan, dashboard/alert/runbook для изменённого failure mode.

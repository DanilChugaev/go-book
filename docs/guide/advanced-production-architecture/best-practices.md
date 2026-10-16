---
prev: /guide/advanced-production-architecture/practice.md
---

# Рекомендации по коду: архитектура production-сервиса

## Слои и зависимости

- Держите направление зависимостей от transport/infrastructure к service/domain; `main` остаётся явным composition root.
- Пусть Gin живёт в HTTP-слое, `database/sql` — в repository, а конкретный HTTP client — в integration package.
- Объявляйте маленькие interfaces рядом с consumer; не создавайте abstractions до реальной потребности и не mock-айте чистый конкретный код.
- Отделяйте request/response DTO от внутренних моделей, если их contract/lifecycle различаются.
- Передавайте `context.Context` вниз во все SQL, HTTP и cancellable worker operations; не создавайте `Background` внутри use case.

## Config, secrets и lifecycle

- Читайте и валидируйте configuration один раз на startup; обязательный secret/config не должен иметь небезопасный default.
- Логируйте только явно разрешённые config fields. DSN, password, token, key, cookie и raw body не являются безопасным startup output.
- Обновляйте parser, `.env.example`, README, CI, deploy config и rotation/rollback plan одним изменением.
- Разделяйте startup, liveness и readiness. Liveness лёгкий; readiness отражает возможность принимать новый трафик и draining.
- При shutdown сначала снимайте readiness/останавливайте приём, затем ждите handler/worker в deadline и только после этого закрывайте dependencies.

## Observability

- Логируйте структурированный безопасный context на окончательной error boundary: request/trace ID, route, operation, bounded error code и внутренний error.
- Используйте metrics для rate, errors, duration, saturation и dependency outcome; labels должны быть конечным низкокардинальным набором.
- Не используйте request ID, task ID, email, raw path, error text или token как metric label.
- Передавайте incoming context для cancellation и trace propagation; trace attributes подчиняются той же privacy policy, что logs.
- Связывайте alerts с user impact, dashboard и конкретным действием, а не с единичным шумным событием.

## Reliability

- Планируйте timeout как вложенный budget всей операции, а не как независимые большие числа в каждом layer.
- Retry только idempotent/защищённые операции, только transient errors, с limit, backoff, jitter, deadline awareness и observability.
- Для create/side effect определяйте idempotency contract до автоматических retries; делайте key persistence атомарной с effect.
- Различайте in-memory best-effort limiter и distributed shared policy; лимитируйте rate и concurrency по отдельности, если ресурс дорогой.
- Явно выбирайте degradation policy optional dependency: fail, default, cache, async job — с contract и observability.

## Security и review

- Проверяйте authentication и authorization отдельно; ownership/role policy должна быть видна в use case и тестах.
- Ограничивайте body, pagination, filter/sort, upload и expensive operations до того, как они заняли ресурсы.
- Параметризуйте SQL; выбирайте dynamic identifiers из whitelist; не возвращайте internal errors, stack trace или SQL клиенту.
- Ограничивайте CORS, trusted proxies, TLS ingress и доступ к debug/admin endpoints по реальному deployment, а не только Gin router.
- Проверяйте dependencies, Docker image, workflow permissions, secrets и deployment artifacts как часть security surface.
- В code review требуйте contract tests, migration/rollback, configuration changes, operational signals и rollout plan соразмерно риску.

## Итоговый чек-лист

- [ ] У каждого нового use case есть явный owner, dependency boundary, errors и context propagation.
- [ ] Config и secrets валидируются, не логируются и воспроизводимы во всех environments.
- [ ] Liveness/readiness/draining соответствуют поведению deployment platform.
- [ ] Logs, metrics и traces дают диагностику без sensitive data и high cardinality.
- [ ] Retry, idempotency, rate/concurrency limits определены для side effects и dependency failure.
- [ ] Authorization, input limits, error disclosure и debug endpoints проверены на уровне endpoint/ingress.
- [ ] Tests, migrations, CI, Docker, observability, rollout и rollback обновлены вместе с production-риском.

---
prev: /guide/advanced-production-architecture/reliability.md
next: /guide/advanced-production-architecture/tests.md
---

# Безопасность API и code review

Безопасность production API — не один middleware с JWT. Это последовательность границ: кто вызывает API, что ему разрешено, какой input принимается, сколько ресурсов он может занять, что увидит в error response и как изменения проверяются до deploy.

## Authentication и authorization — разные проверки

**Authentication** отвечает: «кто делает запрос?». Примеры: session, OAuth/OIDC access token, API key, mTLS identity.

**Authorization** отвечает: «разрешено ли этой identity выполнить действие над этим ресурсом?». У authenticated пользователя всё равно может не быть права читать/завершать чужую задачу.

Плохой дизайн:

```text
JWT валиден → GET /tasks/42 разрешён
```

Нужен policy check с данными ресурса и actor:

```go
func (service *Service) Complete(ctx context.Context, actor Actor, id task.TaskID) (task.Task, error) {
	current, err := service.repository.Get(ctx, id)
	if err != nil {
		return task.Task{}, err
	}
	if current.OwnerID != actor.ID && !actor.HasRole("admin") {
		return task.Task{}, ErrForbidden
	}

	return service.repository.Complete(ctx, id)
}
```

Это пример направления, не готовая policy. Важно, что authorization видна в use case и тестируется для owner, другого user, admin и отсутствующего actor. Не полагайтесь только на hidden frontend button или ID из path клиента.

## Token validation на границе

Middleware authentication должен:

1. извлечь credential из ожидаемого места;
2. проверить signature/issuer/audience/expiry и algorithm согласно provider contract;
3. ограничить размер заголовка и не логировать credential;
4. создать минимальный immutable actor context;
5. передать actor в нижний слой безопасным способом;
6. вернуть нейтральный `401` для неаутентифицированного запроса.

Не принимайте algorithm из JWT header как доверенный выбор и не отключайте проверку audience/issuer ради «совместимости». Для OAuth/OIDC используйте поддерживаемую библиотеку и проверяйте ключи/rotation по документации провайдера.

## Input validation и resource limits

JSON binding проверяет только часть формы. Production handler должен ограничивать ресурсы до decoding:

```go
const maxRequestBodyBytes = 1 << 20 // 1 MiB; выберите по contract endpoint.

func limitBody(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxRequestBodyBytes)
}
```

Затем decoder/binding возвращает `413` или безопасный `400` согласно вашему contract. Также ограничивайте:

- длину title, число элементов массива, глубину/сложность filter;
- `limit` пагинации и допустимые sort fields whitelist;
- время и число результатов экспортов;
- upload size/type, если uploads появятся;
- входные значения rate-limit/idempotency key.

Не собирайте SQL из client strings. Values передаются placeholders, а identifiers/sort directions выбираются из закрытого whitelist. Не отражайте input в HTML или log без escaping/redaction.

## HTTP hardening

Базовые server timeouts уже защищают от медленных клиентов. Дополнительно рассмотрите по конкретному deployment:

- TLS завершает reverse proxy или сам Go server; plaintext HTTP не должен быть публичным;
- `http.Server` имеет `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout`;
- reverse proxy ограничивает request body, header size, connection rate и trusted forwarded headers;
- API выставляет только необходимые CORS origins/methods/headers, а не `*` вместе с credentials;
- security headers полезны в зависимости от типа response; JSON API и web UI имеют разные needs;
- debug endpoints (`pprof`, metrics admin) доступны только в internal network/authenticated admin boundary.

Не копируйте browser security headers в JSON API без понимания. Например, CSP важна для HTML, но не решает authorization API. Security controls должны быть проверяемы на уровне реального ingress, а не только в Gin unit-test.

## Ошибки и information disclosure

Публичный error response должен быть стабильным и безопасным:

```json
{"code":"internal_error","message":"Внутренняя ошибка сервера"}
```

Лог получает внутренний `err`, request/trace ID и безопасный context; клиент — code/message без SQL, file paths, panic, DSN, stack trace или деталей авторизации. Для `401`/`403` выбирайте policy, которая не помогает enumeration ресурсов или пользователей.

Не путайте «не раскрыть лишнее» с «скрыть incident»: internal logs, metrics, traces и audit events должны позволять расследование с нужными access controls.

## Dependency и supply-chain security

Production code включает dependencies, Docker base image, GitHub Actions, OS packages и workflow permissions. Минимальный процесс:

- обновлять Go и dependencies осознанно, читать release/security notes;
- использовать lock/`go.sum` и проверять `go mod tidy` diff;
- закреплять GitHub Actions по trusted version/commit согласно security policy;
- запускать dependency updates через CI и integration tests;
- минимизировать Docker image, не запускать процесс root без необходимости;
- не класть secrets в image layers, source, build args и CI output;
- знать owner и response plan для critical CVE.

Автоматический dependency bot создаёт повод для review, но не является заменой review. Особенно внимательно проверяйте auth, crypto, SQL drivers, serialization и network packages.

## Code review: проверяйте risk, а не стиль только глазами

Pull request должен отвечать: что изменилось, какой contract меняется, какие риски и как это проверено. Для больших изменений полезен короткий design note до реализации.

### Checklist автора и reviewer

**Архитектура**

- [ ] Новая зависимость направлена внутрь только через нужную boundary; service не импортирует Gin/SQL/client implementation.
- [ ] Интерфейс появился по реальной потребности consumer, а не как абстракция «на будущее».
- [ ] Конкретный use case не спрятан за generic CRUD, если важны правила, transaction или authorization.
- [ ] Изменения config, migrations и deploy отражены в README/Compose/CI.

**Корректность и данные**

- [ ] Контракт request/response, status и error codes задокументирован и закреплён тестом.
- [ ] SQL параметризован; migration проверена против тестовой БД и совместима с rollback plan.
- [ ] Context передан в SQL/HTTP/worker и deadline не превышает request budget.
- [ ] Retry, idempotency и failure semantics определены для external side effect.

**Security**

- [ ] Authentication и authorization проверяются отдельно; есть тесты доступа к чужому ресурсу.
- [ ] Input/body/pagination limits и rate limiting соответствуют endpoint risk.
- [ ] Secrets, PII, token, DSN и stack trace не попадают в response/log/metric/trace.
- [ ] Debug/admin endpoints не опубликованы через public ingress.
- [ ] Dependencies, Docker and workflow permissions проверены для нового risk.

**Operations**

- [ ] Логи содержат нужный bounded context, metrics — bounded labels, traces — безопасные attributes.
- [ ] Liveness/readiness отражают documented platform semantics и shutdown draining.
- [ ] Alert/dashboard/operational runbook обновлены, если меняется failure mode.
- [ ] Unit, integration, race, API contract, Compose and deploy checks соответствуют изменению.

## После merge: verify in production

Зелёный CI подтверждает известные scenarios, но не заменяет rollout observation. После deploy проверьте:

1. image/version и config revision;
2. readiness/liveness и отсутствие restart loop;
3. ключевой HTTP scenario с безопасным test actor;
4. error rate, latency, saturation и dependency metrics;
5. logs/traces без новых sensitive fields;
6. rollback condition и known-good version.

Новые high-risk изменения включайте постепенно: feature flag, canary, ограниченный tenant или staged rollout. Если baseline и rollback неизвестны, deployment ещё не готов.

## Итог

Production architecture не означает максимум паттернов, метрик и middleware. Это набор ясных контрактов: зависимости направлены правильно; конфигурация и secrets управляемы; операции наблюдаемы; повторные запросы и failures имеют policy; public API защищён; а review проверяет изменения по их риску.

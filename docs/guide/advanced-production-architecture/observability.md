---
prev: /guide/advanced-production-architecture/config-health.md
next: /guide/advanced-production-architecture/reliability.md
---

# Observability: логи, метрики и tracing

Observability — способность понять состояние системы по внешним сигналам без входа на сервер и догадок. Она не равна «писать больше логов». Для production обычно сочетают три сигнала:

```text
logs    → что случилось с конкретной операцией?
metrics → насколько часто и насколько плохо это происходит?
traces  → где проходит время одного запроса через несколько компонентов?
```

## Логи: контекст расследования

Структурированный `slog` уже даёт фундамент. В production лог на границе ошибки должен содержать безопасный operational context:

```go
logger.Error(
	"создание задачи не выполнено",
	"request_id", requestID,
	"method", request.Method,
	"route", "/tasks",
	"task_id", taskID,
	"err", err,
)
```

Выбирайте стабильные ключи: `request_id`, `trace_id`, `method`, `route`, `status`, `duration`, `error_code`. Для router metrics/logs предпочтительнее route template (`/tasks/:id`), а не raw path `/tasks/918273`: так не растёт cardinality и легче агрегировать запросы.

Не записывайте в лог по умолчанию:

- `Authorization`, cookies, password, token, DSN;
- полное request/response body;
- персональные данные без документированной цели и retention policy;
- неограниченные строки от клиента как label/ключ metric.

## Метрики: состояние системы во времени

Метрика — числовой ряд с ограниченным набором labels. В Task Manager полезны RED-сигналы для HTTP:

| Сигнал | Пример | Зачем |
| --- | --- | --- |
| Rate | число requests | замечать трафик и падение нагрузки |
| Errors | `5xx` / failure count | видеть ошибки, которые требуют действия |
| Duration | histogram latency | видеть latency и p50/p95/p99 |

Дополните их ресурсами и зависимостями: in-flight requests, DB pool stats, число retry, rate-limit rejects, queue depth, worker count. Названия и exact instrumentation зависят от выбранной системы (Prometheus/OpenTelemetry/managed platform), но контракт важнее SDK.

### Cardinality: самая частая ловушка

Каждая уникальная комбинация labels образует отдельный time series. Нельзя использовать как labels:

```text
task_id=123
request_id=...
user_email=...
raw_path=/tasks/123
error_message="..."
```

Это создаёт практически неограниченную cardinality, дорогую память и медленные queries. Вместо этого:

```text
http_requests_total{method="POST",route="/tasks",status="201"}
http_request_duration_seconds{method="POST",route="/tasks"}
task_service_errors_total{operation="create",code="validation_failed"}
```

Конкретный ID остаётся в log/trace, а aggregate metric хранит только конечный известный набор значений.

## Измеряйте семантику, а не реализацию

Хорошая метрика описывает user-visible или operational событие:

```text
task_create_total{outcome="success"}
task_create_total{outcome="validation_failed"}
priority_suggest_requests_total{outcome="timeout"}
```

Менее полезно делать metric на каждый private helper или на каждую строку кода. Она сломается при рефакторинге и не отвечает на вопрос оператора. Введите metrics там, где есть contract: endpoint, use case, внешний dependency, background worker или rate limiter.

## Tracing: путь одного запроса

Distributed trace объединяет spans одной операции. HTTP server создаёт root span; service, SQL и HTTP client создают дочерние:

```text
POST /tasks [trace_id=abc]
├── taskservice.Create
│   ├── priorityclient.Suggest
│   └── postgresrepo.Create
└── response 201
```

Trace полезен, когда latency проходит через несколько сервисов. Он отвечает: «в каком downstream и на каком шаге потеряны 800 ms?» Лог обычно отвечает «какая ошибка у request ID?», а metric — «как часто p95 выше SLO?»

Если используете OpenTelemetry, извлекайте trace context из входного HTTP request и передавайте `c.Request.Context()` вниз. Не создавайте новый `context.Background()` в service/client: это разорвёт cancellation и trace propagation.

```go
func (service *Service) Create(ctx context.Context, input task.CreateInput) (task.Task, error) {
	ctx, span := service.tracer.Start(ctx, "taskservice.Create")
	defer span.End()

	created, err := service.repository.Create(ctx, input)
	if err != nil {
		span.RecordError(err)
		return task.Task{}, err
	}

	return created, nil
}
```

Не добавляйте title, token, SQL DSN и личные данные в span attributes. Trace — не частный debug buffer: он может экспортироваться внешнему vendor, sampled частично и храниться дольше одного запроса.

## Request ID и trace ID

Request ID остаётся полезным и без tracing. Он может быть заголовком API (`X-Request-ID`) и связывать access log/response. Trace ID формируется/распространяется tracing system и связывает spans между сервисами. Они могут сосуществовать:

```text
request_id → поиск одного HTTP-обмена в собственных logs
trace_id   → путь операции через API, worker и downstream services
```

Не делайте request ID единственным metric label. В лог удобно добавить оба идентификатора безопасными полями.

## Ошибки, уровни и sampling

Не каждый `4xx` — server error. Validation failure может быть ожидаемым исходом и попадать в metric с `outcome="validation_failed"`, но не создавать alert и не засорять `ERROR` level. `5xx`, dependency timeout и panic требуют отдельной observability.

Трафик может сделать logs/traces слишком дорогими. Возможные политики:

- сохранять все errors и медленные requests;
- sampling успешных traces;
- ограничивать объём body и число attributes;
- redaction до отправки события.

Sampling нельзя использовать, чтобы скрыть security/audit requirements: такие события должны иметь отдельный, специально спроектированный безопасный audit pipeline.

## От метрик к SLO и alert

Alert должен быть действием, а не уведомлением «что-то есть». Вместо alert на каждый единичный `500` подумайте о user-impact window:

```text
Условие: 5xx rate выше 2% в течение 10 минут
Контекст: dashboard с request rate, route, dependency errors и deploy version
Действие: проверить recent deploy, PostgreSQL readiness, priority-service и traces
```

SLO и error budget зависят от продукта. Для учебного Task Manager не нужно имитировать enterprise monitoring. Но даже маленький сервис выигрывает от понятного dashboard: request rate, error rate, latency, version, readiness и DB pool saturation.

## Тестируйте observability contract

Не проверяйте в каждом unit-тесте полный текст лога. Проверяйте бизнес-результат. Отдельно тестируйте то, что действительно является contract:

- middleware добавляет request ID в response;
- `5xx` инкрементирует ожидаемый bounded error code;
- metric не содержит task ID/request ID;
- readiness не раскрывает внутреннюю ошибку;
- trace context передаётся в HTTP/SQL client, если tracing включён.

Следующая страница разберёт поведение в момент реальных сбоев: timeout, retry, повторная доставка запроса и злоупотребление API.

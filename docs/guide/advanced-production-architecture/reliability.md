---
prev: /guide/advanced-production-architecture/observability.md
next: /guide/advanced-production-architecture/security-review.md
---

# Timeouts, retries, idempotency и rate limiting

Production-сервис живёт в частично ненадёжной среде: сеть задерживает пакеты, dependency может вернуть `503`, клиент повторит request после timeout, а бот отправит тысячи запросов. Надёжность — не «повторить всё три раза», а явный контракт для каждой операции.

## Timeouts: бюджет, а не случайное число

У HTTP request есть конечный latency budget. Если API обещает ответ за 2 секунды, нельзя дать database 2 секунды, внешнему client ещё 2 секунды и retry ещё 2 секунды. Дедлайны должны укладываться друг в друга:

```text
входной request: 2 s
├── validation:      почти мгновенно
├── PostgreSQL:       до 300 ms
└── priority service: до 500 ms, включая возможный retry
```

Передавайте `c.Request.Context()` в service, `QueryContext` и `http.NewRequestWithContext`. Если отдельный downstream budget нужен, создавайте дочерний context с меньшим timeout:

```go
func (client *Client) Suggest(ctx context.Context, title string) (task.Priority, error) {
	ctx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancel()

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, client.endpoint, nil)
	if err != nil {
		return 0, fmt.Errorf("создать запрос приоритета: %w", err)
	}

	response, err := client.httpClient.Do(request)
	if err != nil {
		return 0, fmt.Errorf("запросить приоритет: %w", err)
	}
	defer response.Body.Close()

	// Проверка статуса и decode response.
	return 0, nil
}
```

Не создавайте `context.Background()` внутри client, иначе внешний вызов переживёт отмену клиента и shutdown. Не подменяйте timeout бесконечным retry loop.

## Retry: только при обоснованной временной ошибке

Retry имеет цену: он повышает latency, умножает нагрузку на уже повреждённую dependency и может создать дубликат side effect. Перед retry ответьте:

1. Операция безопасна для повторения?
2. Ошибка действительно временная: network timeout, `429`, `502`, `503`, `504`?
3. Есть ли оставшийся deadline budget?
4. Есть ли лимит attempts, backoff и jitter?
5. Наблюдаемы ли attempts и итоговый outcome?

Для простого idempotent `GET` допустима контролируемая политика:

```go
func retryableStatus(status int) bool {
	return status == http.StatusTooManyRequests ||
		status == http.StatusBadGateway ||
		status == http.StatusServiceUnavailable ||
		status == http.StatusGatewayTimeout
}

func backoff(attempt int) time.Duration {
	base := 50 * time.Millisecond
	maximum := time.Second
	delay := base * (1 << attempt)
	if delay > maximum {
		delay = maximum
	}
	// Для нескольких клиентов добавьте bounded random jitter.
	return delay
}
```

Production реализация должна ждать через timer/select с `ctx.Done()`, уважать `Retry-After` при `429` и не делать retry после deadline. Не повторяйте автоматически `POST /tasks`, если server мог создать задачу, но response потерялся: сначала нужна idempotency semantics.

::: warning Retry не лечит постоянную проблему
Retry полезен для короткого transient failure. При долгой аварии нужны timeout, circuit breaker/ограничение нагрузки, fallback или явная ошибка клиенту. Бесконечные retries превращают outage в очереди goroutine, connection exhaustion и cascade failure.
:::

## Idempotency: повтор не должен менять результат повторно

Операция идемпотентна, если несколько одинаковых применений дают тот же конечный эффект, что и одно. `GET` обычно идемпотентен. `PUT`/`DELETE` могут быть идемпотентны по contract. `POST` создания — нет автоматически.

Клиент может не получить response из-за network failure и отправить тот же create request повторно. Без защиты API создаст две задачи.

### Idempotency key для создания

Один распространённый protocol:

1. client генерирует случайный `Idempotency-Key` для логической операции;
2. API валидирует format/length ключа и привязывает его к authenticated actor;
3. в transaction сохраняет key, request fingerprint и итог response/status;
4. повтор с тем же key и тем же request возвращает первоначальный response;
5. тот же key с другим request возвращает `409 Conflict`;
6. record имеет TTL/cleanup policy.

Схематичная таблица:

```sql
CREATE TABLE idempotency_keys (
    actor_id BIGINT NOT NULL,
    key TEXT NOT NULL,
    request_hash BYTEA NOT NULL,
    status_code SMALLINT NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (actor_id, key)
);
```

Главное — атомарность с созданием Task. Если сначала создать задачу, а key сохранить после отдельным запросом, crash между операциями снова даст дубликат. Используйте одну transaction, правильный unique constraint и продумайте поведение concurrent duplicate requests.

Не храните в key table необработанные credentials или неограниченное body. Hash request и ограниченный JSON response уменьшают риск, но retention и PII policy всё равно обязательны.

## Idempotency не равна exactly-once

В распределённой системе «ровно один раз» редко гарантируется автоматически. Idempotency key уменьшает дублирование для конкретного endpoint. Для side effects вроде email, payment или очереди нужны отдельные patterns: outbox, unique business key, provider idempotency key, reconciliation job. Не обещайте exactly-once в README, если не можете доказать его для всей цепочки.

## Rate limiting: защита ограниченного ресурса

Rate limiting отвечает: сколько работы конкретный actor может создать за период. До реализации определите:

- ключ: IP, authenticated user, API key, tenant, route или комбинация;
- scope: весь API, отдельный дорогой endpoint, login/create/export;
- policy: fixed window, sliding window, token bucket, concurrency limit;
- response: `429 Too Many Requests`, возможно `Retry-After`;
- storage: in-memory или shared distributed store;
- observability и abuse response.

### Token bucket в одном экземпляре

Для одного процесса token bucket допускает короткий burst и ограничивает среднюю скорость. Но in-memory limiter не глобален: при трёх replicas клиент фактически получает примерно тройной лимит. Это допустимо только при явно documented best-effort policy.

Gin middleware должен не доверять безусловно `X-Forwarded-For`: этот заголовок можно подделать, если reverse proxy не перезаписывает/не ограничивает его. Настройте trusted proxies и используйте authenticated identity, если лимит относится к пользователю.

```go
func rateLimit(limiter *rate.Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.Header("Retry-After", "1")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, errorResponse{
				Code:    "rate_limited",
				Message: "Слишком много запросов. Повторите позже.",
			})
			return
		}
		c.Next()
	}
}
```

Этот пример — глобальный limiter одного instance, не per-user policy. Для production многорепличного API рассмотрите rate limiting на gateway/reverse proxy или shared Redis/database store, оцените availability этого dependency и не создавайте безграничную map лимитеров по user-controlled IP.

## Concurrency limit дополняет rate limit

Rate ограничивает поток request за секунду. Concurrency limit ограничивает число одновременно дорогих операций: export, report, external API. Для медленного endpoint одного rate limit может быть недостаточно — 10 разрешённых долгих requests могут занять все DB connections. Выбирайте bounded queue, immediate `429/503` или async job model по product contract.

## Деградация и dependency failure

Когда optional priority service недоступен, API может:

- отказать в создании задачи (`503`), если priority обязательна;
- создать задачу с default priority и записать событие для повторного enrichment;
- вернуть cached suggestion с явной freshness policy;
- принять async job и дать клиенту статус обработки.

Это product decision. Не прячьте его в catch-all `recover` или silent fallback. Для каждого пути определите HTTP contract, audit/log/metric, retry policy и data consistency.

## Тесты надёжности

Проверяйте contract, а не случайные sleeps:

- client прекращает retry при отменённом context;
- retry не запускается на non-retryable `400`;
- retry ограничен attempts и укладывается в deadline;
- одинаковый idempotency key возвращает сохранённый ответ;
- тот же key с другим request возвращает documented conflict;
- rate limiter возвращает `429` и не вызывает downstream service;
- метрики имеют bounded labels и фиксируют retry/limit outcome.

Следующая страница добавит security boundary и code review, который помогает эти решения не потерять в следующем изменении.

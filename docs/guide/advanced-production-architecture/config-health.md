---
prev: /guide/advanced-production-architecture/README.md
next: /guide/advanced-production-architecture/observability.md
---

# Конфигурация, секреты и health-checks

## Конфигурация — входной контракт процесса

Конфигурация не должна быть набором разрозненных `os.Getenv` в handlers. Она приходит на границе процесса, разбирается один раз, валидируется до открытия listener и передаётся зависимостям как типизированные значения.

```go
type Config struct {
	HTTPAddress         string
	DatabaseURL         string
	PriorityServiceURL  string
	HTTPClientTimeout   time.Duration
	ShutdownTimeout     time.Duration
	LogLevel            slog.Level
	ReadinessTimeout    time.Duration
}
```

Ошибочная конфигурация должна завершить startup с ясной ошибкой. Лучше не поднять pod с неверным DSN, чем принять первый запрос и ответить `500` из глубины repository.

## Разделяйте config и secrets

Не каждое env-значение секретно. Полезно разделить данные по риску:

| Категория | Примеры | Можно ли безопасно логировать |
| --- | --- | --- |
| Обычная config | HTTP address, log level, feature flag name | обычно да, после проверки |
| Sensitive config | внутренний URL, tenant identifier | зависит от инфраструктуры |
| Secret | password, API token, private key, signing secret | нет |

`DATABASE_URL` почти всегда содержит пароль, поэтому не логируйте целиком `Config` и не печатайте подставленный Compose config в публичные CI logs. Логируйте лишь безопасную часть: например, `db_host` после аккуратного разбора и только если это допускает модель угроз.

```go
logger.Info(
	"конфигурация загружена",
	"http_address", config.HTTPAddress,
	"log_level", config.LogLevel.String(),
	// Без DatabaseURL и tokens.
)
```

## Источники и приоритет

Для 12-factor приложения production source of truth — environment или secret manager платформы. Локальный `.env` удобен только для разработки:

```text
production env / secret manager  → наивысший приоритет
локальный .env                   → только fallback для разработки
кодовые defaults                 → только для безопасных необязательных настроек
```

Не задавайте default для обязательного production secret. Пустой token или случайный development password должны приводить к понятной startup error, а не к небезопасному режиму. `.env.example` содержит имена и безопасные placeholders, но не рабочие production credentials.

## Ротация secrets

Секрет однажды будет заменён: сотрудник уходит, token скомпрометирован, срок действия сертификата истекает. Поэтому заранее определите:

- где хранится source of truth (GitHub Actions Secrets, VPS secret file, cloud secret manager);
- кто имеет доступ и как он аудируется;
- как новый secret попадает в окружение;
- нужен ли restart/rollout для его применения;
- как отозвать старый secret и проверить отсутствие его в logs/history.

Не пытайтесь «горячо» менять env внутри процесса без чёткого design. Большинство сервисов безопаснее перезапустить rolling deployment после обновления секрета. Если требуется zero-downtime rotation ключей, API часто должен временно принимать два ключа (current + previous) с явным сроком жизни и audit trail.

## Liveness, readiness и startup — разные состояния

Один `/healthz` не всегда должен отвечать на все operational вопросы.

| Probe | Вопрос платформы | Что проверять | Типичная реакция на failure |
| --- | --- | --- | --- |
| Startup | «Процесс успел инициализироваться?» | миграции/обязательная initialisation, если они блокируют старт | подождать или не направлять трафик |
| Liveness | «Процесс жив и способен обрабатывать event loop?» | лёгкая проверка процесса, без внешней сети/БД | перезапустить застрявший процесс |
| Readiness | «Можно ли направлять новый трафик?» | критические локальные зависимости и состояние draining | убрать instance из balancing, не обязательно рестартовать |

Называть endpoints можно по-разному: `/livez`, `/readyz`, `/healthz`. Важнее документировать contract для вашего orchestrator. Не добавляйте external HTTP API в liveness: временная авария соседнего сервиса не должна заставлять platform перезапускать все экземпляры Task Manager одновременно.

## Liveness: дешёвая проверка процесса

```go
func (api *API) live(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
```

Liveness должен быть быстрым, не требовать auth, не читать БД и не выполнять долгие операции. Если process deadlock или event loop не отвечает, request всё равно не дойдёт до handler — platform увидит timeout. Не превращайте liveness в глубокий dependency audit.

## Readiness: можно ли принимать новый трафик

Readiness может учитывать состояние shutdown и критическую БД. Дайте probe маленький собственный timeout, чтобы он не занял все connections pool:

```go
type ReadinessChecker interface {
	PingContext(context.Context) error
}

type API struct {
	database ReadinessChecker
	draining atomic.Bool
}

func (api *API) ready(c *gin.Context) {
	if api.draining.Load() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "draining"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), time.Second)
	defer cancel()

	if err := api.database.PingContext(ctx); err != nil {
		api.logger.Warn("readiness PostgreSQL не пройдена", "err", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ready"})
}
```

`PingContext` на каждом readiness request может быть лишней нагрузкой в конкретной платформе. Альтернативы: периодический background check с cached state, отдельный pool или readiness, основанная только на собственном состоянии процесса. Выберите policy по SLA и поведению orchestrator; не копируйте probe механически.

::: warning Не раскрывайте internals probe-ответом
Клиенту и публичному интернету не нужны DSN, имена таблиц, полные ошибки PostgreSQL или состояние всех internal dependencies. Status + короткий code достаточно; полная причина остаётся в защищённом логе/метрике.
:::

## Readiness во время graceful shutdown

При `SIGTERM` сервис должен перестать принимать новый трафик до того, как истечёт shutdown deadline. Один из вариантов:

1. выставить `draining = true` — `/readyz` начинает возвращать `503`;
2. дать load balancer время увидеть состояние и перестать направлять новые requests;
3. вызвать `server.Shutdown(shutdownCtx)`;
4. дождаться handler и worker;
5. закрыть DB и остальные dependencies.

Точный grace period зависит от Kubernetes, reverse proxy и deployment platform. Не заменяйте этот протокол `time.Sleep`: платформа должна иметь documented readiness semantics, а сервер — ограниченный `Shutdown` context.

## Feature flags и динамическая config

Feature flag — тоже configuration contract. Для каждого flag определите:

- владелец и бизнес-цель;
- default и поведение при недоступности flag service;
- scope (global, tenant, user, request);
- observability: как видно, какая ветка сработала;
- дата удаления flag и старого кода.

Не используйте flags, чтобы скрыть отсутствие миграционного или authorization design. Они полезны для постепенного включения, rollback и эксперимента, но превращаются в долг при неограниченном накоплении.

## Конфигурация и deploy

Config shape — часть delivery. Изменение обязательной env-переменной требует в одном PR:

- parser + validation;
- `.env.example` и README;
- Compose/Helm/Terraform/secret manager config;
- CI/deploy environment;
- migration/rollback plan, если поведение меняет данные;
- tests для missing/invalid/valid configuration.

Следующая страница добавит observability: как после успешного запуска понять, что service действительно здоров, быстр и правильно обрабатывает трафик.

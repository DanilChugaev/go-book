---
prev: /guide/resty/best-practices.md
next: /guide/configuration-and-lifecycle/tests.md
---

# Конфигурация и жизненный цикл приложения

## Цель урока

Научиться получать настройки Task Manager API из переменных окружения и локального `.env`, проверять конфигурацию при старте, запускать HTTP-сервер с таймаутами, корректно обрабатывать `SIGINT` и `SIGTERM`, выполнять graceful shutdown и закрывать зависимости приложения.

До этого момента значения вроде `:8080` и адреса внешнего API можно было писать прямо в примере. В настоящем приложении среда меняется: локальная разработка, тесты, Docker и production используют разные адреса, токены и пути. Такие значения становятся конфигурацией, а не частью исходного кода.

## Двенадцатифакторный принцип

Конфигурация зависит от окружения и должна быть отделена от кода:

```text
код:            как работает приложение
переменные env: где слушать порт, куда подключаться, какой timeout использовать
```

Не храните в Git секреты, production-адреса и пароли. Код читает значения из окружения, а платформа запуска — shell, Docker Compose, CI или hosting — передаёт их приложению.

## Структура конфигурации

Соберём все настройки в один тип:

```go
type Config struct {
	HTTPAddress        string
	ShutdownTimeout    time.Duration
	PriorityServiceURL string
}
```

Для текущей версии Task Manager нужны:

| Переменная | Назначение | Значение по умолчанию |
| --- | --- | --- |
| `HTTP_ADDRESS` | адрес HTTP-сервера | `:8080` |
| `SHUTDOWN_TIMEOUT` | максимум времени на graceful shutdown | `10s` |
| `PRIORITY_SERVICE_URL` | базовый URL внешнего сервиса приоритетов | обязательна |

Позже сюда добавятся адрес PostgreSQL и учётные данные. Не создавайте глобальные переменные для отдельных значений: один `Config` легче валидировать и передавать при сборке зависимостей.

## Переменные окружения

Стандартный пакет `os` предоставляет два основных способа чтения env:

```go
value := os.Getenv("HTTP_ADDRESS")
```

`Getenv` возвращает пустую строку и для отсутствующей переменной, и для явно заданного пустого значения. Если нужно различать эти сценарии, используйте `LookupEnv`:

```go
value, exists := os.LookupEnv("PRIORITY_SERVICE_URL")
if !exists || strings.TrimSpace(value) == "" {
	return Config{}, errors.New("PRIORITY_SERVICE_URL обязателен")
}
```

Для необязательных переменных удобно сделать helper:

```go
func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}

	return fallback
}
```

Пустое значение здесь означает «использовать fallback». Для обязательных секретов или URL используйте отдельную проверку, а не fallback, который скроет ошибку конфигурации.

## Локальный `.env`

ОС и production-платформа не читают `.env` автоматически. Для локальной разработки подключим `github.com/joho/godotenv`:

```bash
go get github.com/joho/godotenv
```

В `main` загрузите файл до чтения конфигурации:

```go
if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
	return fmt.Errorf("загрузить .env: %w", err)
}
```

Если `.env` отсутствует, это не ошибка: переменные могут быть переданы из shell, Docker или CI. Если файл есть, но прочитать его не удалось, запуск нужно остановить.

Создайте в репозитории шаблон `.env.example`, но не добавляйте сам `.env` в Git:

```dotenv
# Локальный HTTP-сервер.
HTTP_ADDRESS=:8080

# Время на завершение активных HTTP-запросов после SIGINT/SIGTERM.
SHUTDOWN_TIMEOUT=10s

# Адрес тестового или локального внешнего сервиса.
PRIORITY_SERVICE_URL=http://localhost:8090
```

Добавьте в `.gitignore`:

```gitignore
.env
```

`godotenv.Load` не должен перезаписывать значения, которые уже передала среда. Поэтому shell и production-платформа имеют приоритет над локальным `.env`.

## Разбор и валидация конфигурации

Значения env — всегда строки. Сразу преобразуйте и проверьте их при старте, а не внутри HTTP handler:

```go
func Load() (Config, error) {
	shutdownTimeout, err := time.ParseDuration(envOrDefault("SHUTDOWN_TIMEOUT", "10s"))
	if err != nil {
		return Config{}, fmt.Errorf("SHUTDOWN_TIMEOUT: %w", err)
	}
	if shutdownTimeout <= 0 {
		return Config{}, errors.New("SHUTDOWN_TIMEOUT должен быть больше нуля")
	}

	priorityServiceURL := strings.TrimSpace(os.Getenv("PRIORITY_SERVICE_URL"))
	if priorityServiceURL == "" {
		return Config{}, errors.New("PRIORITY_SERVICE_URL обязателен")
	}
	endpoint, err := url.ParseRequestURI(priorityServiceURL)
	if err != nil || endpoint.Scheme == "" || endpoint.Host == "" {
		return Config{}, errors.New("PRIORITY_SERVICE_URL должен быть абсолютным URL")
	}

	return Config{
		HTTPAddress:        envOrDefault("HTTP_ADDRESS", ":8080"),
		ShutdownTimeout:    shutdownTimeout,
		PriorityServiceURL: strings.TrimRight(priorityServiceURL, "/"),
	}, nil
}
```

Проверка `url.ParseRequestURI` и полей `Scheme`/`Host` предотвращает ошибку, когда приложение запускается с `priority-service:8090` без `http://`. Не логируйте весь `Config` бездумно: будущие поля могут содержать пароль или token.

## Тестирование `Load`

Конфигурация — обычная логика, поэтому её надо тестировать. Не меняйте настоящий env процесса в параллельных тестах. Передайте функцию чтения как зависимость или используйте `t.Setenv` в непараллельных тестах:

```go
func TestLoadInvalidShutdownTimeout(t *testing.T) {
	t.Setenv("PRIORITY_SERVICE_URL", "https://priority.example.com")
	t.Setenv("SHUTDOWN_TIMEOUT", "пять секунд")

	_, err := Load()
	if err == nil {
		t.Fatal("Load не вернул ошибку")
	}
}
```

`t.Setenv` сам восстановит значение после теста. Не вызывайте `t.Parallel` в тестах, которые используют `t.Setenv`: переменные окружения принадлежат всему процессу.

## Сборка зависимостей в `main`

`main` отвечает за порядок старта: загрузить локальный `.env`, прочитать config, собрать logger и зависимости, затем запустить сервер.

```go
func run() error {
	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("загрузить .env: %w", err)
	}

	config, err := config.Load()
	if err != nil {
		return fmt.Errorf("конфигурация: %w", err)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	priorityClient := priorityclient.New(config.PriorityServiceURL, nil)
	store := store.NewTaskStore(logger)
	service := taskservice.New(store, priorityClient)
	api := ginapi.New(service, logger)

	server := newServer(config.HTTPAddress, api.Router())
	return serve(server, config.ShutdownTimeout, logger)
}

func main() {
	if err := run(); err != nil {
		slog.Error("приложение завершилось с ошибкой", "err", err)
		os.Exit(1)
	}
}
```

`main` — подходящее место для `os.Exit`, потому что это граница процесса. В library-коде возвращайте ошибки, а не завершайте процесс самостоятельно: так код можно тестировать и переиспользовать.

## HTTP server и защитные таймауты

Не используйте `router.Run()` в production-сборке: он не даёт централизованно задать `http.Server`. Создайте сервер явно:

```go
func newServer(address string, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:              address,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
}
```

| Таймаут | Защищает от |
| --- | --- |
| `ReadHeaderTimeout` | очень медленной передачи заголовков |
| `ReadTimeout` | слишком долгого чтения всего запроса |
| `WriteTimeout` | слишком долгой записи ответа |
| `IdleTimeout` | бесконечного удержания неактивного keep-alive соединения |

Значения зависят от продукта: например, для долгого скачивания или streaming нужны другие правила. Эти безопасные стартовые значения не являются универсальной нормой.

## Сигналы процесса

При Ctrl+C терминал обычно отправляет процессу `SIGINT`; Docker и оркестраторы обычно используют `SIGTERM`. В обоих случаях приложение должно перестать принимать новые запросы и завершить активные в ограниченное время.

`signal.NotifyContext` создаёт context, который отменяется при нужном сигнале:

```go
rootCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()

<-rootCtx.Done()
```

Вызов `stop` важен: он освобождает ресурсы, связанные с получением сигналов, и возвращает стандартное поведение сигнала после выхода.

## Graceful shutdown

`server.Shutdown(ctx)`:

1. закрывает listener — новые соединения и запросы больше не принимаются;
2. ждёт завершения активных handler;
3. возвращает ошибку, если context завершения истёк.

Не используйте `server.Close()` как обычный путь остановки: он немедленно обрывает активные соединения. `Close` может быть аварийным fallback после истечения timeout, но не заменяет `Shutdown`.

Запустим `ListenAndServe` в goroutine и дождёмся сигнала:

```go
func serve(server *http.Server, shutdownTimeout time.Duration, logger *slog.Logger) error {
	serverErrors := make(chan error, 1)
	go func() {
		serverErrors <- server.ListenAndServe()
	}()

	rootCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			return fmt.Errorf("HTTP-сервер: %w", err)
		}
		return nil
	case <-rootCtx.Done():
		logger.Info("начато корректное завершение", "signal", rootCtx.Err())
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("корректно завершить HTTP-сервер: %w", err)
	}

	if err := <-serverErrors; err != nil && !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("HTTP-сервер после shutdown: %w", err)
	}

	logger.Info("HTTP-сервер остановлен")
	return nil
}
```

Канал `serverErrors` имеет буфер `1`, поэтому goroutine может сообщить о раннем завершении сервера, даже если `serve` в этот момент ещё создаёт context сигналов. Контекст shutdown намеренно создаётся от `context.Background()`: root context уже отменён сигналом, а серверу нужно получить отдельное время, чтобы завершить текущую работу.

## Закрытие зависимостей

HTTP-сервер — не единственный ресурс. Файлы, базы данных и сетевые клиенты тоже могут требовать закрытия. Опишем минимальный интерфейс:

```go
type Closer interface {
	Close() error
}

func closeAll(closers ...Closer) error {
	var closeErr error
	for _, closer := range closers {
		if closer == nil {
			continue
		}

		if err := closer.Close(); err != nil {
			closeErr = errors.Join(closeErr, err)
		}
	}
	return closeErr
}
```

В следующей главе `*sql.DB` станет одной из таких зависимостей. Вызывайте `closeAll` после `server.Shutdown`, чтобы не закрыть ресурс, пока активный handler ещё выполняет запрос.

```go
if err := closeAll(database); err != nil {
	return fmt.Errorf("закрыть зависимости: %w", err)
}
```

`errors.Join` сохраняет все ошибки закрытия. Не вызывайте `os.Exit` внутри `defer`: deferred-функции не выполнятся, а ресурсы могут остаться незакрытыми.

## Health-check

Базовый endpoint уже существует:

```go
router.GET("/healthz", api.health)
```

Пока у Task Manager нет базы данных, он может отвечать:

```json
{"status":"ok"}
```

Health-check должен быть быстрым, не требовать авторизации и не выполнять тяжёлую работу. В Docker и CI он подтвердит, что HTTP-сервер начал отвечать. После подключения PostgreSQL отдельно определим readiness-check, который проверяет критические зависимости; не превращайте простой liveness endpoint в медленный запрос к каждой внешней системе.

## Проверка вручную

Создайте `.env` на основе `.env.example`, затем запустите приложение:

```bash
go run .
```

В другом терминале:

```bash
curl -i http://localhost:8080/healthz
```

Вернитесь в первый терминал и нажмите Ctrl+C. В логах должны появиться начало и завершение graceful shutdown. Сервер больше не принимает новые запросы, а процесс завершится с кодом `0`, если ошибок не было.

## Частые ошибки

### Читать env внутри handler

```go
func (api *API) createTask(c *gin.Context) {
	baseURL := os.Getenv("PRIORITY_SERVICE_URL")
	// ...
}
```

Это повторяет работу на каждом request, скрывает некорректную конфигурацию до первого вызова и усложняет тесты. Читайте config один раз при старте.

### Коммитить `.env`

`.env` часто содержит токены и пароли. Коммитьте только `.env.example` с безопасными примерами и добавьте настоящий `.env` в `.gitignore`.

### Игнорировать ошибку `ListenAndServe`

Если порт занят, сервер не запустится. Проверяйте ошибку и отличайте ожидаемый `http.ErrServerClosed` после shutdown от настоящей ошибки старта.

### Использовать `context.Background()` для каждого вызова

В `main` background — корень жизненного цикла. Но внутри handler передавайте `r.Context()` или `c.Request.Context()`, иначе отмена клиента не остановит внешние запросы и SQL-операции.

### Закрыть базу до HTTP-сервера

Активный handler может ещё работать с БД. Сначала вызовите `server.Shutdown`, затем закрывайте зависимости.

## Дальше

Task Manager умеет получать проверенную конфигурацию и корректно останавливаться. Далее упакуем приложение и локальный PostgreSQL в Docker Compose, чтобы следующие SQL-упражнения работали в воспроизводимом окружении.

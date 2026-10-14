---
prev: /guide/configuration-and-lifecycle/tests.md
next: /guide/configuration-and-lifecycle/best-practices.md
---

# Задания: управляемый запуск Task Manager API

Сделайте запуск Task Manager API управляемым: настройки поступают из env и локального `.env`, сервер получает защитные таймауты, а при Ctrl+C или `SIGTERM` корректно завершает активную работу.

## Задание 1. Создайте `Config` и `.env.example`

Создайте пакет `internal/config` со структурой `Config` для `HTTP_ADDRESS`, `SHUTDOWN_TIMEOUT` и `PRIORITY_SERVICE_URL`. Добавьте `.env.example` с безопасными локальными значениями и добавьте `.env` в `.gitignore`.

**Критерии проверки:**

- `Config` не содержит глобальных переменных;
- `.env.example` не содержит настоящих токенов и паролей;
- `.env` игнорируется Git;
- в примере есть все три переменные;
- имена переменных документированы рядом с конфигурацией или в README.

<details>
  <summary>Подсказка</summary>

```dotenv
HTTP_ADDRESS=:8080
SHUTDOWN_TIMEOUT=10s
PRIORITY_SERVICE_URL=http://localhost:8090
```
</details>

## Задание 2. Загрузите и проверьте env

Реализуйте `config.Load()`. `HTTP_ADDRESS` должен иметь fallback `:8080`, `SHUTDOWN_TIMEOUT` — `10s`; `PRIORITY_SERVICE_URL` обязателен и должен быть абсолютным HTTP(S)-URL. Ошибки разбора должны объяснять имя переменной.

**Критерии проверки:**

- длительность разбирается через `time.ParseDuration`;
- нулевая и отрицательная длительность отклоняются;
- обязательный URL не может быть пустым;
- URL содержит scheme и host;
- trailing slash URL нормализуется;
- неправильная конфигурация не позволяет запустить сервер.

<details>
  <summary>Подсказка</summary>

```go
endpoint, err := url.ParseRequestURI(priorityServiceURL)
if err != nil || endpoint.Scheme == "" || endpoint.Host == "" {
	return Config{}, errors.New("PRIORITY_SERVICE_URL должен быть абсолютным URL")
}
```
</details>

<details>
  <summary>Фрагмент решения</summary>

```go
shutdownTimeout, err := time.ParseDuration(envOrDefault("SHUTDOWN_TIMEOUT", "10s"))
if err != nil {
	return Config{}, fmt.Errorf("SHUTDOWN_TIMEOUT: %w", err)
}
if shutdownTimeout <= 0 {
	return Config{}, errors.New("SHUTDOWN_TIMEOUT должен быть больше нуля")
}
```
</details>

## Задание 3. Подключите локальный `.env`

Добавьте `github.com/joho/godotenv`. В `run` вызовите `godotenv.Load()` перед `config.Load`. Отсутствующий `.env` не должен мешать запуску, другие ошибки чтения — должны.

**Критерии проверки:**

- зависимость добавлена через `go get github.com/joho/godotenv`;
- `.env` загружается до чтения env;
- `os.ErrNotExist` игнорируется;
- другие ошибки оборачиваются и возвращаются;
- production env может переопределить локальное значение `.env`;
- `.env` не коммитится.

<details>
  <summary>Подсказка</summary>

```go
if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
	return fmt.Errorf("загрузить .env: %w", err)
}
```
</details>

## Задание 4. Настройте HTTP-сервер

Вынесите создание `http.Server` в `newServer(address, handler)`. Настройте `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout` и `IdleTimeout`. Gin router передавайте как `http.Handler`.

**Критерии проверки:**

- используется `http.Server`, а не `router.Run()`;
- адрес приходит из `Config`;
- настроены все четыре таймаута;
- `ReadHeaderTimeout` ненулевой;
- server получает Gin router через `Handler`;
- стартовая ошибка `ListenAndServe` не игнорируется.

## Задание 5. Добавьте graceful shutdown

Напишите `serve(server, shutdownTimeout, logger)`. Он запускает `ListenAndServe` в goroutine, ждёт `SIGINT` или `SIGTERM` через `signal.NotifyContext`, затем вызывает `server.Shutdown` с новым timeout context от `context.Background()`.

**Критерии проверки:**

- обработаны `os.Interrupt` и `syscall.SIGTERM`;
- `stop()` вызывается через `defer`;
- канал ошибок сервера буферизирован размером `1`;
- `http.ErrServerClosed` не считается ошибкой;
- timeout context создан от `context.Background()`;
- успешный shutdown логируется;
- `server.Close()` не используется вместо обычного shutdown.

<details>
  <summary>Подсказка</summary>

```go
shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
defer cancel()

if err := server.Shutdown(shutdownCtx); err != nil {
	return fmt.Errorf("корректно завершить HTTP-сервер: %w", err)
}
```
</details>

## Задание 6. Закройте зависимости и протестируйте конфигурацию

Добавьте `closeAll(closers ...Closer)` с `errors.Join`. Закрывайте зависимости после `server.Shutdown`. Напишите table-driven тесты `config.Load` для default-значений, неверной длительности, пустого URL и URL без scheme. Используйте `t.Setenv` и не запускайте эти тесты параллельно.

**Критерии проверки:**

- `closeAll` пытается закрыть все зависимости, даже если одна вернула ошибку;
- ошибки закрытия объединяются через `errors.Join`;
- nil dependency не вызывает panic;
- тесты конфигурации независимы;
- тесты не используют настоящий `.env`, сеть или `time.Sleep`;
- `go test ./...` и `go test -race ./...` проходят.

<details>
  <summary>Подсказка</summary>

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
</details>

## Проверьте себя

Перед Docker-главой убедитесь, что вы можете:

- передать настройки через env, не храня секреты в коде;
- дать локальному `.env` меньший приоритет, чем production env;
- отклонить неверную конфигурацию до старта HTTP-сервера;
- объяснить назначение таймаутов `http.Server`;
- корректно завершить приложение по `SIGINT` и `SIGTERM`;
- закрыть HTTP-сервер перед базой данных и другими зависимостями.

---
prev: /guide/logging-and-debugging/tests.md
next: /guide/logging-and-debugging/best-practices.md
---

# Задания: наблюдаемый TaskStore

Добавим `slog.Logger` в TaskStore и научимся запускать адресные проверки кода. Логирование не заменяет ошибки: Store продолжает возвращать `error`, а logger добавляет контекст для диагностики.

## Задание 1. Создайте logger

В `main` создайте text logger уровня `Debug`, который пишет в `os.Stderr`. Запишите события старта приложения и успешного завершения.

**Критерии проверки:**

- используется `slog.NewTextHandler`;
- output — `os.Stderr`;
- уровень задаётся через `slog.HandlerOptions`;
- есть минимум один `Info` и один `Debug` лог;
- основной вывод программы не смешивается с логами в `stdout`.

<details>
  <summary>Подсказка</summary>

```go
logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
	Level: slog.LevelDebug,
}))
```
</details>

## Задание 2. Внедрите logger в TaskStore

Добавьте поле `logger *slog.Logger` в `TaskStore`. Измените конструктор на:

```go
func NewTaskStore(logger *slog.Logger) *TaskStore
```

Если передан `nil`, используйте `slog.Default()`. В `Add` запишите `Info` для успешного добавления и `Warn` для повторного ID.

**Критерии проверки:**

- logger передаётся через конструктор;
- Store не создаёт новый logger в методах;
- в успешном логе есть `task_id` и `priority`;
- повторный ID логируется как `Warn`;
- метод по-прежнему возвращает `ErrTaskAlreadyExists`.

<details>
  <summary>Подсказка</summary>

```go
if logger == nil {
	logger = slog.Default()
}
```
</details>

<details>
  <summary>Фрагмент решения</summary>

```go
func (store *TaskStore) Add(currentTask task.Task) error {
	store.mu.Lock()
	defer store.mu.Unlock()

	if _, exists := store.tasks[currentTask.ID]; exists {
		store.logger.Warn("задача уже существует", "task_id", currentTask.ID)
		return ErrTaskAlreadyExists
	}

	store.tasks[currentTask.ID] = currentTask
	store.logger.Info("задача добавлена", "task_id", currentTask.ID, "priority", currentTask.Priority)
	return nil
}
```
</details>

## Задание 3. Сделайте logger тихим в тестах

Напишите helper `newTestLogger() *slog.Logger`, который создаёт logger с `io.Discard`. Используйте его во всех unit-тестах `TaskStore`.

**Критерии проверки:**

- импортирован `io`;
- handler получает `io.Discard`;
- тесты продолжают проверять состояние Store и ошибки;
- проверка текста логов не требуется;
- `go test ./...` не засоряется логами Store.

<details>
  <summary>Решение</summary>

```go
func newTestLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}
```
</details>

## Задание 4. Залогируйте экспорт

Напишите обёртку `saveTasksWithLog`, которая измеряет длительность `storage.SaveTasks`, логирует успешное сохранение на уровне `Info` и ошибку на уровне `Error`.

**Критерии проверки:**

- время начала сохраняется через `time.Now()`;
- длительность вычисляется через `time.Since`;
- успешный лог содержит `path`, `task_count` и `duration`;
- ошибочный лог содержит те же поля и `err`;
- функция возвращает исходную ошибку вызывающему коду.

<details>
  <summary>Подсказка</summary>

```go
startedAt := time.Now()
err := storage.SaveTasks(path, tasks)
duration := time.Since(startedAt)
```
</details>

## Задание 5. Примените диагностический workflow

Выполните команды из корня Task Manager API:

```bash
go vet ./...
go test ./...
go test -race ./...
go test -v ./internal/store
go test -count=1 ./...
```

Затем запустите один тест Store через `-run`. Если доступен VS Code или GoLand, поставьте breakpoint внутри `TaskStore.Add`, запустите тест в Debug и посмотрите `currentTask` и `store.tasks`.

**Критерии проверки:**

- `go vet` выполняется без замечаний;
- обычные и race-тесты проходят;
- запуск одного теста использует `-run`;
- вы можете объяснить разницу между логом, тестом и breakpoint.

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- выбрать корректный уровень лога;
- добавить структурированные поля к событию;
- передать logger как зависимость;
- отключить вывод logger в unit-тестах;
- запустить `go vet`, отдельный тест и race detector;
- начать анализ stack trace и CPU-профиля с конкретной гипотезой.

## Полный исходный код

Здесь будет размещён полный исходный код к практическим заданиям этой главы.

<ExampleSource
  path="examples/26/logging-and-debugging"
  description="заготовка для полного исходного кода практических заданий главы"
/>

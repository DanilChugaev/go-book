---
prev: /guide/context/best-practices.md
next: /guide/logging-and-debugging/tests.md
---

# Логирование и отладка

## Цель урока

Научиться писать структурированные логи через `log/slog`, выбирать уровень сообщения, добавлять полезный контекст к операциям Task Manager API и применять основные инструменты диагностики Go.

Лог — это сообщение для разработчика или оператора приложения. Он отвечает на вопросы: что произошло, когда, с какими данными и почему операция не выполнилась. Лог не заменяет возврат `error`: ошибка сообщает о проблеме вызывающему коду, а лог помогает наблюдать работу приложения.

## Пакет `log/slog`

`log/slog` — стандартный пакет структурированного логирования Go. Вместо свободного текста он записывает сообщение вместе с полями:

```go
logger.Info("задача добавлена", "task_id", 1, "priority", 2)
```

Текстовый вывод может выглядеть так:

```text
time=2026-10-13T12:00:00.000Z level=INFO msg="задача добавлена" task_id=1 priority=2
```

Отдельные поля позволяют искать и фильтровать логи по `task_id`, уровню или другому атрибуту. Не собирайте такую информацию вручную в длинную строку:

```go
// Менее удобно для поиска и обработки:
// logger.Info(fmt.Sprintf("задача %d добавлена с приоритетом %d", id, priority))
```

## Уровни логов

Основные уровни `slog`:

| Уровень | Когда использовать |
| --- | --- |
| `Debug` | Детали, полезные при локальной диагностике |
| `Info` | Нормальные значимые события приложения |
| `Warn` | Необычная ситуация, с которой приложение продолжает работу |
| `Error` | Операция не выполнилась и требует внимания |

Примеры:

```go
logger.Debug("начало сохранения задач", "count", len(tasks))
logger.Info("задача выполнена", "task_id", id)
logger.Warn("дедлайн задачи истёк", "task_id", id)
logger.Error("не удалось сохранить задачи", "err", err)
```

Не записывайте успешное событие на уровне `Error` и не превращайте каждое действие в `Info`: слишком шумные логи перестают быть полезными.

## Создание logger

`slog.Default()` доступен без настройки:

```go
slog.Info("приложение запущено")
```

Для явной настройки создайте logger и handler. Text handler удобен локально:

```go
logger := slog.New(
	slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}),
)
```

JSON handler подходит для production-среды, где логи собирает платформа или внешний сервис:

```go
logger := slog.New(
	slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}),
)
```

Вывод JSON-лога:

```json
{"time":"2026-10-13T12:00:00Z","level":"INFO","msg":"задача добавлена","task_id":1}
```

Пишем логи в `stderr`, а основной полезный вывод CLI оставляем в `stdout`. Это помогает отделить данные программы от диагностики.

## Поля и группы

Ключи полей должны быть стабильными и понятными:

```go
logger.Info(
	"задача переименована",
	"task_id", currentTask.ID,
	"old_title", oldTitle,
	"new_title", currentTask.Title,
)
```

Связанный контекст можно один раз добавить к дочернему logger:

```go
taskLogger := logger.With("task_id", currentTask.ID)

taskLogger.Info("задача выполнена")
taskLogger.Info("экспорт задачи подготовлен")
```

Не используйте в логах чувствительные данные: пароли, токены доступа, содержимое авторизационных заголовков, персональные данные без необходимости.

## Logger в TaskStore

Передавайте logger как зависимость, а не создавайте его внутри каждого метода. Это даёт приложению контроль над форматом и уровнем логов, а тестам — возможность отключить вывод.

```go
type TaskStore struct {
	mu     sync.RWMutex
	tasks  map[int]task.Task
	logger *slog.Logger
}

func NewTaskStore(logger *slog.Logger) *TaskStore {
	if logger == nil {
		logger = slog.Default()
	}

	return &TaskStore{
		tasks:  make(map[int]task.Task),
		logger: logger,
	}
}
```

Метод `Add` логирует успех и ошибку дубликата:

```go
func (store *TaskStore) Add(currentTask task.Task) error {
	store.mu.Lock()
	defer store.mu.Unlock()

	if _, exists := store.tasks[currentTask.ID]; exists {
		store.logger.Warn("задача уже существует", "task_id", currentTask.ID)
		return ErrTaskAlreadyExists
	}

	store.tasks[currentTask.ID] = currentTask
	store.logger.Info(
		"задача добавлена",
		"task_id", currentTask.ID,
		"priority", currentTask.Priority,
	)
	return nil
}
```

Лог находится рядом с событием, но метод по-прежнему возвращает `error`: вызывающий код сам решает, как завершить сценарий.

## Логирование ошибок экспорта

Для измерения длительности операции используйте `time.Since`:

```go
func saveTasks(logger *slog.Logger, path string, tasks []task.Task) error {
	startedAt := time.Now()

	if err := storage.SaveTasks(path, tasks); err != nil {
		logger.Error(
			"не удалось сохранить JSON-экспорт",
			"path", path,
			"task_count", len(tasks),
			"duration", time.Since(startedAt),
			"err", err,
		)
		return err
	}

	logger.Info(
		"JSON-экспорт сохранён",
		"path", path,
		"task_count", len(tasks),
		"duration", time.Since(startedAt),
	)
	return nil
}
```

Логируйте операционный контекст: путь, число задач, длительность. Не нужно одновременно выводить ту же ошибку в каждом нижнем уровне приложения: это создаёт дублирующиеся записи. Обычно ошибка логируется на границе, где её окончательно обрабатывают — например, в `main`, HTTP handler или фоновом worker.

## Тестирование кода с logger

Тесты не должны засорять вывод. Передайте logger с handler, который пишет в `io.Discard`:

```go
func newTestLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func TestTaskStoreAdd(t *testing.T) {
	store := NewTaskStore(newTestLogger())

	if err := store.Add(task.Task{ID: 1, Title: "Купить молоко", Priority: 2}); err != nil {
		t.Fatalf("Add вернул ошибку: %v", err)
	}
}
```

В unit-тесте обычно проверяйте поведение Store, а не текст лога. Логи стоит проверять отдельно только если они являются частью явного контракта системы, например для аудита или интеграции с мониторингом.

## `go vet`

`go vet` анализирует распространённые подозрительные конструкции, которые компилятор может не считать ошибкой:

```bash
go vet ./...
```

Запускайте его вместе с тестами:

```bash
go vet ./...
go test ./...
go test -race ./...
```

`go vet` не заменяет тесты и code review, но должен стать обычной частью локальной проверки и будущего CI.

## Адресный запуск тестов

Во время отладки не обязательно запускать весь набор:

```bash
go test ./internal/task -run '^TestTaskRename$'
go test ./internal/store -run 'TestTaskStoreConcurrentUpdate'
```

Флаг `-v` показывает имена тестов и subtests:

```bash
go test -v ./internal/task
```

Для повторного запуска теста без кэша используйте `-count=1`:

```bash
go test -count=1 ./...
```

Это особенно полезно для отладки конкурентного или файлового кода.

## Stack trace и panic

Если panic не перехвачена, Go выводит stack trace: последовательность вызовов, приведших к проблеме.

```text
panic: runtime error: index out of range

goroutine 1 [running]:
example.com/task-manager/internal/task.(*TaskStore).Get(...)
    /project/internal/task/store.go:42
main.main()
    /project/main.go:18
```

Начните чтение с первой строки вашего проекта: она обычно показывает место возникновения проблемы. Затем двигайтесь по стеку к вызывающему коду. Не скрывайте panic через `recover`, пока не поняли причину.

## Отладчик IDE

Расширение Go для VS Code и GoLand поддерживают Delve — стандартный отладчик Go. Минимальный workflow:

1. поставьте breakpoint слева от строки кода;
2. запустите Debug для пакета или теста;
3. посмотрите переменные и стек вызовов;
4. используйте Step Over и Step Into;
5. после понимания проблемы исправьте код и закрепите её тестом.

Отладчик полезен для сложных ветвей и состояния, но не заменяет логирование и автоматические тесты.

## Первое знакомство с `pprof`

Профилирование нужно, когда измерения указывают на проблему производительности. Не добавляйте `pprof` «на всякий случай» и не оптимизируйте без данных.

Для CPU-профиля тестов:

```bash
go test -cpuprofile=cpu.out ./internal/store
go tool pprof cpu.out
```

Для memory-профиля:

```bash
go test -memprofile=mem.out ./internal/store
go tool pprof mem.out
```

В интерактивном `pprof` начните с команды `top`, чтобы увидеть функции с наибольшими затратами. Полноценные benchmarks и profiling будут расширены в продвинутом блоке.

## Частые ошибки

### Логировать ошибку и возвращать её на каждом уровне

```go
func saveTasks(...) error {
	if err := storage.SaveTasks(...); err != nil {
		logger.Error("ошибка", "err", err)
		return err
	}
}
```

Если `main` или HTTP handler тоже залогирует эту ошибку, получится несколько одинаковых записей. Выберите границу окончательной обработки и логируйте ошибку там.

### Логировать только текст

```go
logger.Info("задача 42 добавлена")
```

Лучше добавить поле:

```go
logger.Info("задача добавлена", "task_id", 42)
```

### Проверять только логи вместо результата

Лог подтверждает наблюдаемость, но не заменяет проверку контракта метода. Тест `TaskStore.Add` должен проверять, что задача добавлена или вернулась ожидаемая ошибка.

### Профилировать без гипотезы

Сначала зафиксируйте проблему: медленный запрос, большая аллокация или перегруженный CPU. Затем снимайте профиль, анализируйте его и измеряйте результат изменения.

## Дальше

Закрепите `slog` и диагностический workflow. Далее Task Manager API станет HTTP-сервером, который будет принимать и возвращать JSON.

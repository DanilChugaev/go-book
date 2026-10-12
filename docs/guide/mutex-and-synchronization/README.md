---
prev: /guide/select-and-timeouts/practice.md
next: /guide/mutex-and-synchronization/tests.md
---

# Mutex и синхронизация

## Цель урока

Научиться распознавать гонки данных, защищать общее изменяемое состояние через `sync.Mutex` и `sync.RWMutex`, а также создать безопасное хранилище задач `TaskStore`.

Каналы подходят для передачи данных между goroutine. Но иногда несколько goroutine должны обращаться к одной структуре данных — например, к map задач. В этом случае доступ нужно синхронизировать мьютексом.

## Что такое гонка данных

Гонка данных (data race) возникает, когда несколько goroutine одновременно обращаются к одной переменной, хотя бы одна из них пишет, и доступ не синхронизирован.

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	completedExports := 0

	for range 2 {
		wg.Add(1)

		go func() {
			defer wg.Done()
			completedExports++
		}()
	}

	wg.Wait()
	fmt.Println(completedExports)
}
```

Иногда этот пример напечатает `2`, но это не делает код корректным: две goroutine могут одновременно прочитать старое значение и записать одинаковый результат.

Проверяйте конкурентный код детектором гонок:

```bash
go run -race .
go test -race ./...
```

Детектор не доказывает отсутствие всех проблем, но часто находит реальные ошибки во время выполнения тестов или программы.

## `sync.Mutex`

`sync.Mutex` допускает только одну goroutine в критическую секцию одновременно:

```go
var mu sync.Mutex

mu.Lock()
// Работа с общими изменяемыми данными.
mu.Unlock()
```

Исправим счётчик:

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	var mu sync.Mutex
	completedExports := 0

	for range 2 {
		wg.Add(1)

		go func() {
			defer wg.Done()

			mu.Lock()
			completedExports++
			mu.Unlock()
		}()
	}

	wg.Wait()
	fmt.Println(completedExports) // 2
}
```

Мьютекс не хранит данные сам. Он защищает данные, с которыми договорились работать только между `Lock` и `Unlock`.

## `defer Unlock`

После успешного `Lock` обычно сразу пишут `defer Unlock`:

```go
mu.Lock()
defer mu.Unlock()

// Критическая секция.
```

Это защищает от забытого `Unlock`, если функция выйдет раньше через `return`:

```go
func updateTitle(mu *sync.Mutex, titles map[int]string, id int, title string) bool {
	mu.Lock()
	defer mu.Unlock()

	if _, exists := titles[id]; !exists {
		return false
	}

	titles[id] = title
	return true
}
```

Не вызывайте `defer mu.Unlock()` до `mu.Lock()`: будет попытка разблокировать незаблокированный мьютекс и panic.

## TaskStore: общее хранилище задач

Создадим структуру, которая хранит map задач и защищает её мьютексом:

```go
type TaskStore struct {
	mu    sync.RWMutex
	tasks map[int]task.Task
}
```

Мьютекс делают полем той же структуры, что и защищаемые данные. Так легче увидеть правило: поле `tasks` читается и меняется только через методы `TaskStore`.

Конструктор создаёт готовое к работе хранилище:

```go
func NewTaskStore() *TaskStore {
	return &TaskStore{
		tasks: make(map[int]task.Task),
	}
}
```

Возвращаем указатель на `TaskStore`: мьютекс нельзя копировать после первого использования, а всем goroutine нужно обращаться к одному хранилищу.

## Запись: `Lock`

Метод `Add` меняет map, поэтому использует `Lock`:

```go
var ErrTaskAlreadyExists = errors.New("задача с таким ID уже существует")

func (store *TaskStore) Add(currentTask task.Task) error {
	store.mu.Lock()
	defer store.mu.Unlock()

	if _, exists := store.tasks[currentTask.ID]; exists {
		return ErrTaskAlreadyExists
	}

	store.tasks[currentTask.ID] = currentTask
	return nil
}
```

Проверка наличия ключа и добавление выполняются под одним мьютексом. Если разблокировать map между этими действиями, другая goroutine сможет добавить задачу с тем же ID.

## Чтение: `RLock`

`sync.RWMutex` расширяет обычный мьютекс:

- `Lock` / `Unlock` — эксклюзивный доступ для записи;
- `RLock` / `RUnlock` — совместный доступ для чтения несколькими goroutine.

Метод `Get` только читает map:

```go
func (store *TaskStore) Get(id int) (task.Task, bool) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	currentTask, exists := store.tasks[id]
	return currentTask, exists
}
```

Несколько читателей могут работать одновременно. Но если идёт запись через `Lock`, новые читатели и писатели подождут.

Для небольшого проекта можно начать с `sync.Mutex` для всех операций. `RWMutex` полезен, когда чтений заметно больше, чем записей, и только после измерений или понятной причины. Здесь он нужен для знакомства с разделением чтения и записи.

## Изменение задачи в TaskStore

Задача хранится в map значением. Поэтому получаем копию, меняем её и сохраняем обратно — всё под одним `Lock`:

```go
var ErrTaskNotFound = errors.New("задача не найдена")

func (store *TaskStore) Rename(id int, title string) error {
	store.mu.Lock()
	defer store.mu.Unlock()

	currentTask, exists := store.tasks[id]
	if !exists {
		return ErrTaskNotFound
	}

	if err := currentTask.Rename(title); err != nil {
		return err
	}

	store.tasks[id] = currentTask
	return nil
}
```

Метод `Complete` устроен так же:

```go
func (store *TaskStore) Complete(id int) error {
	store.mu.Lock()
	defer store.mu.Unlock()

	currentTask, exists := store.tasks[id]
	if !exists {
		return ErrTaskNotFound
	}

	currentTask.Complete()
	store.tasks[id] = currentTask
	return nil
}
```

## Полный пример

```go
package main

import (
	"errors"
	"fmt"
	"sync"

	"example.com/task-manager/internal/task"
)

var (
	ErrTaskNotFound      = errors.New("задача не найдена")
	ErrTaskAlreadyExists = errors.New("задача с таким ID уже существует")
)

type TaskStore struct {
	mu    sync.RWMutex
	tasks map[int]task.Task
}

func NewTaskStore() *TaskStore {
	return &TaskStore{tasks: make(map[int]task.Task)}
}

func (store *TaskStore) Add(currentTask task.Task) error {
	store.mu.Lock()
	defer store.mu.Unlock()

	if _, exists := store.tasks[currentTask.ID]; exists {
		return ErrTaskAlreadyExists
	}

	store.tasks[currentTask.ID] = currentTask
	return nil
}

func (store *TaskStore) Get(id int) (task.Task, bool) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	currentTask, exists := store.tasks[id]
	return currentTask, exists
}

func (store *TaskStore) Complete(id int) error {
	store.mu.Lock()
	defer store.mu.Unlock()

	currentTask, exists := store.tasks[id]
	if !exists {
		return ErrTaskNotFound
	}

	currentTask.Complete()
	store.tasks[id] = currentTask
	return nil
}

func main() {
	store := NewTaskStore()
	_ = store.Add(task.Task{ID: 1, Title: "Купить молоко", Priority: 2})

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		_ = store.Complete(1)
	}()

	go func() {
		defer wg.Done()
		_, _ = store.Get(1)
	}()

	wg.Wait()

	if currentTask, exists := store.Get(1); exists {
		fmt.Println(currentTask.Summary())
	}
}
```

Для краткости в `main` ошибки методов игнорируются через `_`. В реальном приложении их нужно обрабатывать; в практических заданиях ниже это будет сделано явно.

## WaitGroup и Mutex решают разные задачи

Эти инструменты часто используются вместе, но отвечают на разные вопросы:

| Инструмент | Вопрос |
| --- | --- |
| `sync.WaitGroup` | «Когда все goroutine закончили?» |
| `sync.Mutex` / `sync.RWMutex` | «Кто сейчас может обратиться к общим изменяемым данным?» |
| Канал | «Как передать значение или сигнал между goroutine?» |

`WaitGroup` не делает map безопасной, а мьютекс не ждёт завершения goroutine.

## Не копируйте Mutex и RWMutex

Не копируйте `TaskStore` после того, как он начал использоваться:

```go
store := NewTaskStore()
// copiedStore := *store // нельзя: копируется уже используемый RWMutex
```

Передавайте `*TaskStore` в функции и храните один экземпляр хранилища. Правило аналогично `WaitGroup`: объекты синхронизации используют через указатель.

## Не держите мьютекс во время медленной работы

Критическая секция должна быть короткой. Не выполняйте запись файла, HTTP-запрос или долгие вычисления под `Lock`:

```go
// Плохо: остальные goroutine не смогут работать с store,
// пока выполняется медленный экспорт.
// store.mu.Lock()
// exportJSON("tasks.json", tasks)
// store.mu.Unlock()
```

Сначала под блокировкой получите нужные данные, затем разблокируйте хранилище и выполняйте медленную работу отдельно. Создание безопасной копии списка задач разберём, когда TaskStore получит метод `List`.

## Частые ошибки

### Открыть без закрытия

```go
store.mu.Lock()

if task.ID <= 0 {
	return errors.New("некорректный ID") // Unlock не вызван
}
```

После `Lock` сразу используйте `defer store.mu.Unlock()`.

### Использовать `RLock` для записи

```go
store.mu.RLock()
store.tasks[id] = currentTask // ошибка логики: RLock только для чтения
store.mu.RUnlock()
```

Любое изменение map требует `Lock`.

### Записать в map из нескольких goroutine без мьютекса

```go
// store.tasks[id] = currentTask // опасно без Lock
```

Map не поддерживает конкурентное чтение и запись без синхронизации. Используйте методы `TaskStore` и проверяйте программу с `-race`.

### Копировать Mutex

Не передавайте `sync.Mutex`, `sync.RWMutex` и `sync.WaitGroup` по значению после первого использования. Передавайте указатель на структуру, которая их содержит.

## Дальше

Закрепите безопасный `TaskStore` на практике. Затем перейдём к `context`: он позволит отменять долгие операции и передавать дедлайны по цепочке вызовов.

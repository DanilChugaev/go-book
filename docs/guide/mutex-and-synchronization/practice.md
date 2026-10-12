---
prev: /guide/mutex-and-synchronization/tests.md
next: /guide/context/README.md
---

# Практика: безопасный TaskStore

Task Manager API теперь хранит задачи в общей map, к которой могут одновременно обращаться несколько goroutine. Обернём map в `TaskStore` и защитим операции `Add`, `Get`, `Rename` и `Complete`.

## Задание 1. Создайте TaskStore

Создайте структуру `TaskStore` с полями:

```go
mu    sync.RWMutex
tasks map[int]task.Task
```

Добавьте конструктор `NewTaskStore() *TaskStore`, который создаёт пустую map.

**Критерии проверки:**

- импортирован `sync`;
- `tasks` имеет тип `map[int]task.Task`;
- используется `sync.RWMutex`;
- конструктор возвращает указатель;
- map инициализируется через `make`.

<details>
  <summary>Подсказка</summary>

```go
func NewTaskStore() *TaskStore {
	return &TaskStore{
		tasks: make(map[int]task.Task),
	}
}
```
</details>

## Задание 2. Добавьте Add и Get

Добавьте метод `Add(currentTask task.Task) error`, который не допускает повторный ID, и метод `Get(id int) (task.Task, bool)`.

**Критерии проверки:**

- `Add` использует `Lock` и `defer Unlock`;
- `Get` использует `RLock` и `defer RUnlock`;
- повторный ID возвращает `ErrTaskAlreadyExists`;
- `Get` возвращает структуру и признак наличия;
- map нигде не читается и не меняется без мьютекса.

<details>
  <summary>Подсказка</summary>

```go
store.mu.Lock()
defer store.mu.Unlock()
```

Для чтения замените `Lock` на `RLock`.
</details>

<details>
  <summary>Решение</summary>

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

func (store *TaskStore) Get(id int) (task.Task, bool) {
	store.mu.RLock()
	defer store.mu.RUnlock()

	currentTask, exists := store.tasks[id]
	return currentTask, exists
}
```
</details>

## Задание 3. Добавьте Rename и Complete

Добавьте методы `Rename(id int, title string) error` и `Complete(id int) error`. Если ID не найден, верните `ErrTaskNotFound`. Полученную из map задачу измените и сохраните обратно.

**Критерии проверки:**

- оба метода используют `Lock`, а не `RLock`;
- ошибка отсутствующей задачи возвращается до изменения;
- `Rename` использует `currentTask.Rename(title)`;
- `Complete` использует `currentTask.Complete()`;
- изменённая задача сохраняется как `store.tasks[id] = currentTask`.

<details>
  <summary>Подсказка</summary>

```go
currentTask, exists := store.tasks[id]
if !exists {
	return ErrTaskNotFound
}
```
</details>

<details>
  <summary>Решение</summary>

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
</details>

## Задание 4. Проверьте конкурентный доступ

Создайте `TaskStore`, добавьте задачу с ID `1`, затем запустите две goroutine:

- первая вызывает `store.Complete(1)`;
- вторая вызывает `store.Rename(1, "Купить продукты")`.

Дождитесь обеих через `WaitGroup`, получите задачу через `Get` и выведите её. Затем запустите программу с `go run -race .`.

**Критерии проверки:**

- используется один `TaskStore`;
- `WaitGroup` ждёт обе goroutine;
- ошибки `Rename` и `Complete` не игнорируются: их можно вывести из goroutine;
- итоговая задача имеет `Completed: true` и новое название;
- `go run -race .` не сообщает о гонке данных.

<details>
  <summary>Подсказка</summary>

Не передавайте `TaskStore` по значению. Обе goroutine должны замкнуть одну переменную `store`, которая содержит указатель.
</details>

<details>
  <summary>Возможное решение</summary>

```go
store := NewTaskStore()

if err := store.Add(task.Task{ID: 1, Title: "Купить молоко", Priority: 2}); err != nil {
	fmt.Println(err)
	return
}

var wg sync.WaitGroup
wg.Add(2)

go func() {
	defer wg.Done()
	if err := store.Complete(1); err != nil {
		fmt.Println("Не удалось выполнить задачу:", err)
	}
}()

go func() {
	defer wg.Done()
	if err := store.Rename(1, "Купить продукты"); err != nil {
		fmt.Println("Не удалось переименовать задачу:", err)
	}
}()

wg.Wait()

if currentTask, exists := store.Get(1); exists {
	fmt.Println(currentTask.Summary())
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- объяснить, что такое гонка данных;
- запустить программу с `go run -race .`;
- защитить запись через `Lock` и `defer Unlock`;
- защитить чтение через `RLock` и `defer RUnlock`;
- объяснить разницу задач `WaitGroup`, мьютекса и канала;
- не копировать структуру с уже используемым мьютексом.

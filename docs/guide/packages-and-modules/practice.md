---
prev: /guide/packages-and-modules/tests.md
next: /guide/packages-and-modules/best-practices.md
---

# Задания: пакет internal/task

Разделим Task Manager API на точку входа и внутренний пакет модели. Все команды выполняйте из корня модуля `task-manager`.

## Задание 1. Создайте структуру проекта

Создайте новый модуль `example.com/task-manager` с файлами:

```text
task-manager/
├── go.mod
├── main.go
└── internal/
    └── task/
        └── task.go
```

В `internal/task/task.go` напишите `package task`. В `main.go` оставьте `package main`.

**Критерии проверки:**

- `go.mod` содержит `module example.com/task-manager`;
- папка `internal/task` существует;
- `task.go` и `main.go` имеют разные package, потому что находятся в разных папках;
- `go run .` из корня модуля запускается без ошибки, даже если `main` пока пустая.

<details>
  <summary>Подсказка</summary>

В терминале из корня проекта:

```bash
mkdir -p internal/task
touch main.go internal/task/task.go
```

В Windows создайте папки и файлы через проводник или используйте команды PowerShell.
</details>

<details>
  <summary>Минимальное решение</summary>

`main.go`:

```go
package main

func main() {}
```

`internal/task/task.go`:

```go
package task
```
</details>

## Задание 2. Вынесите Task в пакет

Перенесите тип `Task` в `internal/task/task.go`. Добавьте метод `Summary() string` и ошибку `ErrEmptyTitle`.

**Критерии проверки:**

- тип называется `Task` и экспортируется;
- `Summary` экспортируется и использует `fmt.Sprintf`;
- `ErrEmptyTitle` экспортируется и создана через `errors.New`;
- в `main.go` больше нет объявления `Task`.

<details>
  <summary>Подсказка</summary>

Понадобятся импорты:

```go
import (
	"errors"
	"fmt"
)
```
</details>

<details>
  <summary>Решение</summary>

`internal/task/task.go`:

```go
package task

import (
	"errors"
	"fmt"
)

var ErrEmptyTitle = errors.New("название задачи не должно быть пустым")

type Task struct {
	ID        int
	Title     string
	Priority  int
	Completed bool
}

func (task Task) Summary() string {
	return fmt.Sprintf("%d. %s | приоритет: %d", task.ID, task.Title, task.Priority)
}
```
</details>

## Задание 3. Импортируйте внутренний пакет

В `main.go` импортируйте `example.com/task-manager/internal/task`, создайте `task.Task` и выведите его `Summary()`.

**Критерии проверки:**

- путь импорта начинается с module path из `go.mod`;
- задача создаётся как `task.Task{...}`;
- `main.go` не дублирует тип `Task`;
- `go run .` выводит summary.

<details>
  <summary>Подсказка</summary>

```go
import (
	"fmt"

	"example.com/task-manager/internal/task"
)
```
</details>

<details>
  <summary>Решение</summary>

`main.go`:

```go
package main

import (
	"fmt"

	"example.com/task-manager/internal/task"
)

func main() {
	currentTask := task.Task{
		ID:       1,
		Title:    "Купить молоко",
		Priority: 2,
	}

	fmt.Println(currentTask.Summary())
}
```
</details>

## Задание 4. Экспортируйте только нужное

Добавьте в пакет `task` неэкспортируемую функцию `validateTitle(title string) error`, которая возвращает `ErrEmptyTitle` для пустой строки. Затем добавьте экспортируемый метод `Rename(title string) error`, использующий эту функцию.

В `main.go` переименуйте задачу и обработайте `task.ErrEmptyTitle` через `errors.Is`. Не пытайтесь вызвать `task.validateTitle` из `main`.

**Критерии проверки:**

- `validateTitle` начинается со строчной буквы;
- `Rename` начинается с заглавной буквы и доступен из `main`;
- `main` может проверить `task.ErrEmptyTitle`;
- внутренняя проверка не вызывается напрямую из `main`.

<details>
  <summary>Подсказка</summary>

В методе пакета:

```go
if err := validateTitle(title); err != nil {
	return err
}
```
</details>

<details>
  <summary>Возможное решение</summary>

Добавьте в `internal/task/task.go`:

```go
func validateTitle(title string) error {
	if len(title) == 0 {
		return ErrEmptyTitle
	}

	return nil
}

func (task *Task) Rename(title string) error {
	if err := validateTitle(title); err != nil {
		return err
	}

	task.Title = title
	return nil
}
```

В `main.go`:

```go
if err := currentTask.Rename(""); err != nil {
	if errors.Is(err, task.ErrEmptyTitle) {
		fmt.Println("Введите название задачи")
		return
	}

	fmt.Println(err)
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- объяснить разницу между модулем и пакетом;
- найти module path в `go.mod`;
- создать импорт собственного пакета;
- отличить экспортируемое имя от неэкспортируемого;
- объяснить назначение папки `internal`;
- разделить модель и запуск приложения по разным пакетам.

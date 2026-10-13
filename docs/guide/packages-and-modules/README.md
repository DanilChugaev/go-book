---
prev: /guide/defer-panic-recover/best-practices.md
next: /guide/packages-and-modules/tests.md
---

# Пакеты и модули

## Цель урока

Научиться разделять Go-проект на пакеты, понимать роль `go.mod`, импортировать собственный код и вынести модель Task Manager API из `main` в пакет `internal/task`.

До этого все примеры помещались в один файл `main.go`. Такой подход удобен для обучения, но реальное приложение быстро становится сложным. Пакеты позволяют разделить код по ответственности.

## Пакет и модуль — разные уровни

**Пакет** — набор Go-файлов одной папки с одинаковым объявлением `package`. Пакет объединяет связанную логику.

```go
package task
```

**Модуль** — проект или часть проекта с файлом `go.mod`. Он задаёт module path и управляет зависимостями.

```text
task-manager/
├── go.mod
├── main.go
└── internal/
    └── task/
        └── task.go
```

В этой структуре:

- `task-manager` — корень модуля;
- `main.go` — пакет `main`, точка входа программы;
- `internal/task` — отдельный пакет `task` с моделью задачи;
- `go.mod` описывает весь модуль.

Один модуль может содержать много пакетов. Один пакет может состоять из нескольких `.go`-файлов одной папки.

## Файл `go.mod`

Создать модуль можно командой:

```bash
go mod init example.com/task-manager
```

Она создаст `go.mod`:

```go
module example.com/task-manager

go 1.26.0
```

Строка версии зависит от установленной версии Go и может отличаться. Не редактируйте её без причины.

Module path нужен инструментам Go для определения импортов внутри проекта и для поиска внешних модулей. Для учебного проекта допустимо `example.com/task-manager`. Если репозиторий будет опубликован на GitHub, путь обычно совпадает с его URL, например `github.com/username/task-manager`.

## Пакет `main`

Исполняемая программа должна иметь пакет `main` и функцию `main`:

```go
package main

func main() {
	// Точка входа приложения.
}
```

Остальные пакеты обычно содержат модели, бизнес-логику, работу с хранением данных или HTTP-обработчики. Они не запускаются самостоятельно, а импортируются из `main` или других пакетов.

## Создание пакета `internal/task`

Создадим такую структуру в папке проекта:

```text
task-manager/
├── go.mod
├── main.go
└── internal/
    └── task/
        └── task.go
```

В `internal/task/task.go` объявим пакет и перенесём в него модель задачи:

```go
package task

import (
	"errors"
	"fmt"
)

var (
	ErrTaskIsNil    = errors.New("задача не существует")
	ErrEmptyTitle   = errors.New("название задачи не должно быть пустым")
	ErrTitleTooLong = errors.New("название задачи слишком длинное")
)

type Task struct {
	ID        int
	Title     string
	Priority  int
	Completed bool
}

func (task Task) Summary() string {
	return fmt.Sprintf(
		"%d. %s | приоритет: %d | выполнена: %t",
		task.ID,
		task.Title,
		task.Priority,
		task.Completed,
	)
}

func (task *Task) Rename(title string) error {
	if task == nil {
		return ErrTaskIsNil
	}

	if len(title) == 0 {
		return ErrEmptyTitle
	}

	if len(title) > 120 {
		return ErrTitleTooLong
	}

	task.Title = title
	return nil
}
```

Имя папки `task` и объявление `package task` совпадают. Это распространённое и понятное соглашение. Технически имя пакета и папки могут отличаться, но без веской причины так делать не стоит.

## Импорт собственного пакета

В корневом `main.go` импортируйте пакет по module path и относительному пути до его папки:

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

	if err := currentTask.Rename("Купить продукты"); err != nil {
		fmt.Println("Ошибка:", err)
		return
	}

	fmt.Println(currentTask.Summary())
}
```

У импортированного пакета используются его имя и точка:

```go
currentTask := task.Task{}
fmt.Println(task.ErrEmptyTitle)
```

Путь импорта не начинается с `./` или `../`. Инструменты Go используют module path из `go.mod`.

## Экспортируемые имена

Код другого пакета видит только имена с заглавной буквы:

```go
type Task struct {}      // доступен как task.Task
var ErrEmptyTitle error  // доступна как task.ErrEmptyTitle

func NewTask() Task {}   // доступна как task.NewTask
```

Имена со строчной буквы доступны только внутри своего пакета:

```go
func validateTitle(title string) error {
	return nil
}
```

В `main.go` нельзя вызвать `task.validateTitle`. Это не ошибка стиля, а правило видимости языка.

Экспортируйте только то, что действительно нужно потребителям пакета. Например, `Task`, её методы и известные ошибки нужны `main`, а вспомогательная внутренняя проверка — нет.

## Зачем папка `internal`

Папка `internal` ограничивает импорт её пакетов. Пакет `example.com/task-manager/internal/task` можно импортировать из кода внутри `example.com/task-manager`, но нельзя из другого независимого модуля.

Это хороший выбор для логики конкретного приложения: Task Manager API использует пакет сам, но не обещает его как публичную библиотеку.

```text
example.com/task-manager/main.go                ← может импортировать internal/task
example.com/task-manager/cmd/server/main.go     ← может импортировать internal/task
another.example/app/main.go                      ← не может импортировать internal/task
```

## Несколько файлов одного пакета

Необязательно держать весь пакет в `task.go`. Когда код вырастет, его можно разделить:

```text
internal/task/
├── task.go       # Task и конструкторы
├── validation.go # проверки и ошибки
└── methods.go    # методы Task
```

Во всех файлах первой строкой будет:

```go
package task
```

Файлы одного пакета компилируются вместе. Не нужно импортировать один файл из другого — импортируют пакет, а не файл.

## Полный пример структуры

`go.mod`:

```go
module example.com/task-manager
```

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

func (task *Task) Rename(title string) error {
	if len(title) == 0 {
		return ErrEmptyTitle
	}

	task.Title = title
	return nil
}
```

`main.go`:

```go
package main

import (
	"errors"
	"fmt"

	"example.com/task-manager/internal/task"
)

func main() {
	currentTask := task.Task{ID: 1, Title: "Купить молоко", Priority: 2}

	if err := currentTask.Rename(""); err != nil {
		if errors.Is(err, task.ErrEmptyTitle) {
			fmt.Println("Введите название задачи")
			return
		}

		fmt.Println("Неожиданная ошибка:", err)
		return
	}

	fmt.Println(currentTask.Summary())
}
```

Запуск выполняется из корня модуля:

```bash
go run .
```

## Частые ошибки

### Неверный путь импорта

```go
// import "./internal/task" // не используйте относительный путь
import "example.com/task-manager/internal/task"
```

Первая часть пути должна совпадать со строкой `module` в `go.mod`.

### Импорт не используется

```go
import "example.com/task-manager/internal/task"

func main() {}
```

Go не разрешит неиспользуемый импорт. Удалите его или используйте `task.Task`, `task.ErrEmptyTitle` и другие экспортируемые имена.

### Имя начинается со строчной буквы

```go
// task.validateTitle("Купить молоко") // недоступно из main
```

Если это часть публичного API пакета, назовите её `ValidateTitle`. Но не экспортируйте вспомогательную функцию только ради того, чтобы обойти правило видимости.

### Разные package в одной папке

```go
// internal/task/task.go
package task

// internal/task/validation.go
// package validation // ошибка: в одной папке должен быть один пакет
```

Оба файла должны использовать `package task`.

## Дальше

Закрепите разделение Task Manager API на `main` и `internal/task`. Затем начнём работать с файлами, чтобы сохранять задачи между запусками программы.

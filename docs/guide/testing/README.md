---
prev: /guide/packages-and-modules/best-practices.md
next: /guide/testing/tests.md
---

# Тестирование

## Цель урока

Научиться писать unit-тесты с пакетом `testing`, запускать их через `go test`, использовать table-driven tests и subtests, а также проверять известные ошибки через `errors.Is`.

До этой главы Task Manager API проверяли вручную запуском `go run .`. Это полезно, но не гарантирует, что изменение кода не сломало уже работающие правила. Тесты фиксируют ожидаемое поведение и запускаются автоматически.

## Где живут тесты

Тестовый файл заканчивается на `_test.go` и обычно находится рядом с кодом, который проверяет:

```text
internal/
├── task/
│   ├── task.go
│   └── task_test.go
└── store/
    ├── store.go
    └── store_test.go
```

Файлы с суффиксом `_test.go` не входят в обычную сборку приложения, но используются командой `go test`.

## Первый тест

Тест — функция с именем `Test...`, принимающая `*testing.T`:

```go
package task

import "testing"

func TestTaskIsValid(t *testing.T) {
	currentTask := Task{
		ID:       1,
		Title:    "Купить молоко",
		Priority: 2,
	}

	if !currentTask.IsValid() {
		t.Fatal("ожидалась корректная задача")
	}
}
```

Запуск тестов текущего пакета:

```bash
go test
```

Запуск тестов всего модуля:

```bash
go test ./...
```

`./...` означает текущий пакет и все вложенные пакеты модуля. Это основной вариант для проверки проекта целиком.

## `t.Error`, `t.Fatal` и их варианты

`testing.T` предоставляет несколько способов сообщить о проблеме:

| Метод | Поведение |
| --- | --- |
| `t.Error(...)` | Помечает тест неуспешным и продолжает его выполнение |
| `t.Errorf(...)` | То же, но с форматированием |
| `t.Fatal(...)` | Помечает тест неуспешным и завершает текущий тест сразу |
| `t.Fatalf(...)` | То же, но с форматированием |

Используйте `t.Fatal` для условия, без которого дальнейшие проверки бессмысленны:

```go
currentTask, exists := store.Get(1)
if !exists {
	t.Fatal("задача должна существовать")
}

if !currentTask.Completed {
	t.Error("задача должна быть выполненной")
}
```

Если задача не найдена, доступ к её полям уже не имеет смысла. Если поле просто имеет неверное значение, тест может сообщить и о других проблемах той же проверки.

## Проверка результата

Хороший тест содержит три логические части:

1. **Arrange** — подготовить данные;
2. **Act** — вызвать тестируемую операцию;
3. **Assert** — проверить результат.

```go
func TestTaskRename(t *testing.T) {
	// Arrange
	currentTask := Task{ID: 1, Title: "Купить молоко", Priority: 2}

	// Act
	err := currentTask.Rename("Купить продукты")

	// Assert
	if err != nil {
		t.Fatalf("Rename вернул ошибку: %v", err)
	}

	if currentTask.Title != "Купить продукты" {
		t.Errorf("Title = %q, ожидалось %q", currentTask.Title, "Купить продукты")
	}
}
```

Сообщение об ошибке должно показывать фактическое и ожидаемое значение. Это ускоряет диагностику, когда тест не проходит.

## Table-driven tests

Когда одна функция должна корректно обработать несколько похожих сценариев, используйте таблицу тестовых случаев:

```go
func TestTaskRename(t *testing.T) {
	testCases := []struct {
		name      string
		title     string
		wantTitle string
		wantErr   error
	}{
		{
			name:      "корректное название",
			title:     "Купить продукты",
			wantTitle: "Купить продукты",
		},
		{
			name:      "пустое название",
			title:     "",
			wantTitle: "Купить молоко",
			wantErr:   ErrEmptyTitle,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			currentTask := Task{ID: 1, Title: "Купить молоко", Priority: 2}

			err := currentTask.Rename(testCase.title)

			if !errors.Is(err, testCase.wantErr) {
				t.Fatalf("Rename error = %v, ожидалось %v", err, testCase.wantErr)
			}

			if currentTask.Title != testCase.wantTitle {
				t.Errorf("Title = %q, ожидалось %q", currentTask.Title, testCase.wantTitle)
			}
		})
	}
}
```

Таблица делает набор сценариев компактным: добавление нового случая не требует копировать весь тест.

## Subtests: `t.Run`

`t.Run` создаёт вложенный тест с понятным именем:

```go
t.Run("пустое название", func(t *testing.T) {
	// Проверка конкретного сценария.
})
```

Вывод команды покажет, какой именно сценарий сломался:

```text
--- FAIL: TestTaskRename (0.00s)
    --- FAIL: TestTaskRename/пустое_название (0.00s)
```

Можно запустить один тест или один subtest:

```bash
go test -run '^TestTaskRename$'
go test -run 'TestTaskRename/пустое_название'
```

## Проверка ошибок через `errors.Is`

Не сравнивайте текст ошибки и не используйте `err == wantErr`, если ошибка может быть обёрнута:

```go
if !errors.Is(err, ErrEmptyTitle) {
	t.Fatalf("ожидалась ErrEmptyTitle, получено: %v", err)
}
```

`errors.Is` работает и с исходной ошибкой, и с ошибкой внутри цепочки `%w`.

Для успешного случая `wantErr` равен `nil`; `errors.Is(nil, nil)` возвращает `true`, поэтому один и тот же шаблон подходит для обоих вариантов.

## Тестирование Task

В `internal/task/task_test.go` можно проверить правила модели:

```go
package task

import (
	"errors"
	"testing"
)

func TestTaskRename(t *testing.T) {
	currentTask := Task{ID: 1, Title: "Купить молоко", Priority: 2}

	err := currentTask.Rename("   ")
	if !errors.Is(err, ErrEmptyTitle) {
		t.Fatalf("Rename error = %v, ожидалась ErrEmptyTitle", err)
	}

	if currentTask.Title != "Купить молоко" {
		t.Errorf("Title изменился после ошибки: %q", currentTask.Title)
	}
}
```

Тест проверяет не только ошибку, но и важное свойство: неудачное переименование не должно менять исходную задачу.

## Простой Store для unit-тестов

До главы о mutex используем простой Store без конкурентного доступа:

```go
package store

import (
	"errors"

	"example.com/task-manager/internal/task"
)

var (
	ErrTaskNotFound      = errors.New("задача не найдена")
	ErrTaskAlreadyExists = errors.New("задача с таким ID уже существует")
)

type Store struct {
	tasks map[int]task.Task
}

func New() *Store {
	return &Store{tasks: make(map[int]task.Task)}
}

func (store *Store) Add(currentTask task.Task) error {
	if _, exists := store.tasks[currentTask.ID]; exists {
		return ErrTaskAlreadyExists
	}

	store.tasks[currentTask.ID] = currentTask
	return nil
}

func (store *Store) Get(id int) (task.Task, bool) {
	currentTask, exists := store.tasks[id]
	return currentTask, exists
}
```

Этот Store предназначен для последовательного кода. В главе о mutex он будет заменён или расширен потокобезопасным `TaskStore`.

## Тестирование Store

Проверим добавление и получение задачи:

```go
func TestStoreAddAndGet(t *testing.T) {
	store := New()
	wantTask := task.Task{ID: 1, Title: "Купить молоко", Priority: 2}

	if err := store.Add(wantTask); err != nil {
		t.Fatalf("Add вернул ошибку: %v", err)
	}

	gotTask, exists := store.Get(1)
	if !exists {
		t.Fatal("задача не найдена после Add")
	}

	if gotTask != wantTask {
		t.Errorf("Get = %+v, ожидалось %+v", gotTask, wantTask)
	}
}
```

Структура `Task` в текущей версии содержит сравнимые поля, поэтому её можно сравнить целиком через `!=`. Когда в модели появится несравнимое поле, например слайс тегов, сравнение придётся сделать по отдельным полям или использовать `cmp.Diff` из внешней библиотеки после отдельного решения о зависимости.

## Покрытие

Покрытие показывает, какие строки выполнялись во время тестов:

```bash
go test -cover ./...
```

Покрытие — подсказка, а не цель. Высокий процент не гарантирует проверку граничных условий, а низкий процент не означает автоматически плохой код. Важнее тестировать:

- правила бизнеса;
- ошибки и границы;
- код, который легко сломать при изменении;
- уже найденные ранее баги.

## Race detector

Текущий простой Store не должен использоваться несколькими goroutine одновременно. Когда появится потокобезопасный `TaskStore`, запускайте весь набор с детектором гонок:

```bash
go test -race ./...
```

Эта команда особенно важна для тестов конкурентного кода, но полезна и для всего приложения.

## Частые ошибки

### Тест без проверки

```go
func TestTaskRename(t *testing.T) {
	currentTask := Task{Title: "Купить молоко"}
	currentTask.Rename("Купить продукты")
}
```

Такой тест всегда успешен, если код не вызывает panic. Проверяйте ошибку и итоговое состояние.

### Общие изменяемые данные между сценариями

```go
store := New()

for _, testCase := range testCases {
	// Все случаи меняют один Store и влияют друг на друга.
}
```

Создавайте новое состояние внутри каждого `t.Run`, если сценарии должны быть независимыми.

### Сравнение текста ошибки

```go
if err.Error() != "название задачи не должно быть пустым" {
	// Хрупкая проверка.
}
```

Проверяйте причину через `errors.Is`.

### Тестирование деталей вместо поведения

Тест не обязан проверять каждую строку реализации. Проверяйте контракт: что метод вернул, как изменил состояние, какую ошибку сообщил и какие побочные эффекты допустил.

## Дальше

Закрепите unit-тесты модели и Store. Затем вернёмся к файловому вводу-выводу и добавим тесты для JSON-хранилища, когда оно появится в проекте.

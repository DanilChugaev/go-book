---
prev: /guide/errors/tests.md
next: /guide/errors/best-practices.md
---

# Задания: ошибки при переименовании задачи

В этой практике `Rename` возвращает `error` вместо `bool`. Вызывающий код получает не только факт неудачи, но и её причину.

## Задание 1. Ошибки в Rename

Объявите ошибки `ErrTaskIsNil`, `ErrEmptyTitle` и `ErrTitleTooLong`. Напишите метод `Rename(title string) error` для `*Task`.

Метод должен вернуть:

- `ErrTaskIsNil`, если получатель равен `nil`;
- `ErrEmptyTitle`, если строка пуста;
- `ErrTitleTooLong`, если длина превышает 120 байтов;
- `nil`, если название успешно изменено.

**Критерии проверки:**

- ошибки создаются через `errors.New`;
- метод использует pointer receiver;
- исходное название меняется только при `nil`-ошибке;
- успешный вызов возвращает `nil`;
- некорректный вызов не вызывает panic.

<details>
  <summary>Подсказка</summary>

Сигнатура метода:

```go
func (task *Task) Rename(title string) error {
	// ...
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

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
	Title string
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

func main() {
	task := Task{Title: "Купить молоко"}

	if err := task.Rename("Купить продукты"); err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println(task.Title)
}
```
</details>

## Задание 2. Добавьте контекст

Напишите функцию `renameTask(task *Task, title string) error`. Она должна вызывать `task.Rename(title)`. При ошибке верните её с контекстом `не удалось обновить задачу <ID>` через `%w`.

Для задания добавьте в `Task` поле `ID int`.

**Критерии проверки:**

- вызывается `task.Rename(title)`;
- при ошибке используется `fmt.Errorf` и `%w`;
- при успехе возвращается `nil`;
- текст ошибки содержит ID задачи и первоначальную причину.

<details>
  <summary>Подсказка</summary>

```go
if err := task.Rename(title); err != nil {
	return fmt.Errorf("не удалось обновить задачу %d: %w", task.ID, err)
}
```
</details>

<details>
  <summary>Решение</summary>

```go
func renameTask(task *Task, title string) error {
	if task == nil {
		return fmt.Errorf("не удалось обновить задачу: %w", ErrTaskIsNil)
	}

	if err := task.Rename(title); err != nil {
		return fmt.Errorf("не удалось обновить задачу %d: %w", task.ID, err)
	}

	return nil
}
```

Эту функцию нужно добавить к коду из первого задания, где уже импортирован `fmt`.
</details>

## Задание 3. Обработайте известную причину

Создайте задачу с ID `1` и попытайтесь переименовать её в пустую строку через `renameTask`. Если причина — `ErrEmptyTitle`, выведите:

```text
Введите название задачи
```

Для других ошибок выведите исходный текст ошибки.

**Критерии проверки:**

- результат `renameTask` сохраняется в `err`;
- известная причина проверяется через `errors.Is`;
- не используется сравнение `err.Error()` со строкой;
- при пустом названии выводится нужное сообщение.

<details>
  <summary>Подсказка</summary>

```go
if errors.Is(err, ErrEmptyTitle) {
	fmt.Println("Введите название задачи")
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import (
	"errors"
	"fmt"
)

var ErrEmptyTitle = errors.New("название задачи не должно быть пустым")

type Task struct {
	ID    int
	Title string
}

func (task *Task) Rename(title string) error {
	if len(title) == 0 {
		return ErrEmptyTitle
	}

	task.Title = title
	return nil
}

func renameTask(task *Task, title string) error {
	if err := task.Rename(title); err != nil {
		return fmt.Errorf("не удалось обновить задачу %d: %w", task.ID, err)
	}

	return nil
}

func main() {
	task := &Task{ID: 1, Title: "Купить молоко"}
	err := renameTask(task, "")

	if errors.Is(err, ErrEmptyTitle) {
		fmt.Println("Введите название задачи")
		return
	}

	if err != nil {
		fmt.Println(err)
	}
}
```
</details>

## Задание 4. Сохраните задачу без ошибки

Добавьте к предыдущему коду успешный сценарий: вызовите `renameTask(task, "Купить продукты")`. Если ошибки нет, выведите новое название. Убедитесь, что проверка на ошибку выполняется до доступа к результату операции.

**Критерии проверки:**

- успешный вызов возвращает `nil`;
- новое название сохранено в `task.Title`;
- ошибка проверяется через `if err != nil`;
- успешный путь не вложен в большой `else`.

<details>
  <summary>Подсказка</summary>

```go
if err := renameTask(task, "Купить продукты"); err != nil {
	fmt.Println(err)
	return
}

fmt.Println(task.Title)
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- вернуть `error` как последний результат функции или метода;
- вернуть `nil` при успехе;
- создать повторно используемую ошибку через `errors.New`;
- обработать ошибку через ранний `return`;
- добавить контекст через `fmt.Errorf` и `%w`;
- проверить причину через `errors.Is`.

## Полный исходный код

Здесь будет размещён полный исходный код к практическим заданиям этой главы.

<ExampleSource
  path="examples/14/errors"
  description="заготовка для полного исходного кода практических заданий главы"
/>

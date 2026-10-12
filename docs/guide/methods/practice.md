---
prev: /guide/methods/tests.md
next: /guide/methods/best-practices.md
---

# Практика: поведение Task

В этой практике методы только читают данные задачи и возвращают результат. Изменение задачи через методы разберём в следующей главе об указателях.

## Задание 1. Краткое описание задачи

Добавьте к типу `Task` метод `Summary() string`. Он должен возвращать строку вида:

```text
1. Купить молоко | приоритет: 2 | выполнена: false
```

Создайте задачу и выведите результат метода.

**Критерии проверки:**

- метод объявлен с получателем `(task Task)`;
- метод возвращает `string`;
- для форматирования используется `fmt.Sprintf`;
- `main` выводит `task.Summary()`.

<details>
  <summary>Подсказка</summary>

Сигнатура:

```go
func (task Task) Summary() string {
	// return fmt.Sprintf(...)
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

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

func main() {
	task := Task{ID: 1, Title: "Купить молоко", Priority: 2}

	fmt.Println(task.Summary())
}
```
</details>

## Задание 2. Проверка задачи

Добавьте метод `IsValid() bool`. Задача корректна, если:

- ID больше `0`;
- название не пустое и не длиннее 120 байтов;
- приоритет находится в диапазоне от `1` до `3`.

Проверьте одну корректную и одну некорректную задачу.

**Критерии проверки:**

- метод возвращает `bool`;
- все три правила проверяются через `&&`;
- корректная задача даёт `true`;
- задача с пустым названием или приоритетом `4` даёт `false`.

<details>
  <summary>Подсказка</summary>

Все проверки можно вернуть одним выражением из `return`.
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

type Task struct {
	ID        int
	Title     string
	Priority  int
	Completed bool
}

func (task Task) IsValid() bool {
	return task.ID > 0 &&
		len(task.Title) > 0 &&
		len(task.Title) <= 120 &&
		task.Priority >= 1 &&
		task.Priority <= 3
}

func main() {
	validTask := Task{ID: 1, Title: "Купить молоко", Priority: 2}
	invalidTask := Task{ID: 2, Title: "", Priority: 4}

	fmt.Println(validTask.IsValid())
	fmt.Println(invalidTask.IsValid())
}
```
</details>

## Задание 3. Список корректных задач

Создайте слайс из трёх задач, одна из которых некорректна. Выведите `Summary()` только для корректных задач. Используйте `range`, `IsValid()` и `continue`.

**Критерии проверки:**

- используется `[]Task`;
- каждая задача проверяется через `task.IsValid()`;
- некорректная задача пропускается через `continue`;
- для остальных выводится `task.Summary()`.

<details>
  <summary>Подсказка</summary>

```go
for _, task := range tasks {
	if !task.IsValid() {
		continue
	}

	fmt.Println(task.Summary())
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

type Task struct {
	ID        int
	Title     string
	Priority  int
	Completed bool
}

func (task Task) Summary() string {
	return fmt.Sprintf("%d. %s | приоритет: %d | выполнена: %t", task.ID, task.Title, task.Priority, task.Completed)
}

func (task Task) IsValid() bool {
	return task.ID > 0 && len(task.Title) > 0 && len(task.Title) <= 120 && task.Priority >= 1 && task.Priority <= 3
}

func main() {
	tasks := []Task{
		{ID: 1, Title: "Купить молоко", Priority: 2},
		{ID: 2, Title: "", Priority: 4},
		{ID: 3, Title: "Прочитать книгу", Priority: 1},
	}

	for _, task := range tasks {
		if !task.IsValid() {
			continue
		}

		fmt.Println(task.Summary())
	}
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- отличить метод от обычной функции;
- объявить и вызвать метод с получателем `Task`;
- вернуть строку через `fmt.Sprintf`;
- написать метод, который проверяет данные, но не изменяет структуру;
- объяснить, почему получатель по значению не подходит для изменения исходной задачи.

---
prev: /guide/interfaces/tests.md
next: /guide/errors/README.md
---

# Практика: TaskFormatter

В этой практике функция будет работать не с конкретной структурой `Task`, а с любым значением, которое умеет формировать краткое описание.

## Задание 1. Опишите форматируемую задачу

Создайте интерфейс `TaskFormatter` с методом `Summary() string`. Объявите `Task` и добавьте ему метод `Summary`. Затем присвойте задачу переменной типа `TaskFormatter` и выведите summary.

**Критерии проверки:**

- интерфейс содержит только `Summary() string`;
- `Task` имеет метод с точной сигнатурой;
- значение `Task` присваивается переменной типа `TaskFormatter`;
- вызов `formatter.Summary()` возвращает описание задачи.

<details>
  <summary>Подсказка</summary>

```go
type TaskFormatter interface {
	Summary() string
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

type TaskFormatter interface {
	Summary() string
}

type Task struct {
	ID       int
	Title    string
	Priority int
}

func (task Task) Summary() string {
	return fmt.Sprintf("%d. %s | приоритет: %d", task.ID, task.Title, task.Priority)
}

func main() {
	var formatter TaskFormatter = Task{
		ID:       1,
		Title:    "Купить молоко",
		Priority: 2,
	}

	fmt.Println(formatter.Summary())
}
```
</details>

## Задание 2. Вынесите печать в функцию

Напишите функцию `printSummary(formatter TaskFormatter)`. Она должна вывести результат `formatter.Summary()`. Передайте ей обычную задачу.

**Критерии проверки:**

- параметр функции имеет тип `TaskFormatter`;
- функция не зависит от конкретного типа `Task`;
- внутри вызывается `formatter.Summary()`;
- задача передаётся в функцию без дополнительного преобразования.

<details>
  <summary>Подсказка</summary>

```go
func printSummary(formatter TaskFormatter) {
	fmt.Println(formatter.Summary())
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

type TaskFormatter interface {
	Summary() string
}

type Task struct {
	ID       int
	Title    string
	Priority int
}

func (task Task) Summary() string {
	return fmt.Sprintf("%d. %s | приоритет: %d", task.ID, task.Title, task.Priority)
}

func printSummary(formatter TaskFormatter) {
	fmt.Println(formatter.Summary())
}

func main() {
	task := Task{ID: 1, Title: "Купить молоко", Priority: 2}

	printSummary(task)
}
```
</details>

## Задание 3. Добавьте другой форматируемый тип

Создайте тип `Notification` с полем `Message string`. Добавьте ему `Summary() string`, которая возвращает строку `Уведомление: <сообщение>`. Передайте и `Task`, и `Notification` в одну функцию `printSummary`.

**Критерии проверки:**

- `Notification` не содержит полей `Task`;
- у `Notification` есть метод `Summary() string`;
- обе структуры передаются в `printSummary`;
- функция не меняется после добавления нового типа.

<details>
  <summary>Подсказка</summary>

Интерфейс важен именно тем, что `printSummary` уже не нужно менять. Добавьте метод `Summary` новому типу.
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

type TaskFormatter interface {
	Summary() string
}

type Task struct {
	ID       int
	Title    string
	Priority int
}

func (task Task) Summary() string {
	return fmt.Sprintf("%d. %s | приоритет: %d", task.ID, task.Title, task.Priority)
}

type Notification struct {
	Message string
}

func (notification Notification) Summary() string {
	return "Уведомление: " + notification.Message
}

func printSummary(formatter TaskFormatter) {
	fmt.Println(formatter.Summary())
}

func main() {
	task := Task{ID: 1, Title: "Купить молоко", Priority: 2}
	notification := Notification{Message: "Список задач обновлён"}

	printSummary(task)
	printSummary(notification)
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- объявить маленький интерфейс;
- объяснить, почему Task реализует TaskFormatter без `implements`;
- написать функцию, которая принимает интерфейс;
- добавить новый тип с тем же поведением без изменения этой функции;
- определить, нужен ли интерфейсу метод с value receiver или pointer receiver.

---
prev: /guide/pointers/practice.md
next: /guide/interfaces/tests.md
---

# Интерфейсы

## Цель урока

Научиться описывать нужное поведение небольшим интерфейсом, понимать неявную реализацию в Go и писать функции, которые зависят от возможностей значения, а не от конкретного типа.

В Task Manager API задача уже умеет формировать краткое описание через `Summary() string`. Теперь опишем это умение интерфейсом `TaskFormatter` и напишем код, который работает с любым значением, умеющим возвращать summary.

## Что такое интерфейс

Интерфейс определяет набор методов. Он не хранит реализацию этих методов и не описывает поля структуры.

```go
type TaskFormatter interface {
	Summary() string
}
```

`TaskFormatter` означает: «любое значение, у которого есть метод `Summary() string`».

Интерфейс не требует слова `implements`. Тип реализует интерфейс автоматически, если его методы совпадают по имени, параметрам и результатам.

## Task реализует TaskFormatter

```go
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
```

У `Task` есть метод с точной сигнатурой `Summary() string`, поэтому `Task` реализует `TaskFormatter` автоматически.

Проверить это на этапе компиляции можно присваиванием:

```go
var formatter TaskFormatter = Task{
	ID:       1,
	Title:    "Купить молоко",
	Priority: 2,
}

fmt.Println(formatter.Summary())
```

Если сигнатура не совпадает, код не скомпилируется:

```go
// func (task Task) Summary() { }
// var formatter TaskFormatter = Task{} // ошибка: Summary не возвращает string
```

## Функция зависит от поведения

Вместо функции, которая принимает только `Task`, можно принять интерфейс:

```go
func printSummary(formatter TaskFormatter) {
	fmt.Println(formatter.Summary())
}
```

Теперь ей можно передать любую реализацию `TaskFormatter`:

```go
task := Task{
	ID:       1,
	Title:    "Купить молоко",
	Priority: 2,
}

printSummary(task)
```

Функции не важно, есть ли у значения поля `ID`, `Title` или `Completed`. Ей важен только метод `Summary`.

## Ещё одна реализация

Создадим тип для краткого уведомления. Он не является задачей, но тоже может вернуть строковое описание:

```go
type Notification struct {
	Message string
}

func (notification Notification) Summary() string {
	return "Уведомление: " + notification.Message
}
```

Он автоматически реализует тот же интерфейс:

```go
task := Task{ID: 1, Title: "Купить молоко", Priority: 2}
notification := Notification{Message: "Список задач обновлён"}

printSummary(task)
printSummary(notification)
```

Это и есть полиморфизм через интерфейсы: один и тот же код работает с разными типами, если они предоставляют нужное поведение.

## Небольшие интерфейсы

В Go предпочтительны маленькие интерфейсы с одним-двумя методами. Хороший интерфейс описывает конкретную потребность вызывающего кода:

```go
type TaskFormatter interface {
	Summary() string
}
```

Не объединяйте в один интерфейс несвязанные возможности заранее:

```go
// Неудачная абстракция для текущего этапа:
// type Everything interface {
//     Summary() string
//     IsValid() bool
//     Complete() bool
//     Rename(string) bool
// }
```

Если функции нужно только напечатать описание, ей не нужны методы проверки, изменения или сохранения. Интерфейс лучше объявлять там, где он используется, а не заранее «на всякий случай».

## Методы по значению и по указателю

Способ объявления метода влияет на то, кто реализует интерфейс.

Метод с получателем по значению доступен и для `Task`, и для `*Task`:

```go
func (task Task) Summary() string {
	return task.Title
}

var first TaskFormatter = Task{Title: "Купить молоко"}
var second TaskFormatter = &Task{Title: "Оплатить интернет"}

fmt.Println(first.Summary())
fmt.Println(second.Summary())
```

Метод с pointer receiver доступен только для `*Task`:

```go
func (task *Task) Complete() bool {
	if task == nil {
		return false
	}

	task.Completed = true
	return true
}

type Completer interface {
	Complete() bool
}

// var first Completer = Task{} // ошибка: Task не реализует Completer
var second Completer = &Task{Title: "Купить молоко"}
```

Это важно: если интерфейс требует метод с pointer receiver, в него нужно передать указатель.

## Интерфейсное значение и nil

Интерфейсное значение содержит тип и конкретное значение. Поэтому есть важная разница:

```go
var formatter TaskFormatter
fmt.Println(formatter == nil) // true
```

Здесь интерфейс пуст: нет ни типа, ни значения.

Но если положить в интерфейс nil-указатель конкретного типа, сам интерфейс не равен `nil`:

```go
var task *Task
var formatter TaskFormatter = task

fmt.Println(formatter == nil) // false
```

В этой главе достаточно запомнить правило: не передавайте nil-указатель в интерфейс без необходимости. Если метод может быть вызван у nil-получателя, он должен сам корректно обработать это состояние.

## Полный пример

```go
package main

import "fmt"

type TaskFormatter interface {
	Summary() string
}

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

## Частые ошибки

### Ожидание явного `implements`

В Go его нет. Не нужно изменять `Task`, чтобы «подключить» интерфейс. Достаточно реализовать нужный метод с точной сигнатурой.

### Слишком большой интерфейс

```go
// type TaskManager interface {
//     Summary() string
//     IsValid() bool
//     Complete() bool
//     Rename(string) bool
// }
```

Не добавляйте методы, которые не нужны конкретной функции. Маленький `TaskFormatter` проще реализовать и тестировать.

### Значение вместо указателя

Если интерфейс требует только методы с pointer receiver, передавайте `&task`, а не `task`:

```go
type Completer interface {
	Complete() bool
}

task := Task{Title: "Купить молоко"}
var completer Completer = &task
```

## Дальше

Закрепите интерфейс `TaskFormatter` на практике. Затем перейдём к ошибкам: вместо `bool` методы и функции смогут возвращать причину неуспешного действия.

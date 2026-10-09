---
prev: /guide/methods/practice.md
next: /guide/pointers/tests.md
---

# Указатели

## Цель урока

Понять, что хранит указатель, как безопасно работать с `nil` и как с помощью pointer receiver менять исходную задачу методами `Complete` и `Rename`.

Указатели в Go не нужны для каждого значения. Они полезны, когда функция или метод должны изменить исходное значение, когда копирование большой структуры нежелательно или когда нужно выразить отсутствие значения через `nil`.

## Значение и адрес

Обычная переменная хранит значение:

```go
priority := 2
```

У каждой переменной есть адрес в памяти. Оператор `&` получает этот адрес:

```go
priority := 2
priorityAddress := &priority

fmt.Println(priorityAddress)
```

Тип `priorityAddress` — `*int`: «указатель на `int`». Адрес при каждом запуске может выглядеть по-разному; не используйте его как данные программы.

```go
var priorityAddress *int
```

Звёздочка в типе означает указатель на значение указанного типа.

## Разыменование: `*`

Оператор `*` перед указателем даёт значение по адресу:

```go
package main

import "fmt"

func main() {
	priority := 2
	priorityAddress := &priority

	fmt.Println(*priorityAddress) // 2

	*priorityAddress = 3
	fmt.Println(priority) // 3
}
```

`*priorityAddress = 3` меняет не копию, а исходную переменную `priority`.

::: tip Не путайте роли `*`
В `*Task` звёздочка означает тип «указатель на Task». В `*task` она означает разыменование: доступ к значению по адресу.
:::

## `nil`

Указатель может не указывать ни на какое значение. Это состояние называется `nil`:

```go
var task *Task

fmt.Println(task == nil) // true
```

Разыменовывать `nil` нельзя: программа завершится с panic.

```go
var priorityAddress *int

// fmt.Println(*priorityAddress) // panic
```

Перед доступом через указатель проверяйте его, если `nil` возможен:

```go
if priorityAddress != nil {
	fmt.Println(*priorityAddress)
}
```

## `new`

Встроенная функция `new` создаёт нулевое значение указанного типа и возвращает указатель на него:

```go
task := new(Task)

fmt.Println(task.ID)        // 0
fmt.Println(task.Completed) // false
```

`task` имеет тип `*Task`. Go автоматически разыменовывает указатель при обращении к полю, поэтому можно написать `task.ID`, а не `(*task).ID`.

Для создания заполненной структуры чаще используют литерал с `&`:

```go
task := &Task{
	ID:       1,
	Title:    "Купить молоко",
	Priority: 2,
}
```

Здесь `task` тоже имеет тип `*Task`.

## Аргументы передаются по значению

Go всегда передаёт аргументы функции по значению. Если передать структуру, функция получит её копию:

```go
func completeCopy(task Task) {
	task.Completed = true
}

func main() {
	task := Task{Title: "Купить молоко"}
	completeCopy(task)

	fmt.Println(task.Completed) // false
}
```

Чтобы функция изменила исходную задачу, передайте указатель:

```go
func completeTask(task *Task) {
	if task == nil {
		return
	}

	task.Completed = true
}

func main() {
	task := Task{Title: "Купить молоко"}
	completeTask(&task)

	fmt.Println(task.Completed) // true
}
```

`&task` передаёт адрес исходной структуры. Внутри функции `task.Completed` изменяет поле по этому адресу.

## Pointer receiver

Метод с получателем по значению читает копию структуры:

```go
func (task Task) Summary() string {
	return task.Title
}
```

Если метод должен изменить исходную структуру, получатель должен быть указателем:

```go
func (task *Task) Complete() {
	if task == nil {
		return
	}

	task.Completed = true
}
```

Вызов выглядит привычно:

```go
task := Task{Title: "Купить молоко"}
task.Complete()

fmt.Println(task.Completed) // true
```

Компилятор сам берёт адрес `&task`, потому что переменная `task` адресуемая. Это сокращение работает для переменных, но не для временных значений и не для значений структуры внутри map.

## Методы `Complete` и `Rename`

Добавим поведение к модели Task Manager API:

```go
type Task struct {
	ID        int
	Title     string
	Priority  int
	Completed bool
}

func (task *Task) Complete() bool {
	if task == nil {
		return false
	}

	task.Completed = true
	return true
}

func (task *Task) Rename(title string) bool {
	if task == nil || len(title) == 0 || len(title) > 120 {
		return false
	}

	task.Title = title
	return true
}
```

Методы возвращают `bool`, чтобы сообщить, удалось ли выполнить действие. В будущей главе об ошибках заменим такой результат на более информативный `error`.

Использование:

```go
task := Task{
	ID:       1,
	Title:    "Купить молоко",
	Priority: 2,
}

task.Complete()
task.Rename("Купить продукты")

fmt.Println(task.Title)     // Купить продукты
fmt.Println(task.Completed) // true
```

## Значение и указатель: когда что выбрать

Получатель по значению `Task` подходит, когда метод:

- только читает поля;
- не должен менять исходную задачу;
- должен работать одинаково с копией и оригиналом.

```go
func (task Task) IsValid() bool { /* ... */ }
func (task Task) Summary() string { /* ... */ }
```

Получатель `*Task` нужен, когда метод:

- меняет исходную задачу;
- должен отличать отсутствие задачи (`nil`);
- работает с большой структурой и копирование нежелательно.

```go
func (task *Task) Complete() bool { /* ... */ }
func (task *Task) Rename(title string) bool { /* ... */ }
```

Для одного типа не смешивайте получатели без причины. В нашей модели методы чтения пока остаются значимыми, а методы изменения используют указатель — это понятное различие для учебного примера.

## Указатель и map

Структура, хранящаяся значением в map, не адресуемая:

```go
tasksByID := map[int]Task{
	1: {ID: 1, Title: "Купить молоко", Priority: 2},
}

// tasksByID[1].Complete() // ошибка: нельзя вызвать pointer method у значения map
```

Получите копию, измените её и сохраните обратно:

```go
task := tasksByID[1]
task.Complete()
tasksByID[1] = task
```

Позднее обсудим, когда map хранит `Task`, а когда `*Task`. Сейчас важнее понимать, что map в этом примере возвращает копию структуры.

## Частые ошибки

### Разыменование `nil`

```go
var task *Task
// task.Completed = true // panic
```

Проверьте указатель или создайте значение:

```go
task = &Task{Title: "Купить молоко"}
task.Completed = true
```

### Метод по значению для изменения структуры

```go
func (task Task) Complete() {
	task.Completed = true
}
```

Этот метод меняет копию. Используйте получатель `*Task`.

### Передача структуры вместо адреса

```go
func completeTask(task *Task) { /* ... */ }

task := Task{}
// completeTask(task) // ошибка: нужен *Task
completeTask(&task)
```

### Лишние указатели

Не используйте указатель к `int` или `string` только потому, что «так производительнее». Для маленьких значений это часто усложняет код без пользы. Сначала определите: нужно ли менять исходное значение или выразить отсутствие значения?

## Дальше

Закрепите `Complete` и `Rename` на практике. Затем перейдём к интерфейсам — способу описывать нужное поведение без привязки к конкретному типу.

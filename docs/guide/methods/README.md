---
prev: /guide/structs/practice.md
next: /guide/methods/tests.md
---

# Методы

## Цель урока

Научиться объявлять методы для собственного типа, вызывать их у структуры и размещать поведение задачи рядом с её данными.

В предыдущей главе `Task` описывал данные задачи. Теперь добавим действия, которые естественно относятся к задаче: получить текстовое представление и проверить, что поля допустимы.

## Функция и метод

Обычная функция получает значения параметрами:

```go
func isValidTask(task Task) bool {
	return len(task.Title) > 0 && task.Priority >= 1 && task.Priority <= 3
}
```

Метод тоже является функцией, но связан с конкретным типом. Получатель (receiver) записывается между `func` и именем метода:

```go
func (task Task) IsValid() bool {
	return len(task.Title) > 0 && task.Priority >= 1 && task.Priority <= 3
}
```

Теперь метод вызывается через точку у значения типа `Task`:

```go
task := Task{
	ID:       1,
	Title:    "Купить молоко",
	Priority: 2,
}

fmt.Println(task.IsValid()) // true
```

`task` в `(task Task)` — имя получателя. Это обычная переменная внутри метода, через которую можно читать поля структуры.

## Модель задачи

Во всех примерах главы используем уже знакомый тип:

```go
type Task struct {
	ID        int
	Title     string
	Priority  int
	Completed bool
}
```

Методы можно объявлять в том же пакете, что и тип. В маленьких примерах это один файл `main.go`; в настоящем приложении тип и методы часто находятся в отдельных файлах одного пакета.

## Метод без результата

Метод может выполнять действие и ничего не возвращать:

```go
func (task Task) Print() {
	fmt.Printf("%d. %s | приоритет: %d | выполнена: %t\n",
		task.ID,
		task.Title,
		task.Priority,
		task.Completed,
	)
}
```

Вызов:

```go
task.Print()
```

Такой метод подходит для простого учебного вывода. Но бизнес-логику обычно удобнее писать без прямого вывода в терминал: тогда её легче переиспользовать и тестировать.

## Метод с результатом

Пусть задача возвращает текстовое описание вместо того, чтобы сразу печатать его:

```go
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

`fmt.Sprintf` работает как `fmt.Printf`, но возвращает готовую строку. Теперь вызывающий код сам решает, что с ней делать:

```go
fmt.Println(task.Summary())
```

## Проверка данных методом

Метод `IsValid` может проверить простые правила задачи:

```go
func (task Task) IsValid() bool {
	return task.ID > 0 &&
		len(task.Title) > 0 &&
		len(task.Title) <= 120 &&
		task.Priority >= 1 &&
		task.Priority <= 3
}
```

Использование:

```go
if task.IsValid() {
	fmt.Println("Задачу можно создать")
} else {
	fmt.Println("Задача содержит некорректные данные")
}
```

Метод не обязан знать, как именно будет показано сообщение. Его обязанность — вернуть результат проверки.

## Получатель по значению

Во всех примерах `Task` передаётся в метод как значение:

```go
func (task Task) Summary() string {
	// task — копия структуры, доступная только в этом методе
}
```

Это подходит для методов, которые только читают данные. Если изменить поле получателя, изменится лишь копия:

```go
func (task Task) MarkCompleted() {
	task.Completed = true
}

func main() {
	task := Task{Title: "Купить молоко"}
	task.MarkCompleted()

	fmt.Println(task.Completed) // false
}
```

Для изменения исходной структуры нужен получатель-указатель. Это следующая глава — пока не используйте методы, которые создают впечатление изменения, но на самом деле меняют копию.

## Методы в слайсе задач

Методы удобно вызывать у каждого элемента слайса:

```go
tasks := []Task{
	{ID: 1, Title: "Купить молоко", Priority: 2},
	{ID: 2, Title: "Оплатить интернет", Priority: 3},
}

for _, task := range tasks {
	fmt.Println(task.Summary())
}
```

Здесь `task` — копия элемента, но это не мешает методам `Summary` и `IsValid`, потому что они только читают данные.

## Полный пример

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

func (task Task) IsValid() bool {
	return task.ID > 0 &&
		len(task.Title) > 0 &&
		len(task.Title) <= 120 &&
		task.Priority >= 1 &&
		task.Priority <= 3
}

func main() {
	task := Task{
		ID:       1,
		Title:    "Купить молоко",
		Priority: 2,
	}

	if !task.IsValid() {
		fmt.Println("Задача содержит некорректные данные")
		return
	}

	fmt.Println(task.Summary())
}
```

## Частые ошибки

### Метод объявлен без получателя

```go
func Summary() string {
	// Это функция, а не метод: у неё нет доступа к конкретной Task.
	return ""
}
```

Добавьте получатель `(task Task)`:

```go
func (task Task) Summary() string {
	return task.Title
}
```

### Вызов метода как функции

```go
// Summary(task) // ошибка: Summary — метод
fmt.Println(task.Summary())
```

### Ожидание изменения исходной задачи

```go
func (task Task) MarkCompleted() {
	task.Completed = true
}
```

Получатель по значению копируется. Не используйте такой метод для изменения задачи; решение появится после изучения указателей.

## Дальше

Следующая глава посвящена указателям. Она объяснит, как работать с адресом значения и как писать методы, которые действительно изменяют исходную структуру.

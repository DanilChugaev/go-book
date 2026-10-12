---
prev: /guide/pointers/tests.md
next: /guide/pointers/best-practices.md
---

# Задания: изменение Task

Теперь Task Manager API может менять существующую задачу через методы. Методы с pointer receiver работают с исходной структурой, а не с её копией.

## Задание 1. Выполните задачу

Добавьте к `Task` метод `Complete() bool`. Если получатель не `nil`, метод должен установить `Completed` в `true` и вернуть `true`. Для `nil` метод не должен паниковать и должен вернуть `false`.

**Критерии проверки:**

- используется получатель `*Task`;
- обычная задача после `Complete()` имеет `Completed: true`;
- метод возвращает `true` при успешном выполнении;
- вызов для `nil`-указателя не вызывает panic и возвращает `false`.

<details>
  <summary>Подсказка</summary>

В начале метода проверьте получатель:

```go
if task == nil {
	return false
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

func (task *Task) Complete() bool {
	if task == nil {
		return false
	}

	task.Completed = true
	return true
}

func main() {
	task := Task{ID: 1, Title: "Купить молоко", Priority: 2}

	fmt.Println(task.Complete())
	fmt.Println(task.Completed)

	var missingTask *Task
	fmt.Println(missingTask.Complete())
}
```
</details>

## Задание 2. Переименуйте задачу

Добавьте метод `Rename(title string) bool`. Он должен изменить название, если:

- получатель не `nil`;
- новое название не пустое;
- длина названия не превышает 120 байтов.

Во всех остальных случаях задача не должна измениться, а метод должен вернуть `false`.

**Критерии проверки:**

- используется получатель `*Task`;
- корректное название меняет поле `Title`;
- пустая строка не меняет поле;
- слишком длинное название не меняет поле;
- результат метода показывает успех или неудачу.

<details>
  <summary>Подсказка</summary>

Все условия отказа можно объединить в один `if`:

```go
if task == nil || len(title) == 0 || len(title) > 120 {
	return false
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

func (task *Task) Rename(title string) bool {
	if task == nil || len(title) == 0 || len(title) > 120 {
		return false
	}

	task.Title = title
	return true
}

func main() {
	task := Task{ID: 1, Title: "Купить молоко", Priority: 2}

	fmt.Println(task.Rename("Купить продукты"))
	fmt.Println(task.Title)

	fmt.Println(task.Rename(""))
	fmt.Println(task.Title)
}
```
</details>

## Задание 3. Измените задачу из map

Создайте `map[int]Task` с одной задачей. Получите её по ID, вызовите `Complete` и `Rename`, затем сохраните изменённую структуру обратно в map. Выведите итоговую задачу.

**Критерии проверки:**

- map имеет тип `map[int]Task`;
- задача извлекается в локальную переменную;
- методы вызываются у этой переменной;
- переменная присваивается обратно в map;
- в map сохранены новое название и `Completed: true`.

<details>
  <summary>Подсказка</summary>

```go
task := tasksByID[1]
task.Complete()
task.Rename("Купить продукты")
tasksByID[1] = task
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

func main() {
	tasksByID := map[int]Task{
		1: {ID: 1, Title: "Купить молоко", Priority: 2},
	}

	task := tasksByID[1]
	task.Complete()
	task.Rename("Купить продукты")
	tasksByID[1] = task

	fmt.Println(tasksByID[1])
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- получить адрес переменной через `&`;
- объяснить разницу между `*Task` и `*task`;
- проверить указатель на `nil`;
- объявить метод с pointer receiver;
- изменить `Task` через `Complete` и `Rename`;
- обновить структуру, хранящуюся значением в map.

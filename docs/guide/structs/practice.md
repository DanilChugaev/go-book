---
prev: /guide/structs/tests.md
next: /guide/structs/best-practices.md
---

# Задания: модель Task

Теперь Task Manager API хранит задачу как одну структуру, а не как набор независимых переменных. Будем использовать минимальную модель: ID, название, приоритет и признак выполнения.

## Задание 1. Создайте задачу

Объявите тип `Task` с полями `ID int`, `Title string`, `Priority int` и `Completed bool`. Создайте одну задачу с ID `1`, названием `Купить молоко` и приоритетом `2`. Выведите все её поля.

**Критерии проверки:**

- объявлен тип `Task struct`;
- литерал использует имена полей;
- поле `Completed` можно не указывать — оно должно получить `false`;
- значения полей читаются через точку.

<details>
  <summary>Подсказка</summary>

```go
type Task struct {
	ID        int
	Title     string
	Priority  int
	Completed bool
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

func main() {
	task := Task{
		ID:       1,
		Title:    "Купить молоко",
		Priority: 2,
	}

	fmt.Println(task.ID)
	fmt.Println(task.Title)
	fmt.Println(task.Priority)
	fmt.Println(task.Completed)
}
```
</details>

## Задание 2. Отметьте задачу выполненной

Создайте задачу с `Completed: false`, затем измените это поле на `true` и выведите результат. Также измените название задачи.

**Критерии проверки:**

- поля изменяются через `task.Completed = true` и `task.Title = ...`;
- итоговое значение `Completed` равно `true`;
- изменённое название выводится в терминал.

<details>
  <summary>Подсказка</summary>

После создания структуры её поле изменяют как обычную переменную, используя точку.
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

func main() {
	task := Task{
		ID:       1,
		Title:    "Купить молоко",
		Priority: 2,
	}

	task.Title = "Купить продукты"
	task.Completed = true

	fmt.Println(task.Title)
	fmt.Println(task.Completed)
}
```
</details>

## Задание 3. Список задач

Создайте слайс из трёх `Task` и выведите каждую задачу в формате:

```text
1. Купить молоко | приоритет: 2 | выполнена: false
```

После создания списка отметьте вторую задачу выполненной.

**Критерии проверки:**

- используется `[]Task`;
- каждая структура создаётся через именованные поля;
- вторая задача меняется через индекс слайса;
- список обходится через `range`;
- в выводе есть ID, название, приоритет и признак выполнения.

<details>
  <summary>Подсказка</summary>

Вторая задача имеет индекс `1`:

```go
tasks[1].Completed = true
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

func main() {
	tasks := []Task{
		{ID: 1, Title: "Купить молоко", Priority: 2},
		{ID: 2, Title: "Оплатить интернет", Priority: 3},
		{ID: 3, Title: "Прочитать книгу", Priority: 1},
	}

	tasks[1].Completed = true

	for _, task := range tasks {
		fmt.Printf("%d. %s | приоритет: %d | выполнена: %t\n",
			task.ID,
			task.Title,
			task.Priority,
			task.Completed,
		)
	}
}
```
</details>

## Задание 4. Map задач по ID

Создайте `map[int]Task` с двумя задачами. Получите задачу с ID `1`, отметьте её выполненной и сохраните обратно в map. Затем выведите обновлённое значение.

**Критерии проверки:**

- используется `map[int]Task`;
- задача извлекается в отдельную переменную;
- поле `Completed` меняется у переменной;
- изменённая структура присваивается обратно по тому же ID;
- в map сохранено значение с `Completed: true`.

<details>
  <summary>Подсказка</summary>

```go
task := tasksByID[1]
task.Completed = true
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

func main() {
	tasksByID := map[int]Task{
		1: {ID: 1, Title: "Купить молоко", Priority: 2},
		2: {ID: 2, Title: "Оплатить интернет", Priority: 3},
	}

	task := tasksByID[1]
	task.Completed = true
	tasksByID[1] = task

	fmt.Println(tasksByID[1])
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- объявить собственный тип структуры;
- создать структуру с именованными полями;
- прочитать и изменить поле через точку;
- хранить структуры в слайсе и менять элемент по индексу;
- обновить структуру, которая хранится значением в map.

## Полный исходный код

Здесь будет размещён полный исходный код к практическим заданиям этой главы.

<ExampleSource
  path="examples/10/structs"
  description="заготовка для полного исходного кода практических заданий главы"
/>

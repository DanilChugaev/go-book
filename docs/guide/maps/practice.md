---
prev: /guide/maps/tests.md
next: /guide/structs/README.md
---

# Практика: задачи по ID

Теперь Task Manager API хранит названия задач по числовым идентификаторам. Map не гарантирует порядок задач, но позволяет быстро найти, обновить или удалить задачу по её ID.

## Задание 1. Найдите задачу

Создайте map с тремя задачами: ID `1`, `2` и `3`. Затем создайте переменную `taskID := 2` и выведите название найденной задачи в формате:

```text
Задача 2: Оплатить интернет
```

Если задачи нет, программа должна вывести `Задача не найдена`.

**Критерии проверки:**

- используется `map[int]string`;
- поиск выполняется через `title, exists := taskTitles[taskID]`;
- для ID `2` выводится название задачи;
- для отсутствующего ID программа не паникует.

<details>
  <summary>Подсказка</summary>

Используйте короткое объявление внутри `if`:

```go
if title, exists := taskTitles[taskID]; exists {
	// задача найдена
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	taskTitles := map[int]string{
		1: "Купить молоко",
		2: "Оплатить интернет",
		3: "Прочитать книгу",
	}
	taskID := 2

	if title, exists := taskTitles[taskID]; exists {
		fmt.Printf("Задача %d: %s\n", taskID, title)
	} else {
		fmt.Println("Задача не найдена")
	}
}
```
</details>

## Задание 2. Добавьте и обновите задачу

Создайте пустую map, добавьте задачи с ID `1` и `2`, затем измените название задачи с ID `2` на `Оплатить коммунальные услуги`. Выведите обновлённое значение задачи с ID `2`.

**Критерии проверки:**

- map создана через `make(map[int]string)`;
- новые ключи добавлены через присваивание;
- повторное присваивание по ключу `2` обновляет значение;
- результат поиска по ID `2` содержит новое название.

<details>
  <summary>Подсказка</summary>

Для map одно и то же выражение используется для добавления и обновления:

```go
taskTitles[2] = "Новое название"
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	taskTitles := make(map[int]string)

	taskTitles[1] = "Купить молоко"
	taskTitles[2] = "Оплатить интернет"
	taskTitles[2] = "Оплатить коммунальные услуги"

	fmt.Println(taskTitles[2])
}
```
</details>

## Задание 3. Удалите задачу

Создайте map из трёх задач и удалите задачу с ID `2`. До удаления проверьте, что такая задача существует. После удаления выведите количество оставшихся задач и попытайтесь найти удалённую задачу.

**Критерии проверки:**

- существование ключа проверяется через `_, exists`;
- удаление выполняется через `delete`;
- после удаления `len(taskTitles)` равно `2`;
- поиск ID `2` сообщает, что задача не найдена.

<details>
  <summary>Подсказка</summary>

```go
if _, exists := taskTitles[taskID]; exists {
	delete(taskTitles, taskID)
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	taskTitles := map[int]string{
		1: "Купить молоко",
		2: "Оплатить интернет",
		3: "Прочитать книгу",
	}
	taskID := 2

	if _, exists := taskTitles[taskID]; exists {
		delete(taskTitles, taskID)
	}

	fmt.Println("Всего задач:", len(taskTitles))

	if title, exists := taskTitles[taskID]; exists {
		fmt.Println(title)
	} else {
		fmt.Println("Задача не найдена")
	}
}
```
</details>

## Задание 4. Выведите все задачи

Создайте map из трёх задач и выведите все пары в формате `ID: название`. Не требуйте от программы конкретный порядок строк.

**Критерии проверки:**

- используется `for id, title := range taskTitles`;
- каждая пара содержит ID и название;
- в проверке результата не предполагается порядок обхода map;
- программа выводит все три задачи.

<details>
  <summary>Подсказка</summary>

```go
for id, title := range taskTitles {
	fmt.Printf("%d: %s\n", id, title)
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	taskTitles := map[int]string{
		1: "Купить молоко",
		2: "Оплатить интернет",
		3: "Прочитать книгу",
	}

	for id, title := range taskTitles {
		fmt.Printf("%d: %s\n", id, title)
	}
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- создать map литералом и через `make`;
- безопасно найти значение через `value, ok`;
- добавить, обновить и удалить пару;
- объяснить, почему map не подходит для упорядоченного списка;
- обойти ключи и значения через `range`.

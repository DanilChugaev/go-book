---
prev: /guide/variables-and-data-types/tests.md
next: /guide/strings/README.md
---

# Практика: значения для задачи

На этом этапе Task Manager API ещё не имеет структуры задачи или базы данных. Мы подготовим отдельные значения, из которых позднее соберём модель задачи.

## Задание 1. Данные одной задачи

Создайте новый модуль `example.com/task-manager`, если не сделали этого в первой главе. В файле `main.go` объявите и выведите:

- название задачи: `Изучить переменные в Go`;
- описание: `Прочитать урок и выполнить практику`;
- приоритет: `2`;
- признак выполнения: `false`.

Используйте `var` хотя бы для одной переменной, а `:=` — хотя бы для одной другой.

**Критерии проверки:**

- проект запускается через `go run .`;
- используются `string`, `int` и `bool`;
- значения выводятся в терминал;
- в коде есть и `var`, и `:=`.

<details>
  <summary>Подсказка 1</summary>

Для вывода нескольких значений можно вызвать `fmt.Println` несколько раз или передать несколько аргументов в один вызов.
</details>

<details>
  <summary>Подсказка 2</summary>

Начните так:

```go
var title string = "Изучить переменные в Go"
priority := 2
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	var title string = "Изучить переменные в Go"
	description := "Прочитать урок и выполнить практику"
	priority := 2
	completed := false

	fmt.Println("Название:", title)
	fmt.Println("Описание:", description)
	fmt.Println("Приоритет:", priority)
	fmt.Println("Выполнена:", completed)
}
```
</details>

## Задание 2. Приоритеты как константы

Добавьте три константы приоритета: низкий, средний и высокий. Их значения должны быть `1`, `2` и `3`. Используйте `iota` и начните отсчёт с единицы.

Затем создайте переменную `taskPriority` со средним приоритетом и выведите её.

**Критерии проверки:**

- константы находятся в одном блоке `const`;
- для первого значения используется `iota + 1`;
- `taskPriority` получает значение средней константы;
- программа печатает `2`.

<details>
  <summary>Подсказка</summary>

```go
const (
	priorityLow = iota + 1
	// следующие значения продолжат последовательность
)
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

const (
	priorityLow = iota + 1
	priorityMedium
	priorityHigh
)

func main() {
	taskPriority := priorityMedium

	fmt.Println(taskPriority)
}
```
</details>

## Задание 3. Преобразование прогресса

Пусть прогресс выполнения задачи хранится в `float64` и равен `3.8`. Преобразуйте его в `int` и выведите оба значения.

**Критерии проверки:**

- исходное значение имеет тип `float64`;
- для преобразования используется `int(progress)`;
- результат преобразования равен `3`;
- вы можете объяснить, почему это не округление.

<details>
  <summary>Подсказка</summary>

При преобразовании `float64` в `int` дробная часть отбрасывается.
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	progress := 3.8
	completedSteps := int(progress)

	fmt.Println("Прогресс:", progress)
	fmt.Println("Завершённых шагов:", completedSteps)
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете без подсказки:

- объяснить разницу между `var`, `:=` и `const`;
- назвать нулевые значения `int`, `bool` и `string`;
- выбрать `int`, `bool` или `string` для простых данных задачи;
- выполнить явное преобразование `float64` в `int`.

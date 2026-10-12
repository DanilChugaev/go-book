---
prev: /guide/operators-and-expressions/tests.md
next: /guide/operators-and-expressions/best-practices.md
---

# Практика: проверки задачи

Пока мы не используем `if`, поэтому программа не будет принимать решения и выводить разные сообщения. Вместо этого она будет вычислять логические значения: `true` или `false`. В следующей главе научимся использовать эти результаты в условиях.

## Задание 1. Допустимый приоритет

В Task Manager API допустимый приоритет задачи находится в диапазоне от `1` до `3` включительно. Создайте переменную `priority` со значением `2`, вычислите `isValidPriority` и выведите результат.

**Критерии проверки:**

- `priority` имеет тип `int`;
- `isValidPriority` использует `>=`, `<=` и `&&`;
- программа выводит `true`;
- при изменении `priority` на `4` программа выводит `false`.

<details>
  <summary>Подсказка</summary>

Проверка должна быть истинной одновременно для двух условий: значение не меньше `1` и не больше `3`.
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	priority := 2
	isValidPriority := priority >= 1 && priority <= 3

	fmt.Println(isValidPriority)
}
```
</details>

## Задание 2. Допустимая длина заголовка

Заголовок задачи не должен быть пустым и не должен быть длиннее 120 байтов. Создайте строку `title := "Купить молоко"`, посчитайте её длину и сохраните результат проверки в `hasValidTitleLength`.

**Критерии проверки:**

- длина получена через `len(title)`;
- проверка использует `>` и `<=`;
- два условия объединены через `&&`;
- для указанного заголовка выводится `true`.

<details>
  <summary>Подсказка</summary>

Пустая строка имеет длину `0`. Проверьте, что длина больше `0` и не превышает `120`.
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	title := "Купить молоко"
	titleLength := len(title)
	hasValidTitleLength := titleLength > 0 && titleLength <= 120

	fmt.Println(hasValidTitleLength)
}
```
</details>

## Задание 3. Готовность задачи к созданию

Объедините две предыдущие проверки. Задача готова к созданию, если и приоритет, и длина заголовка допустимы.

Создайте переменную `isReadyToCreate` и выведите её. Затем измените заголовок на пустую строку и убедитесь, что результат стал `false`.

**Критерии проверки:**

- `isReadyToCreate` использует `hasValidTitleLength && isValidPriority`;
- с корректными исходными значениями программа выводит `true`;
- с пустым заголовком программа выводит `false`.

<details>
  <summary>Подсказка</summary>

Результаты уже являются `bool`, поэтому их можно объединить напрямую: `firstCheck && secondCheck`.
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	title := "Купить молоко"
	priority := 2

	hasValidTitleLength := len(title) > 0 && len(title) <= 120
	isValidPriority := priority >= 1 && priority <= 3
	isReadyToCreate := hasValidTitleLength && isValidPriority

	fmt.Println(isReadyToCreate)
}
```
</details>

## Задание 4. Среднее число задач

За 7 дней создано 25 задач. Выведите среднее количество задач в день как дробное число. Затем отдельно выведите число полных задач в день при целочисленном делении.

**Критерии проверки:**

- для дробного результата хотя бы один операнд преобразован к `float64`;
- дробный результат приблизительно равен `3.5714285714285716`;
- целочисленный результат равен `3`;
- вы можете объяснить разницу результатов.

<details>
  <summary>Подсказка</summary>

Для дробного результата используйте `float64(totalTasks) / float64(days)`.
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func main() {
	totalTasks := 25
	days := 7

	averageTasksPerDay := float64(totalTasks) / float64(days)
	wholeTasksPerDay := totalTasks / days

	fmt.Println(averageTasksPerDay)
	fmt.Println(wholeTasksPerDay)
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- отличить `=` от `==`;
- объяснить разницу между `&&`, `||` и `!`;
- рассчитать выражение с учётом приоритета операций;
- объяснить, почему `7 / 2` равно `3`;
- составить проверку допустимого значения без `if`.

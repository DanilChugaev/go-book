---
prev: /guide/functions/tests.md
next: /guide/functions/best-practices.md
---

# Задания: функции Task Manager API

Вынесем логику проверки будущей задачи из `main`. Пока задача представлена отдельными переменными, но уже сейчас каждая функция будет отвечать за одну конкретную обязанность.

## Задание 1. Проверка заголовка

Напишите функцию `validateTitle(title string) bool`. Она должна вернуть `true`, если заголовок не пустой и не длиннее 120 байтов, иначе — `false`.

В `main` проверьте названия `Купить молоко` и пустую строку.

**Критерии проверки:**

- функция принимает параметр `title string`;
- функция возвращает `bool`;
- проверка использует `len(title) > 0 && len(title) <= 120`;
- корректный заголовок даёт `true`, пустой — `false`.

<details>
  <summary>Подсказка</summary>

Тип результата записывают после круглых скобок с параметрами:

```go
func validateTitle(title string) bool {
	// return ...
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func validateTitle(title string) bool {
	return len(title) > 0 && len(title) <= 120
}

func main() {
	fmt.Println(validateTitle("Купить молоко"))
	fmt.Println(validateTitle(""))
}
```
</details>

## Задание 2. Описание приоритета

Создайте функцию `priorityLabel(priority int) string`. Она должна возвращать:

- `низкий` для `1`;
- `средний` для `2`;
- `высокий` для `3`;
- `неизвестный` для остальных значений.

Используйте `switch`.

**Критерии проверки:**

- функция принимает `int` и возвращает `string`;
- используется `switch priority`;
- предусмотрен `default`;
- `priorityLabel(2)` возвращает `средний`.

<details>
  <summary>Подсказка</summary>

Каждая ветвь `case` может сразу вернуть результат:

```go
case 1:
	return "низкий"
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func priorityLabel(priority int) string {
	switch priority {
	case 1:
		return "низкий"
	case 2:
		return "средний"
	case 3:
		return "высокий"
	default:
		return "неизвестный"
	}
}

func main() {
	fmt.Println(priorityLabel(2))
}
```
</details>

## Задание 3. Проверка приоритета с сообщением

Напишите функцию `validatePriority(priority int) (bool, string)`. Для значения от `1` до `3` она должна вернуть `true, ""`. Для остальных значений — `false` и сообщение `приоритет должен быть от 1 до 3`.

В `main` сохраните оба результата в переменные и выведите их.

**Критерии проверки:**

- функция возвращает два значения: `bool` и `string`;
- в случае ошибки возвращается понятный текст;
- `validatePriority(2)` возвращает `true, ""`;
- `validatePriority(4)` возвращает `false` и текст ошибки.

<details>
  <summary>Подсказка</summary>

Сигнатура функции:

```go
func validatePriority(priority int) (bool, string) {
	// ...
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func validatePriority(priority int) (bool, string) {
	if priority < 1 || priority > 3 {
		return false, "приоритет должен быть от 1 до 3"
	}

	return true, ""
}

func main() {
	isValid, message := validatePriority(4)

	fmt.Println(isValid)
	fmt.Println(message)
}
```
</details>

## Задание 4. Полная проверка задачи

Используйте `validateTitle` и `validatePriority` для проверки одной задачи. Если заголовок некорректен, выведите его сообщение и завершите `main`. Если заголовок корректен, проверьте приоритет. При успешной проверке выведите:

```text
Задачу "Купить молоко" можно создать. Приоритет: средний
```

**Критерии проверки:**

- `main` вызывает обе функции в правильном порядке;
- при первой ошибке выполняется `return` из `main`;
- при успехе используется `priorityLabel`;
- логика проверки не дублируется в `main`.

<details>
  <summary>Подсказка</summary>

Проверку можно записать так:

```go
if isValid, message := validateTitle(title); !isValid {
	fmt.Println(message)
	return
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import "fmt"

func validateTitle(title string) (bool, string) {
	if len(title) == 0 {
		return false, "название задачи не должно быть пустым"
	}

	if len(title) > 120 {
		return false, "название задачи слишком длинное"
	}

	return true, ""
}

func validatePriority(priority int) (bool, string) {
	if priority < 1 || priority > 3 {
		return false, "приоритет должен быть от 1 до 3"
	}

	return true, ""
}

func priorityLabel(priority int) string {
	switch priority {
	case 1:
		return "низкий"
	case 2:
		return "средний"
	case 3:
		return "высокий"
	default:
		return "неизвестный"
	}
}

func main() {
	title := "Купить молоко"
	priority := 2

	if isValid, message := validateTitle(title); !isValid {
		fmt.Println(message)
		return
	}

	if isValid, message := validatePriority(priority); !isValid {
		fmt.Println(message)
		return
	}

	fmt.Printf("Задачу %q можно создать. Приоритет: %s\n", title, priorityLabel(priority))
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- объявить и вызвать функцию;
- передать параметры нужных типов;
- вернуть один или несколько результатов;
- завершить функцию ранним `return`;
- объяснить, почему проверку задачи лучше вынести из `main`.

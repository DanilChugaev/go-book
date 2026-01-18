---
# prev: /path/to/previous-page/
#next: /guide/pointers/slice-pointers
---
# Практика

## Задание 1

::: info Описание
Объявите переменные для имени (`string`), возраста (`int`) и роста (`float64`). Используйте разный формат объявления. Выведите все переменные.
:::

**Цель**: Освоить синтаксис объявления и понять zero values.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл variables.go

```go
package main

import (
	"fmt"
)

const name string = "Danil"

var age int

func main() {
	age = 31
	height := 1.75

	fmt.Printf("Name: %v, age: %v, height: %v", name, age, height)
}
```

- Запустите

```bash
go run variables.go

# вывод в консоль
Name: Danil, age: 31, height: 1.75
```
</details>

## Задание 2

::: info Описание
Объявите без инициализации: `int`, `bool`, `string`, `float64`, `*int`, `[]int`, `map[string]int`. Выведите их с fmt.Printf("%v").
:::

**Цель**: Понять, что Go всегда инициализирует переменные, избегая "мусора".

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл variables.go

```go
package main

import (
	"fmt"
)

var (
	a int
	b bool
	c string
	d float64
	e *int
	f []int
	g map[string]int
)

func main() {
	fmt.Printf("%v %v %q %v %v %v %v\n", a, b, c, d, e, f, g)
}
```

- Запустите

```bash
go run variables.go

# вывод в консоль
0 false "" 0 <nil> [] map[]
```
</details>

## Задание 3

::: info Описание
Исследуйте диапазоны int8 и uint8, вызвав переполнение.
:::

**Цель**: Понять signed/unsigned и поведение при overflow (Go не паникует, но wrap around).

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл variables.go

```go
package main

import (
	"fmt"
)

var (
	a int8  = 127
	b uint8 = 0
)

func main() {
	a = a + 1
	b = b - 1
	fmt.Println(a, b)
}
```

- Запустите

```bash
go run variables.go

# вывод в консоль
-128 255
```
</details>

## Задание 4

::: info Описание
Создай константы для любых цветов с помощью iota. Выведите значения.
:::

**Цель**: Освоить константы как enum-подобные.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл variables.go

```go
package main

import (
	"fmt"
)

const (
	Red   = iota // 0
	Green        // 1
	Blue         // 2
)

func main() {
	fmt.Println(Red, Green, Blue)
}
```

- Запустите

```bash
go run variables.go

# вывод в консоль
0 1 2
```
</details>

## Задание 5

::: info Описание
Напиши 2 функции, которая принимает строку и возвращают число
- первая возвращает количество символов (рун)
- вторая возвращает количество байтов.
:::

**Цель**: Освоить разницу byte/rune.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл variables.go

```go
package main

import (
	"fmt"
	"unicode/utf8"
)

func countRunes(s string) int {
	return utf8.RuneCountInString(s)
}

func countBytes(s string) int {
	return len(s)
}

func main() {
	str := "Привет, мир!"

	runes := countRunes(str)
	bytes := countBytes(str)

	fmt.Printf("Количество рун: %d\n", runes)
	fmt.Printf("Количество байтов: %d\n", bytes)
}
```

- Запустите

```bash
go run variables.go

# вывод в консоль
Количество рун: 12
Количество байтов: 21
```
</details>
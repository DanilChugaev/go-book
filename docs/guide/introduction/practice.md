---
# prev: /path/to/previous-page/
next: /guide/variables-and-data-types/variables
---
# Практика

## Задание 1

::: info Описание
Напишите программу "Hello World" по примеру из главы, но модифицируйте вывод на "Hello, [ваше имя]! Welcome to Go!".
:::

**Цель**: Понять структуру программы и запуск.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл hello.go

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, Danil! Welcome to Go!") // замените Danil на своё имя
}
```

- Запустите

```bash
go run hello.go

# вывод в консоль
Hello, Danil! Welcome to Go!
```
</details>

## Задание 2

::: info Описание
Добавьте в предыдущую программу импорт "time" и выведите текущую дату с time.Now().
:::

**Цель**: Практика с import и stdlib.

<details>
  <summary>Ответ</summary>

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    fmt.Println("Hello, Danil! Welcome to Go!") // замените Danil на своё имя
    fmt.Println(time.Now())
}
```

- Запустите

```bash
go run hello.go

# вывод в консоль
Hello, Danil! Welcome to Go!
2025-12-17 22:48:58.001788 +0700 +07 m=+0.000150209
```
</details>
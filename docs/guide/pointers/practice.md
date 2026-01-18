# Практика

## Задание 1 - Указатели на слайсы

::: info Описание
Напишите функцию `resetSlice(s *[]int)`, которая делает слайс `nil` через указатель. В main создайте слайс `[1,2,3]`, выведите его, вызовите функцию и выведите снова. Проверьте на `nil` после.
:::

**Ожидаемый результат**: Изначально `[1 2 3]`, после — `[]` (но это nil, len=0).

**Цель**: Понять, как указатель позволяет перезаписать слайс целиком (nil или новый), чего нельзя без указателя.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл pointers.go

```go
package main

import "fmt"

func resetSlice(s *[]int) {
    *s = nil  // Делаем слайс nil через dereferencing
}

func main() {
    slice := []int{1, 2, 3}
    fmt.Println("Изначально:", slice)

    resetSlice(&slice)
    fmt.Println("После reset:", slice)

    if slice == nil {
        fmt.Println("Слайс теперь nil")
    }
}
```

- Запустите

```bash
go run pointers.go

# вывод в консоль
Изначально: [1 2 3]
После reset: []
Слайс теперь nil
```
</details>

## Задание 2 - Указатели на мапы

::: info Описание
Напишите функцию `clearAndNilMap(m *map[string]int)`, которая удаляет все элементы и делает мапу `nil`. В main создайте мапу `{"a":1, "b":2}`, выведите, вызовите функцию и выведите снова.
:::

**Ожидаемый результат**: Изначально `map[a:1 b:2]`, после `nil`.

**Цель**: Освоить модификацию мапы через указатель для полной перезаписи.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл pointers.go

```go
package main

import "fmt"

func clearAndNilMap(m *map[string]int) {
    for k := range *m {
        delete(*m, k)  // Удаляем все ключи
    }
    *m = nil       // Делаем nil
}

func main() {
    myMap := map[string]int{"a": 1, "b": 2}
    fmt.Println("Изначально:", myMap)

    clearAndNilMap(&myMap)
    fmt.Println("После:", myMap)

    if myMap == nil {
        fmt.Println("Мапа теперь nil")
    }
}
```

- Запустите

```bash
go run pointers.go

# вывод в консоль
Изначально: map[a:1 b:2]
После: map[]
Мапа теперь nil
```
</details>

## Задание 3 - Указатели в структурах

::: info Описание
Создайте struct Person с полем `Age *int` (опциональный возраст). Напишите метод `(p *Person) SetAge(a int)`, который устанавливает возраст. В main создайте Person без возраста (`nil`), выведите, установите и выведите.
:::

**Ожидаемый результат**: Изначально Age: `nil`, после `SetAge(30): Age: 30`.

**Цель**: Понять указатели как поля для опциональных значений и pointer receivers для методов.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл pointers.go

```go
package main

import "fmt"

type Person struct {
    Name string
    Age  *int  // Опциональный возраст
}

func (p *Person) SetAge(a int) {
    p.Age = &a  // Устанавливаем указатель на значение
}

func main() {
    p := Person{Name: "Alice"}
    fmt.Printf("Изначально Age: %v\n", p.Age)

    p.SetAge(30)
    fmt.Printf("После SetAge: %d\n", *p.Age)

    if p.Age != nil {
        fmt.Println("Возраст установлен")
    }
}
```

- Запустите

```bash
go run pointers.go

# вывод в консоль
Изначально Age: <nil>
После SetAge: 30
Возраст установлен
```
</details>

## Задание 4 - Встроенные структуры с указателями

::: info Описание
Создайте `struct Address` с полем `City string`. Затем `struct Person` с встроенным `*Address`. В main создайте `Person` с `Address`, измените `City` через promotion, затем сделайте `Address nil` и обработайте проверкой.
:::

**Ожидаемый результат**: Изначально `City: "Moscow"`, после изменения `"London"`, после `nil: "Нет адреса"`.

**Цель**: Освоить embedding с указателями для опциональных частей и promotion с nil-чеком.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл pointers.go

```go
package main

import "fmt"

type Address struct {
    City string
}

type Person struct {
    Name string
    *Address  // Встроенный указатель
}

func main() {
    addr := Address{City: "Moscow"}
    p := Person{Name: "Bob", Address: &addr}
    fmt.Println("Изначально City:", p.City)

    p.City = "London"
    fmt.Println("После изменения:", p.City)

    p.Address = nil
    if p.Address == nil {
        fmt.Println("Нет адреса")
    }
}
```

- Запустите

```bash
go run pointers.go

# вывод в консоль
Изначально City: Moscow
После изменения: London
Нет адреса
```
</details>

## Задание 5 - Указатели на функции

::: info Описание
Создайте две функции: `add(a, b int) int` и `subtract(a, b int) int`. Напишите функцию `changeOp(op *func(int, int) int, newOp func(int, int) int)`, которая меняет `op` на `newOp`. В `main` инициализируйте `op` как `&add`, вызовите, измените на `subtract` и вызовите снова.
:::

**Ожидаемый результат**: Изначально `add(5,3)=8`, после изменения `subtract(5,3)=2`.

**Цель**: Понять динамическую смену функций через указатели.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл pointers.go

```go
package main

import "fmt"

func add(a, b int) int    { return a + b }
func subtract(a, b int) int { return a - b }

func changeOp(op *func(int, int) int, newOp func(int, int) int) {
    *op = newOp  // Меняем через dereferencing
}

func main() {
    var op func(int, int) int = add
    fmt.Println("Изначально:", op(5, 3))

    changeOp(&op, subtract)
    fmt.Println("После изменения:", op(5, 3))
}
```

- Запустите

```bash
go run pointers.go

# вывод в консоль
Изначально: 8
После изменения: 2
```
</details>

## Задание 6 - Указатели на каналы

::: info Описание
Напишите функцию `closeAndNilChan(ch *chan string)`, которая закрывает канал и делает его `nil`. В `main` создайте канал, отправьте значение в goroutine, получите, вызовите функцию и проверьте на `nil`.
:::

**Ожидаемый результат**: Получено `"test"`, после: `канал == nil`.

**Цель**: Освоить модификацию канала через указатель для динамического управления.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл pointers.go

```go
package main

import "fmt"

func closeAndNilChan(ch *chan string) {
    close(*ch)  // Закрываем
    *ch = nil   // Nil
}

func main() {
    ch := make(chan string)
    go func() {
        ch <- "test"
    }()

    val := <-ch
    fmt.Println("Получено:", val)

    closeAndNilChan(&ch)
    if ch == nil {
        fmt.Println("Канал теперь nil")
    }
}
```

- Запустите

```bash
go run pointers.go

# вывод в консоль
Получено: test
Канал теперь nil
```
</details>

## Задание 7 - Указатели на интерфейсы

::: info Описание
Определите `interface Speaker` с методом `Speak() string`. Реализуйте для `struct Cat` и `Dog`. Напишите функцию `swapSpeaker(s **Speaker, newS Speaker)`, которая меняет имплементацию. В `main` инициализируйте с `Cat`, смените на `Dog` и вызовите `Speak`.
:::

**Ожидаемый результат**: Изначально `"Meow"`, после `"Woof"`.

**Цель**: Понять смену имплементации интерфейса через указатель.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл pointers.go

```go
package main

import "fmt"

type Speaker interface {
    Speak() string
}

type Cat struct{}
func (c Cat) Speak() string { return "Meow" }

type Dog struct{}
func (d Dog) Speak() string { return "Woof" }

func swapSpeaker(s **Speaker, newS Speaker) {
    *s = &newS  // Меняем значение интерфейса
}

func main() {
    var animal Speaker = Cat{}
    var ptr *Speaker = &animal

    fmt.Println((*ptr).Speak())

    swapSpeaker(&ptr, Dog{})
    fmt.Println((*ptr).Speak())
}
```

- Запустите

```bash
go run pointers.go

# вывод в консоль
Meow
Woof
```
</details>

## Задание 8 - Многоуровневые указатели

::: info Описание
Напишите функцию `reallocPtr(pp **string, newVal string)`, которая создаёт новую строку и меняет указатель на неё. В main создайте `string "Old"`, `*string` на неё, `**string` на `*string`. Вызовите функцию и выведите.
:::

**Ожидаемый результат**: Изначально `"Old"`, после `"New"`.

**Цель**: Понять индирекцию для изменения указателей.

<details>
  <summary>Ответ</summary>

Что нужно сделать:
- Создайте файл pointers.go

```go
package main

import "fmt"

func reallocPtr(pp **string, newVal string) {
    *pp = &newVal  // Меняем указатель на новый адрес
}

func main() {
    old := "Old"
    p := &old         // *string
    pp := &p          // **string

    fmt.Println(**pp)

    reallocPtr(pp, "New")
    fmt.Println(**pp)
}
```

- Запустите

```bash
go run pointers.go

# вывод в консоль
Old
New
```
</details>
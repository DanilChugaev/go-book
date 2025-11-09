# Указатели в структурах

## Определение

> Указатели в структурах — это мощный инструмент, который позволяет работать с данными эффективно. В Go структуры (structs) — это составные типы данных, как классы в других языках, но без наследования.

Указатели могут использоваться в структурах двумя основными способами:

1. **Как поля внутри структуры**: Поле типа `*T` (указатель на какой-то тип). Это полезно для "опциональных" полей (может быть nil), ссылок на другие данные или экономии памяти (вместо встраивания больших объектов).
2. **В методах структур (pointer receivers)**: Метод объявляется с приёмником `*Struct`, чтобы изменять оригинальную структуру. Без этого метод работает с копией.

**Зачем указатели в структурах?**

- **Изменяемость**: Структуры передаются по значению (копируются). Указатели позволяют изменять оригинал без копирования.
- **Экономия**: Для больших структур копирование дорого. Указатель — всего 8 байт (на 64-битной системе).
- **Опциональность**: Поле-указатель может быть nil, что значит "нет значения" (в отличие от zero-value, как пустая строка).
- **Ссылки**: Структуры могут ссылаться друг на друга (например, в деревьях или графах).
- **Методы**: Pointer receivers позволяют методам мутировать структуру, как в OOP.

::: warning Важно
В Go старайся использовать указатели только когда нужно (для изменений или nil). Иначе используй value types для простоты и безопасности. Всегда проверяй на nil, чтобы избежать panic.
:::

## Примеры использования указателей в структурах

Давай разберём на примерах. Код можно скопировать и запустить (`go run main.go`).

### Пример 1: Указатель как поле в структуре (опциональное поле)

Здесь структура имеет поле-указатель на int. Это позволяет полю быть nil.

```go
package main

import "fmt"

type Employee struct {
    Name string
    Age  *int  // Указатель на int (может быть nil)
}

func main() {
    // Создаём структуру без возраста
    e1 := Employee{Name: "Alice"}
    fmt.Println("e1:", e1.Name, "Age:", e1.Age)  // Alice Age: <nil>
    
    if e1.Age == nil {
        fmt.Println("Возраст Alice не указан")
    }
    
    // Создаём с возрастом
    age := 30
    e2 := Employee{Name: "Bob", Age: &age}
    fmt.Println("e2:", e2.Name, "Age:", *e2.Age)  // Bob Age: 30
    
    // Меняем через указатель
    *e2.Age = 31
    fmt.Println("Новый возраст Bob:", *e2.Age)  // 31
    fmt.Println("Оригинальный age:", age)       // 31 (изменился, т.к. указатель)
    
    // Делаем nil
    e2.Age = nil
    if e2.Age == nil {
        fmt.Println("Возраст Bob удалён")
    }
}
```

**Что происходит?** Поле `Age` может быть nil (нет возраста) или указывать на int. Это полезно в моделях данных (например, в JSON: nil — null).

**Зачем?** Для полей, которые не всегда заполнены (опциональные атрибуты в БД или API).

### Пример 2: Указатели в методах структур (pointer receivers)

Методы в Go — это функции с "приёмником" (receiver). Если receiver — `*Struct`, метод может изменять структуру.

Без указателя (value receiver — копия):

```go
package main

import "fmt"

type Counter struct {
    Value int
}

// Value receiver: работает с копией
func (c Counter) Increment() {
    c.Value++  // Изменяет копию
}

func main() {
    cnt := Counter{Value: 5}
    cnt.Increment()
    fmt.Println(cnt.Value)  // 5 (не изменилось)
}
```

С указателем (pointer receiver):

```go
package main

import "fmt"

type Counter struct {
    Value int
}

// Pointer receiver: изменяет оригинал
func (c *Counter) Increment() {
    c.Value++  // Без * (Go упрощает)
}

func main() {
    cnt := Counter{Value: 5}
    cnt.Increment()  // Go автоматически берёт &cnt
    fmt.Println(cnt.Value)  // 6
    
    // Явно с указателем
    ptr := &cnt
    ptr.Increment()
    fmt.Println(cnt.Value)  // 7
}
```

**Что происходит?** Pointer receiver позволяет методу мутировать структуру. Go позволяет вызывать метод на value (cnt.Increment()), автоматически беря адрес (&).

**Зачем?** Для методов вроде "Update", "Reset" в объектах (например, в играх или UI). Рекомендация: Используй pointer receivers, если метод меняет структуру или структура большая.

### Пример 3: Передача структуры по указателю в функцию

Структуры копируются при передаче. Указатель позволяет изменить оригинал.

```go
package main

import "fmt"

type Point struct {
    X, Y int
}

func moveBad(p Point) {
    p.X += 10  // Меняем копию
}

func moveGood(p *Point) {
    p.X += 10  // Меняем оригинал
}

func main() {
    pt := Point{X: 5, Y: 0}
    
    moveBad(pt)
    fmt.Println("После moveBad:", pt.X)  // 5 (не изменилось)
    
    moveGood(&pt)
    fmt.Println("После moveGood:", pt.X)  // 15
}
```

**Зачем?** Для функций, модифицирующих структуры (например, обновление координат в графике). Экономит память для больших структур.

### Пример 4: Структуры с указателями на другие структуры (ссылки)

Указатели позволяют структурам ссылаться друг на друга, как в linked lists или trees.

```go
package main

import "fmt"

type Node struct {
    Value int
    Next  *Node  // Указатель на следующую Node
}

func (n *Node) PrintChain() {
    current := n
    for current != nil {
        fmt.Print(current.Value, " -> ")
        current = current.Next
    }
    fmt.Println("nil")
}

func main() {
    // Создаём цепочку
    head := &Node{Value: 1}
    head.Next = &Node{Value: 2}
    head.Next.Next = &Node{Value: 3}
    
    head.PrintChain()  // 1 -> 2 -> 3 -> nil
    
    // Меняем через указатель
    head.Next.Value = 20
    head.PrintChain()  // 1 -> 20 -> 3 -> nil
    
    // Разрываем цепочку
    head.Next = nil
    head.PrintChain()  // 1 -> nil
}
```

**Что происходит?** Каждая Node ссылается на следующую через указатель. Метод PrintChain использует pointer receiver для доступа.

**Зачем?** Для динамических структур данных (списки, деревья). Без указателей пришлось бы встраивать (embedded), но это не гибко.

### Пример 5: Nil в полях-указателях и проверка

```go
package main

import "fmt"

type Book struct {
    Title  string
    Author *string  // Указатель на string (опциональный автор)
}

func printBook(b Book) {
    fmt.Print(b.Title)
    if b.Author == nil {
        fmt.Println(" (Автор неизвестен)")
    } else {
        fmt.Println(" by", *b.Author)
    }
}

func main() {
    b1 := Book{Title: "Go Programming"}
    printBook(b1)  // Go Programming (Автор неизвестен)
    
    author := "Russ Cox"
    b2 := Book{Title: "Effective Go", Author: &author}
    printBook(b2)  // Effective Go by Russ Cox
}
```

**Зачем?** Для обработки отсутствующих данных без zero-values (пустая строка — это не то же, что "нет автора").

## Советы по использованию

- **Когда использовать указатели в полях**: Для опциональных или больших вложенных типов. Избегай циклических ссылок (A указывает на B, B на A) — может привести к утечкам памяти.
- **В методах**: Если метод меняет структуру — используй `*Struct`. Если только читает — value receiver.
- **Ошибки**: Dereferencing nil поля — panic. Всегда проверяй `if field != nil`.
- **JSON и т.д.**: В encoding/json указатели позволяют marshal в null.
- **Практика**: Создай структуру Person с *Address (Address — другая struct). Напиши метод для обновления адреса.

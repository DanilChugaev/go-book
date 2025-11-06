# Указатели в структурах

Продолжаем изучение Go! Указатели в структурах — это мощный инструмент, который позволяет работать с данными эффективно. В Go структуры (structs) — это составные типы данных, как классы в других языках, но без наследования. Указатели могут использоваться в структурах двумя основными способами:
1. **Как поля внутри структуры**: Поле типа `*T` (указатель на какой-то тип). Это полезно для "опциональных" полей (может быть nil), ссылок на другие данные или экономии памяти (вместо встраивания больших объектов).
2. **В методах структур (pointer receivers)**: Метод объявляется с приёмником `*Struct`, чтобы изменять оригинальную структуру. Без этого метод работает с копией.

**Зачем указатели в структурах?**
- **Изменяемость**: Структуры передаются по значению (копируются). Указатели позволяют изменять оригинал без копирования.
- **Экономия**: Для больших структур копирование дорого. Указатель — всего 8 байт (на 64-битной системе).
- **Опциональность**: Поле-указатель может быть nil, что значит "нет значения" (в отличие от zero-value, как пустая строка).
- **Ссылки**: Структуры могут ссылаться друг на друга (например, в деревьях или графах).
- **Методы**: Pointer receivers позволяют методам мутировать структуру, как в OOP.

**Важно**: В Go старайся использовать указатели только когда нужно (для изменений или nil). Иначе используй value types для простоты и безопасности. Всегда проверяй на nil, чтобы избежать panic.

Давай разберём на примерах. Код можно скопировать и запустить (`go run main.go`).

#### Пример 1: Указатель как поле в структуре (опциональное поле)
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

- **Что происходит?** Поле `Age` может быть nil (нет возраста) или указывать на int. Это полезно в моделях данных (например, в JSON: nil — null).
- **Зачем?** Для полей, которые не всегда заполнены (опциональные атрибуты в БД или API).

#### Пример 2: Указатели в методах структур (pointer receivers)
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

- **Что происходит?** Pointer receiver позволяет методу мутировать структуру. Go позволяет вызывать метод на value (cnt.Increment()), автоматически беря адрес (&).
- **Зачем?** Для методов вроде "Update", "Reset" в объектах (например, в играх или UI). Рекомендация: Используй pointer receivers, если метод меняет структуру или структура большая.

#### Пример 3: Передача структуры по указателю в функцию
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

- **Зачем?** Для функций, модифицирующих структуры (например, обновление координат в графике). Экономит память для больших структур.

#### Пример 4: Структуры с указателями на другие структуры (ссылки)
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

- **Что происходит?** Каждая Node ссылается на следующую через указатель. Метод PrintChain использует pointer receiver для доступа.
- **Зачем?** Для динамических структур данных (списки, деревья). Без указателей пришлось бы встраивать (embedded), но это не гибко.

#### Пример 5: Nil в полях-указателях и проверка
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

- **Зачем?** Для обработки отсутствующих данных без zero-values (пустая строка — это не то же, что "нет автора").

#### Советы по использованию
- **Когда использовать указатели в полях**: Для опциональных или больших вложенных типов. Избегай циклических ссылок (A указывает на B, B на A) — может привести к утечкам памяти.
- **В методах**: Если метод меняет структуру — используй `*Struct`. Если только читает — value receiver.
- **Ошибки**: Dereferencing nil поля — panic. Всегда проверяй `if field != nil`.
- **JSON и т.д.**: В encoding/json указатели позволяют marshal в null.
- **Практика**: Создай структуру Person с *Address (Address — другая struct). Напиши метод для обновления адреса.

### Встроенные структуры с указателями в Go: Подробное объяснение с примерами

Продолжаем изучение Go! Встроенные структуры (embedded structs или anonymous fields) — это мощная фича Go, которая позволяет одной структуре "встраивать" другую без указания имени поля. Это даёт **промоушен** (promotion) полей и методов: поля и методы встроенной структуры становятся доступны напрямую в родительской структуре, как будто они её собственные.

Теперь про **встроенные структуры с указателями** (`*Struct` как anonymous field). Это комбинация embedding и указателей. Вместо встраивания value-структуры, мы встраиваем указатель на структуру. Это добавляет гибкость:
- **Nil-возможность**: Встроенная часть может быть nil (отсутствовать), что полезно для опциональных компонентов.
- **Изменяемость**: Легко менять встроенную часть динамически.
- **Экономия памяти**: Указатель занимает мало места, и можно делить данные между структурами.
- **Промоушен с оговорками**: Поля и методы доступны, но нужно учитывать nil (иначе panic).

**Зачем это использовать?**
- Для композиции (composition) вместо наследования: Например, базовая структура "Person" встраивается в "Employee" как указатель, чтобы Employee мог иметь или не иметь Person-данных.
- Опциональные части: Встроенная структура может быть инициализирована позже или оставлена nil.
- Динамика: Легко заменять встроенную часть на другую.
- Но: Это реже используется, чем простое embedding, потому что добавляет проверки на nil. Если не нужна nil-возможность, лучше встраивать value.

**Важно**: При доступе к промотированным полям через указатель Go упрощает синтаксис (не нужно `*`), но всегда проверяй на nil. Если встроенный указатель nil, доступ к его полям — panic.

Давай разберём на примерах. Код можно скопировать и запустить.

#### Пример 1: Базовое встраивание с указателем (promotion полей)
Сначала напомню простое embedding без указателя:
```go
package main

import "fmt"

type Address struct {
    City string
}

type Person struct {
    Name string
    Address  // Встроенная (value)
}

func main() {
    p := Person{Name: "Alice", Address: Address{City: "New York"}}
    fmt.Println(p.City)  // Promotion: доступ напрямую (New York)
}
```

Теперь с указателем:
```go
package main

import "fmt"

type Address struct {
    City string
}

type Person struct {
    Name string
    *Address  // Встроенная как указатель (anonymous)
}

func main() {
    // Без адреса (nil)
    p1 := Person{Name: "Alice"}
    fmt.Println("p1.City:", p1.City)  // Panic! Если раскомментировать: nil dereference
    
    // С адресом
    addr := Address{City: "New York"}
    p2 := Person{Name: "Bob", Address: &addr}
    fmt.Println("p2.City:", p2.City)  // New York (promotion работает)
    
    // Меняем через promotion
    p2.City = "London"
    fmt.Println("Новый город:", addr.City)  // London (изменился оригинал)
    
    // Проверяем на nil
    if p2.Address != nil {
        fmt.Println("Адрес есть:", p2.City)
    }
    
    // Делаем nil
    p2.Address = nil
    if p2.Address == nil {
        fmt.Println("Адрес удалён")
    }
}
```

- **Что происходит?** `*Address` встроен анонимно, так что `p.City` — это shortcut для `p.Address.City` (Go автоматически dereference). Но если Address nil, доступ к City — ошибка.
- **Зачем?** Для опциональных вложенных данных (например, Person может иметь или не иметь Address).

#### Пример 2: Promotion методов с указателем
Методы встроенной структуры тоже промотируются. С указателем метод вызывается на *Address (pointer receiver работает).

```go
package main

import "fmt"

type Address struct {
    City string
}

// Метод на pointer receiver
func (a *Address) ChangeCity(newCity string) {
    a.City = newCity
}

// Метод на value receiver
func (a Address) Print() {
    fmt.Println("Город:", a.City)
}

type Person struct {
    Name string
    *Address  // Встроенная с указателем
}

func main() {
    addr := Address{City: "Paris"}
    p := Person{Name: "Charlie", Address: &addr}
    
    // Promotion метода: вызываем напрямую
    p.ChangeCity("Berlin")
    fmt.Println("Новый город:", p.City)  // Berlin
    
    p.Print()  // Город: Berlin (value-метод тоже работает)
    
    // Если nil
    p.Address = nil
    // p.Print()  // Panic! nil dereference
    if p.Address != nil {
        p.Print()
    } else {
        fmt.Println("Нет адреса")
    }
}
```

- **Что происходит?** Методы промотируются, но если указатель nil, вызов — panic. Pointer receivers идеальны для изменений.
- **Зачем?** Для расширения поведения: Person "наследует" методы Address, но с опцией nil.

#### Пример 3: Встраивание нескольких с указателями (множественное "наследование")
Go позволяет встраивать несколько, но если поля/методы конфликтуют — нужно уточнять.

```go
package main

import "fmt"

type Contact struct {
    Email string
}

type Location struct {
    City string
}

type User struct {
    Name string
    *Contact   // Встроенная
    *Location  // Встроенная
}

func main() {
    contact := Contact{Email: "user@example.com"}
    location := Location{City: "Tokyo"}
    
    u := User{Name: "David", Contact: &contact, Location: &location}
    
    fmt.Println(u.Email)  // Promotion от Contact
    fmt.Println(u.City)   // Promotion от Location
    
    // Меняем
    u.Email = "new@example.com"
    fmt.Println(contact.Email)  // new@example.com
    
    // Nil одна часть
    u.Location = nil
    if u.Location != nil {
        fmt.Println(u.City)
    } else {
        fmt.Println("Нет локации")
    }
}
```

- **Зачем?** Для композиции из нескольких частей, каждая из которых опциональна (например, User может иметь Contact, но не Location).

#### Пример 4: Инициализация и JSON (практический случай)
Встраивание с указателями полезно в JSON: nil — null в выводе.

```go
package main

import (
    "encoding/json"
    "fmt"
)

type Details struct {
    Notes string
}

type Item struct {
    ID string
    *Details  // Опциональные детали
}

func main() {
    // Без деталей
    i1 := Item{ID: "001"}
    data1, _ := json.Marshal(i1)
    fmt.Println(string(data1))  // {"ID":"001","Details":null}
    
    // С деталями
    details := Details{Notes: "Important"}
    i2 := Item{ID: "002", Details: &details}
    data2, _ := json.Marshal(i2)
    fmt.Println(string(data2))  // {"ID":"002","Details":{"Notes":"Important"}}
}
```

- **Зачем?** В API или сериализации: Опциональные вложенные объекты как null, а не пустые {}.

#### Советы по использованию
- **Проверки**: Всегда `if embedded != nil` перед доступом к промотированным полям/методам.
- **Конфликты**: Если два embedded имеют одинаковые поля, уточняй: `p.Address.City` вместо `p.City`.
- **Когда избегать**: Если не нужна nil-возможность, встраивай value — проще и без panic-рисков.
- **Производительность**: Embedding бесплатно (нет overhead), указатель добавляет indiirection, но незначительно.
- **Практика**: Создай структуру Car с встроенным *Engine. Напиши метод Start(), который проверяет nil.

Читать дальше - [[05 - Другие виды указателей]]

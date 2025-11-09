# Встроенные структуры с указателями

## Определение

> Встроенные структуры (embedded structs или anonymous fields) — это мощная фича Go, которая позволяет одной структуре "встраивать" другую без указания имени поля.

Это даёт **промоушен** (promotion) полей и методов: поля и методы встроенной структуры становятся доступны напрямую в родительской структуре, как будто они её собственные.

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

::: warning Важно
При доступе к промотированным полям через указатель Go упрощает синтаксис (не нужно `*`), но всегда проверяй на nil. Если встроенный указатель nil, доступ к его полям — panic.
:::

## Примеры использования встроенных структур с указателями

Давай разберём на примерах. Код можно скопировать и запустить.

### Пример 1: Базовое встраивание с указателем (promotion полей)

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

**Что происходит?** `*Address` встроен анонимно, так что `p.City` — это shortcut для `p.Address.City` (Go автоматически dereference). Но если Address nil, доступ к City — ошибка.

**Зачем?** Для опциональных вложенных данных (например, Person может иметь или не иметь Address).

### Пример 2: Promotion методов с указателем

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

**Что происходит?** Методы промотируются, но если указатель nil, вызов — panic. Pointer receivers идеальны для изменений.

**Зачем?** Для расширения поведения: Person "наследует" методы Address, но с опцией nil.

### Пример 3: Встраивание нескольких с указателями (множественное "наследование")

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

**Зачем?** Для композиции из нескольких частей, каждая из которых опциональна (например, User может иметь Contact, но не Location).

### Пример 4: Инициализация и JSON (практический случай)

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

**Зачем?** В API или сериализации: Опциональные вложенные объекты как null, а не пустые {}.

## Советы по использованию

- **Проверки**: Всегда `if embedded != nil` перед доступом к промотированным полям/методам.
- **Конфликты**: Если два embedded имеют одинаковые поля, уточняй: `p.Address.City` вместо `p.City`.
- **Когда избегать**: Если не нужна nil-возможность, встраивай value — проще и без panic-рисков.
- **Производительность**: Embedding бесплатно (нет overhead), указатель добавляет indiirection, но незначительно.
- **Практика**: Создай структуру Car с встроенным *Engine. Напиши метод Start(), который проверяет nil.

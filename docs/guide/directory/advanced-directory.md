# Продвинутые понятия

Эта "страница" — отдельный справочник по advanced (продвинутым) понятиям и концепциям Go. Он предназначен для тех, кто уже освоил базовые (см. предыдущую страницу справочника). Здесь мы фокусируемся на более сложных темах, которые используются в реальных проектах: от generics и concurrency patterns до low-level инструментов вроде unsafe. Каждое понятие объяснено с примерами, аналогиями, подводными камнями и ссылками на связанные базовые концепции.

В основе спецификация Go (1.23+ на 2025 год) и best practices из "Effective Go".

Справочник организован по категориям.

Для практики: Запускай примеры в `main.go`.

::: warning Предупреждение
Advanced темы требуют осторожности — они могут привести к ошибкам (panics, race conditions), так что тестируй код.
:::

## 1. Типы и generics

### Generics (Дженерики)

> Параметризованные типы/функции (с Go 1.18+).

Позволяют писать обобщённый код для разных типов с type parameters. Синтаксис: func[T any](params) или type Set[T comparable] struct {}.

**Аналогия**: Шаблон, который адаптируется под разные "формы" данных.

**Пример**:

```go
package main

import "fmt"

// Обобщённая функция
func Print[T any](v T) {
    fmt.Println(v)
}

// Обобщённый тип
type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

func main() {
    Print[int](42)     // 42
    Print[string]("Go") // Go
    
    var intStack Stack[int]
    intStack.Push(1)
    fmt.Println(intStack.items)  // [1]
}
```

**Подводные камни**: Constraints (any — любой тип, comparable — для ==/!=, ~int — underlying int). Нет specialization (как в C++).

**Связанные**: Type (базовый), Interface (constraints как interfaces). **Дальше**: Type inference (Go угадывает T).

### Type alias (Псевдоним типа)

> Объявление нового имени для существующего типа: type MyInt = int.

Не создаёт новый тип, только синоним.

**Аналогия**: Никнейм для друга — то же лицо, но другое имя.

**Пример**:

```go
type ID = string
var userID ID = "abc123"
```

**Подводный камень**: Не совместим с generics напрямую.

**Связанные**: Type (базовый).

### Underlying type (Underlying тип)

> "Базовый" тип под alias или defined type.

Для type MyInt int — underlying int. Полезно в generics (~T для underlying T).

**Аналогия**: Основа под маской.

**Пример**: В generics: func[T ~int](v T) {}.

**Связанные**: Generics.

## 2. Concurrency patterns (Паттерны параллелизма)

### Context (Контекст)

> Пакет context для отмены операций, таймаутов и передачи значений в goroutines.

context.Background() — базовый, WithCancel/WithTimeout/WithValue — производные.

**Аналогия**: "Билет" с таймером отмены для задач.

**Пример**:

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func worker(ctx context.Context) {
    select {
    case <-ctx.Done():
        fmt.Println("Cancelled:", ctx.Err())
    case <-time.After(2 * time.Second):
        fmt.Println("Done")
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), time.Second)
    defer cancel()
    go worker(ctx)
    time.Sleep(3 * time.Second)  // Timeout сработает
}
```

**Подводные камни**: Всегда проверяй ctx.Done(). Не передавай большие данные в Value (это для request-scoped).

**Связанные**: Goroutine (базовый), Channel.

**Дальше**: Errgroup (для групп goroutines с ошибками).

### Sync.WaitGroup

> Структура для ожидания завершения группы goroutines. Add/Done/Wait.

**Аналогия**: Счётчик задач — жди, пока все не закончат.

**Пример**:

```go
var wg sync.WaitGroup
wg.Add(1)
go func() {
    defer wg.Done()
    // Работа
}()
wg.Wait()  // Ждём
```

**Связанные**: Goroutine, Mutex.

### Sync.Once

> Выполняет функцию ровно один раз, даже в многопотоке.

**Аналогия**: Инициализация singleton.

**Пример**:

```go
var once sync.Once
once.Do(func() { fmt.Println("Init") })  // Только раз
```

**Связанные**: Mutex.

### Atomic operations (Атомарные операции)

> Пакет sync/atomic для thread-safe операций без мьютекса (Add, Load, Store).

**Аналогия**: Неуязвимая операция в многопотоке.

**Пример**:

```go
atomic.AddInt64(&counter, 1)
```

**Связанные**: Mutex, Race condition (избегай с помощью -race флага: go run -race main.go).

### Race condition (Состояние гонки)

> Ошибка, когда goroutines конкурируют за доступ к данным без синхронизации.

**Аналогия**: Два человека пишут в один блокнот одновременно — хаос.

**Связанные**: Mutex, Atomic.

**Инструмент**: `go run -race` для детекции.

## 3. Ошибки и отладка

### Custom error (Пользовательская ошибка)

> Struct, реализующая error interface.

Добавь методы как Unwrap для chaining.

**Аналогия**: Расширенный флаг ошибки с деталями.

**Пример**:

```go
type MyError struct { Msg string }
func (e *MyError) Error() string { return e.Msg }
errors.Is(err, MyError{})  // Проверка
```

**Связанные**: Error (базовый), errors.Unwrap (для wrapped errors).

### Reflection (Рефлексия)

> Пакет reflect для runtime-инспекции типов/значений. Reflect.TypeOf, ValueOf.

**Аналогия**: Зеркало для кода — смотри на себя во время выполнения.

**Пример**:

```go
v := reflect.ValueOf(42)
fmt.Println(v.Type())  // int
```

**Подводные камни**: Медленно, небезопасно — используй редко (для JSON, ORM).

**Связанные**: Interface.

## 4. Low-level и интеграция

### Unsafe (Unsafe пакет)

> Для обхода type safety: unsafe.Pointer (как void* в C), Sizeof, Offsetof, Alignof.

**Аналогия**: "Опасная зона" — ручное управление памятью.

**Пример**:

```go
import "unsafe"
i := 42
p := unsafe.Pointer(&i)
```

**Подводные камни**: Может вызвать UB (undefined behavior) — используй только если знаешь.

**Связанные**: Pointer (базовый), CGO.

### CGO

> Интеграция с C-кодом. #include в комментариях, C. types.

**Аналогия**: Мост между Go и C.

**Пример**:

```go
// #include <stdio.h>
import "C"
C.puts(C.CString("Hello from C"))
```

**Подводные камни**: Overhead, не портативно. Флаг: go build -buildmode=c-shared.

**Связанные**: Unsafe.

## 5. Тестирование и производительность

### Testing (Тестирование)

> Пакет testing для unit-тестов. Функции TestXXX(t *testing.T).

**Аналогия**: Проверка, работает ли код.

**Пример**: В _test.go:

```go
func TestAdd(t *testing.T) {
    if add(1, 2) != 3 {
        t.Error("Failed")
    }
}
```

**Связанные**: go test, Table-driven tests.

### Benchmark (Бенчмарк)

> Измерение производительности: `BenchmarkXXX(b *testing.B)`.

  **Пример**:

  ```go
  func BenchmarkAdd(b *testing.B) {
      for i := 0; i < b.N; i++ {
          add(1, 2)
      }
  }
  ```

  **Связанные**: go test -bench.

### Profiling (Профилирование)

> Инструменты для анализа (CPU, memory): pprof.

**Пример**: import _ "net/http/pprof"; go tool pprof.

**Связанные**: Testing.

## 6. Модули и build

### Build constraints (Build теги)

> `//go:build` для conditional компиляции (по ОС, arch).

**Пример**: `//go:build linux` — файл только для Linux.

**Связанные**: Compilation (базовый).

### Vendoring

> Копирование зависимостей в vendor/. go mod vendor.

**Аналогия**: Локальный склад зависимостей.

**Связанные**: Module.

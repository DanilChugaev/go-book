---
prev: /guide/advanced-types-generics/type-parameters.md
next: /guide/advanced-types-generics/generic-types-design.md
---

# Constraints, type sets и оператор `~`

## Constraint — это интерфейс для параметра типа

В generic-коде интерфейс может описывать не объект с методами, а множество типов, которые разрешено подставить вместо `T`. Такой интерфейс называют constraint.

Самый простой constraint уже знаком:

```go
func Clone[T any](values []T) []T {
	return append([]T(nil), values...)
}
```

`any` разрешает все типы. `comparable` разрешает типы, для которых доступны `==` и `!=`. Свой constraint можно назвать и использовать повторно:

```go
type Number interface {
	int | int64 | float64
}

func Sum[T Number](values []T) T {
	var total T
	for _, value := range values {
		total += value
	}
	return total
}
```

Вертикальная черта означает union: `T` может быть `int`, `int64` **или** `float64`. Компилятор разрешает в теле только операции, которые корректны для каждого типа type set. Для перечисленных числовых типов `+` допустим.

## Методы и type terms нельзя смешивать произвольно

Обычный интерфейс значений задаёт методы:

```go
type Stringer interface {
	String() string
}
```

А constraint может объединить требование метода с семейством типов:

```go
type TaskCode interface {
	~string
	String() string
}
```

Такой constraint означает: тип должен иметь underlying type `string` и метод `String() string`. Важно: интерфейсы с type terms (`~string`, `int | int64`) предназначены для параметров типа. Их нельзя использовать как обычный тип переменной:

```go
// var code TaskCode // Ошибка: constraint interface нельзя использовать как value type.
```

Не пытайтесь заменить этим привычные маленькие интерфейсы зависимостей Task Manager API. Например, `TaskRepository` описывает поведение конкретного объекта и остаётся обычным интерфейсом, который передают в service как значение.

## Точное имя типа: `int`

Constraint с одним типом без `~` разрешает только этот точный тип:

```go
type IntOnly interface {
	int
}

func DoubleInt[T IntOnly](value T) T {
	return value * 2
}

type RetryCount int

fmt.Println(DoubleInt(5)) // 10
// DoubleInt(RetryCount(5)) // Ошибка: RetryCount — не точный int.
```

Несмотря на underlying type `int`, `RetryCount` — отдельный defined type. Это именно то, что мы хотели получить в первой странице главы.

## Семейство типов: `~int`

Тильда `~` расширяет type term: разрешён любой defined type с указанным underlying type, а также сам базовый тип.

```go
type Integer interface {
	~int | ~int64
}

func Double[T Integer](value T) T {
	return value * 2
}

type RetryCount int
type TaskID int64

fmt.Println(Double(RetryCount(3))) // 6, тип результата RetryCount
fmt.Println(Double(TaskID(42)))    // 84, тип результата TaskID
```

`~int` не означает «все числа» и не выполняет преобразование. Он описывает типы, underlying type которых ровно `int`. Например, `int32`, `uint` и `float64` не подходят.

Это особенно важно, когда generic-helper должен сохранять defined type результата. Функция с `func Double[T ~int](value T) T` вернёт `RetryCount`, а не голый `int`.

## Почему constraints должны быть минимальными

Constraint — контракт алгоритма. Запрашивайте только те операции, которые использует тело функции.

Если функция лишь копирует слайс, ей не нужен `comparable`:

```go
func Clone[T any](values []T) []T {
	return append([]T(nil), values...)
}
```

Если функция строит map частот, ей нужен именно `comparable`:

```go
func Frequency[T comparable](values []T) map[T]int {
	counts := make(map[T]int)
	for _, value := range values {
		counts[value]++
	}
	return counts
}
```

Если функция сортирует, одного перечисления числовых типов часто недостаточно: нужно определить, что означает порядок, как сравнивать строки, пользовательские enum и поля структуры. Вместо слишком широкого самодельного `Ordered` constraint нередко яснее принять `less func(left, right T) bool`:

```go
func SortBy[T any](values []T, less func(left, right T) bool) {
	slices.SortFunc(values, func(left, right T) int {
		switch {
		case less(left, right):
			return -1
		case less(right, left):
			return 1
		default:
			return 0
		}
	})
}
```

Этот API прямо просит вызывающий код определить порядок. Для `Task` это часто полезнее, чем делать `Task` «упорядочиваемым» типом: сортировка по приоритету, title и дате — разные бизнес-операции.

## Нельзя получить поле или метод «из underlying type»

Type set не сообщает, какие поля есть у структуры. Даже если вы перечислите несколько структурных типов, нельзя написать общий `value.ID`, пока constraint не требует метод:

```go
type HasTaskID interface {
	TaskID() TaskID
}

func CollectTaskIDs[T HasTaskID](values []T) []TaskID {
	ids := make([]TaskID, 0, len(values))
	for _, value := range values {
		ids = append(ids, value.TaskID())
	}
	return ids
}
```

Для domain-моделей часто лучше вовсе не создавать generic helper, а написать явную функцию `TaskIDs(tasks []Task) []TaskID`: она проще для поиска, её бизнес-смысл ясен, а переиспользование может никогда не понадобиться.

## Встраивание constraints

Constraint может включать другой constraint. Это удобно, когда новый контракт уточняет уже существующий:

```go
type Integer interface {
	~int | ~int64
}

type PositiveInteger interface {
	Integer
}
```

Но `PositiveInteger` выше вводит в заблуждение: type set не может доказать, что **значение** положительно. Название обещает больше, чем выражает constraint. Проверка значений остаётся обычной логикой:

```go
func IsPositive[T Integer](value T) bool {
	return value > 0
}
```

Хорошие имена constraints говорят о разрешённых типах или доступных операциях: `Integer`, `StringLike`, `TaskCode`. Не называйте их `ValidID`, `NonEmptyString` или `PositiveNumber`, если это свойства конкретных значений.

## Type approximation и эволюция API

Выбор между `int` и `~int` меняет публичный API generic-функции:

- `int` подходит, когда алгоритм намеренно предназначен только для встроенного `int`;
- `~int` подходит, когда алгоритм корректен для всего семейства defined types на `int` и должен сохранить их тип.

Добавление `~` делает функцию более гибкой, но не всегда более понятной. Для внутреннего helper, который вызывается с `RetryCount`, это может быть верный выбор. Для маленького API, который всегда работает с `int`, лишняя абстракция ничего не приносит.

## Проверяйте ограничения компилятором

Тесты generic-кода должны проверять поведение для нескольких репрезентативных подстановок: базового типа и defined type с тем же underlying type. Но тест не может проверить, что неподходящий тип **не компилируется**, не превратив проект в намеренно ломающуюся сборку.

Обычно достаточно:

- держать constraint коротким и читаемым;
- показывать запрещённый вызов в комментарии;
- запускать `go test ./...` и при необходимости `go vet ./...`;
- не расширять type set без реального использования и отдельного решения об API.

Следующая страница объединит параметры и constraints в generic-типы и поможет решить, когда такая абстракция уместна в приложении.

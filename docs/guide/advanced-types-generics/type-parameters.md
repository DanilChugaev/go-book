---
prev: /guide/advanced-types-generics/README.md
next: /guide/advanced-types-generics/constraints-type-sets.md
---

# Параметры типов и generic-функции

## Что меняют generics

Обычная функция получает значения известных типов:

```go
func containsTaskID(ids []TaskID, wanted TaskID) bool {
	for _, id := range ids {
		if id == wanted {
			return true
		}
	}
	return false
}
```

Та же операция — поиск значения в слайсе — подходит для строк, чисел и других сравнимых типов. До generics были три типичных варианта:

- написать отдельную функцию для каждого типа;
- принять `[]any` и проверять типы во время выполнения;
- использовать reflection.

Первый вариант часто создаёт дублирование, два следующих теряют часть безопасности компилятора. Generic-функция описывает переменную типа `T`, а constraint ограничивает допустимые подстановки:

```go
func Contains[T comparable](values []T, wanted T) bool {
	for _, value := range values {
		if value == wanted {
			return true
		}
	}

	return false
}
```

`T` здесь не значение, а параметр типа. При каждом вызове компилятор подставляет конкретный тип и проверяет, что он удовлетворяет `comparable`.

```go
fmt.Println(Contains([]string{"open", "completed"}, "open")) // true
fmt.Println(Contains([]TaskID{1, 2, 3}, TaskID(2)))             // true
```

## Синтаксис параметров типа

Список параметров типа находится после имени функции и до обычных параметров:

```go
func FunctionName[T Constraint](value T) T {
	return value
}
```

Параметров может быть несколько:

```go
func Keys[K comparable, V any](values map[K]V) []K {
	keys := make([]K, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	return keys
}
```

Вызов:

```go
statuses := map[TaskID]string{
	1: "open",
	2: "completed",
}

ids := Keys(statuses) // Компилятор выводит K = TaskID, V = string.
```

Имена `T`, `K`, `V`, `E` привычны для коротких универсальных helpers. Если параметр обозначает роль, а не просто место, лучше выбрать читаемое имя: `ID`, `Result`, `Payload`.

## Вывод параметров типа

В большинстве вызовов Go выводит тип из аргументов, поэтому квадратные скобки не нужны:

```go
numbers := []int{10, 20, 30}

found := Contains(numbers, 20) // T = int
```

Иногда компилятору не из чего сделать вывод или выбор важен для чтения. Тогда тип указывают явно:

```go
emptyIDs := []TaskID{}

// Тип элемента пустого литерала был бы неочевиден без []TaskID.
fmt.Println(Contains[TaskID](emptyIDs, 1))
```

Явная подстановка полезна редко. Не добавляйте `[string]` к каждому вызову, если вывод типа уже делает код короче и понятнее.

## `any`: разрешено любое значение

`any` — alias для `interface{}`. Он означает «любой тип»:

```go
func First[T any](values []T) (T, bool) {
	if len(values) == 0 {
		var zero T
		return zero, false
	}

	return values[0], true
}
```

`First` не сравнивает, не складывает и не вызывает методы `T`, поэтому достаточно `any`. Функция сохраняет конкретный тип:

```go
title, ok := First([]string{"Купить молоко"})
// title имеет тип string, а не any.

taskID, ok := First([]TaskID{42})
// taskID имеет тип TaskID.
```

Не путайте параметр типа `T any` с обычным параметром `any`:

```go
func printValue(value any) {
	fmt.Println(value)
}

func First[T any](values []T) (T, bool) {
	// Возвращает тот же конкретный T, что был в слайсе.
	// ...
}
```

В первом случае тип информации стирается внутри `any`; чтобы использовать конкретный тип, обычно нужен type assertion или type switch. Во втором тип известен компилятору для каждого конкретного вызова.

## `comparable`: можно сравнивать `==` и `!=`

Constraint `comparable` позволяет применять к `T` операторы `==` и `!=`, а также использовать `T` как ключ `map`:

```go
func IndexOf[T comparable](values []T, wanted T) int {
	for index, value := range values {
		if value == wanted {
			return index
		}
	}

	return -1
}

func Frequency[T comparable](values []T) map[T]int {
	counts := make(map[T]int)
	for _, value := range values {
		counts[value]++
	}
	return counts
}
```

Подходят числа, строки, `bool`, указатели, каналы, массивы сравнимых элементов и структуры, если все их поля сравнимы. Не подходят слайсы, map и функции:

```go
type TaskFilter struct {
	Statuses []TaskStatus // Слайс делает всю структуру несравнимой.
}

// Contains([][]string{{"open"}}, []string{"open"})
// Ошибка: []string не удовлетворяет comparable.
```

Ограничение не случайно: Go не определяет оператор `==` для слайсов и map. Если алгоритму нужно сравнивать такие значения, его контракт должен принять функцию сравнения:

```go
func ContainsFunc[T any](values []T, wanted T, equal func(T, T) bool) bool {
	for _, value := range values {
		if equal(value, wanted) {
			return true
		}
	}
	return false
}

filtersEqual := func(left, right TaskFilter) bool {
	return slices.Equal(left.Statuses, right.Statuses)
}
```

`ContainsFunc` не «хуже» generic-функции с `comparable`: он честно показывает, что именно означает равенство для сложного значения.

## Нулевое значение параметра типа

У любого конкретного `T` есть нулевое значение, но generic-код не всегда может записать его литералом. Используйте объявление переменной:

```go
func Zero[T any]() T {
	var zero T
	return zero
}
```

Для `int` это `0`, для `string` — `""`, для указателя — `nil`, для структуры — её нулевое значение. Нулевое значение не всегда означает «данных нет», поэтому API `First` выше возвращает второй результат `bool`.

Не используйте `nil` как универсальный нуль:

```go
// func Zero[T any]() T {
//     return nil // Неверно: T может быть int или struct.
// }
```

## In-place операции и слайсы

Generics не меняют правила значений и ссылочных типов. Например, функция может фильтровать слайс без новой аллокации, но должна ясно документировать, что меняет исходный массив:

```go
func FilterInPlace[T any](values []T, keep func(T) bool) []T {
	result := values[:0]
	for _, value := range values {
		if keep(value) {
			result = append(result, value)
		}
	}
	return result
}
```

Такая функция может быть полезной на горячем пути, но её контракт требует внимательности: возвращённый слайс разделяет backing array с исходным. Для большинства прикладного кода более очевидный вариант с новым слайсом лучше, даже если он универсален.

## Когда generic-функция оправдана

Хорошие признаки:

- алгоритм и инварианты одинаковы для разных типов;
- параметр типа участвует в сигнатуре и сохраняет типовую информацию;
- constraint точно описывает нужную операцию;
- вызов проще и безопаснее дублирующих функций или `any`/reflection.

Плохие признаки:

- у функции только один реальный тип использования;
- бизнес-правила начинают прятаться за `T`, `K`, `V`;
- читателю нужно долго восстанавливать конкретные типы из сложных ограничений;
- типовая параметризация создана «на будущее», но пока не устраняет реальное дублирование.

На следующей странице рассмотрим, как писать собственные constraints и почему `~int` — не то же самое, что `int`.

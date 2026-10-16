---
prev: /guide/advanced-types-generics/tests.md
next: /guide/advanced-types-generics/best-practices.md
---

# Задания: типы и generics

Эта практика не требует менять production-код учебного Task Manager API. Создайте отдельный небольшой Go-модуль или каталог внутри своего учебного проекта, чтобы экспериментировать с типами и запускать `go test ./...`. Цель — освоить компилируемые контракты, а не заменить все конкретные типы generic-версиями.

## Задание 1. Семантические идентификаторы

Объявите:

```go
type TaskID int64
type UserID int64
```

Напишите `TaskPath(id TaskID) string`, которая возвращает путь вида `/tasks/42`, и `ParseTaskID(value string) (TaskID, error)`, которая принимает только положительный ID.

**Критерии проверки:**

- используются defined types без `=`;
- `TaskPath` принимает только `TaskID`;
- внутри `TaskPath` есть явное преобразование к `int64` перед `strconv.FormatInt`;
- `ParseTaskID` оборачивает ошибку разбора через `%w`;
- `0` и отрицательные значения возвращают ошибку;
- успешный разбор возвращает `TaskID`, а не `int64`.

<details>
  <summary>Подсказка</summary>

```go
id, err := strconv.ParseInt(value, 10, 64)
if err != nil {
	return 0, fmt.Errorf("разобрать ID задачи: %w", err)
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package task

import (
	"errors"
	"fmt"
	"strconv"
)

type TaskID int64
type UserID int64

func TaskPath(id TaskID) string {
	return "/tasks/" + strconv.FormatInt(int64(id), 10)
}

func ParseTaskID(value string) (TaskID, error) {
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("разобрать ID задачи: %w", err)
	}
	if id < 1 {
		return 0, errors.New("ID задачи должен быть положительным")
	}

	return TaskID(id), nil
}
```

Этот код намеренно не позволит вызвать `TaskPath(UserID(42))`: это и есть защита смысла типов.
</details>

## Задание 2. Generic-функция поиска

Напишите:

```go
func Contains[T comparable](values []T, wanted T) bool
```

Проверьте её тестами для `[]string` и `[]TaskID`. Добавьте пример в комментарии, почему `[][]string` не скомпилируется с этим constraint.

**Критерии проверки:**

- параметр типа называется и ограничен `comparable`;
- поиск завершается сразу при первом совпадении;
- не применяется `any`, reflection или преобразование элементов в строку;
- тесты проверяют существующее и отсутствующее значение;
- вызов с `TaskID` не теряет defined type.

<details>
  <summary>Подсказка</summary>

```go
for _, value := range values {
	if value == wanted {
		return true
	}
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package collection

type TaskID int64

func Contains[T comparable](values []T, wanted T) bool {
	for _, value := range values {
		if value == wanted {
			return true
		}
	}
	return false
}
```

```go
func TestContains(t *testing.T) {
	if !Contains([]string{"open", "completed"}, "completed") {
		t.Fatal("Contains не нашёл строку")
	}
	if Contains([]TaskID{1, 2}, TaskID(3)) {
		t.Fatal("Contains нашёл отсутствующий TaskID")
	}
}

// Contains([][]string{{"open"}}, []string{"open"})
// не скомпилируется: []string не удовлетворяет comparable.
```
</details>

## Задание 3. Constraint с `~`

Создайте constraint `Integer`, который принимает встроенные `int`, `int64`, а также defined types с такими underlying types. Напишите:

```go
func Sum[T Integer](values []T) T
```

Проверьте, что функция работает для `[]int` и `[]RetryCount`, где `type RetryCount int`. Результат второго вызова должен иметь тип `RetryCount`.

**Критерии проверки:**

- constraint использует `~int | ~int64`;
- сумма начинается с нулевого значения `T`, а не с `int(0)`;
- не используется преобразование каждого элемента в `int64`;
- `RetryCount` проходит проверку компилятора без специального overload;
- комментарий объясняет, что constraint не проверяет положительность значений.

<details>
  <summary>Подсказка</summary>

```go
type Integer interface {
	~int | ~int64
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package metrics

type Integer interface {
	~int | ~int64
}

type RetryCount int

func Sum[T Integer](values []T) T {
	var total T
	for _, value := range values {
		total += value
	}
	return total
}
```

```go
func TestSum(t *testing.T) {
	if got := Sum([]int{1, 2, 3}); got != 6 {
		t.Fatalf("Sum(int) = %d, want 6", got)
	}

	got := Sum([]RetryCount{1, 2, 3})
	if got != RetryCount(6) {
		t.Fatalf("Sum(RetryCount) = %d, want 6", got)
	}
}
```

`Integer` ограничивает **типы**, а не значения: `Sum([]RetryCount{-1, 2})` разрешён. Проверка положительности — отдельное бизнес-правило.
</details>

## Задание 4. Generic `Set` с явным контрактом

Реализуйте `Set[T comparable]` на базе `map[T]struct{}` с методами `Add`, `Has`, `Delete`, `Len` и функцией-конструктором `NewSet`.

Документируйте один из вариантов поведения нулевого значения:

- либо `Set` нужно создавать только через `NewSet`;
- либо реализуйте `SafeSet[T]` со структурой и ленивой инициализацией в `Add`.

Добавьте тест на дедупликацию двух одинаковых `TaskID`.

**Критерии проверки:**

- `T` ограничен `comparable`;
- повторный `Add` не увеличивает размер;
- `Has` возвращает `false` для отсутствующего значения;
- `Delete` не вызывает panic для отсутствующего значения;
- выбранное правило нулевого значения записано в doc comment или README;
- тест не рассчитывает на порядок обхода map.

<details>
  <summary>Подсказка</summary>

```go
type Set[T comparable] map[T]struct{}

func (set Set[T]) Add(value T) {
	set[value] = struct{}{}
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package collection

type TaskID int64

// Set хранит уникальные значения. Создавайте Set через NewSet:
// нулевое значение Set нельзя изменять, потому что его map равна nil.
type Set[T comparable] map[T]struct{}

func NewSet[T comparable](values ...T) Set[T] {
	set := make(Set[T], len(values))
	for _, value := range values {
		set.Add(value)
	}
	return set
}

func (set Set[T]) Add(value T) {
	set[value] = struct{}{}
}

func (set Set[T]) Has(value T) bool {
	_, exists := set[value]
	return exists
}

func (set Set[T]) Delete(value T) {
	delete(set, value)
}

func (set Set[T]) Len() int {
	return len(set)
}
```

```go
func TestSetDeduplicatesTaskIDs(t *testing.T) {
	set := NewSet(TaskID(1), TaskID(1), TaskID(2))

	if got := set.Len(); got != 2 {
		t.Fatalf("Len() = %d, want 2", got)
	}
	if !set.Has(TaskID(2)) {
		t.Fatal("Set не содержит TaskID(2)")
	}

	set.Delete(TaskID(2))
	if set.Has(TaskID(2)) {
		t.Fatal("Delete не удалил TaskID(2)")
	}
}
```
</details>

## Задание 5. Откажитесь от лишнего generic API

В Task Manager API нужно сформировать для HTTP-ответа список заголовков задач, отсортированный сначала по приоритету, затем по ID. Коллега предлагает API:

```go
type Entity[ID comparable] interface {
	ID() ID
}

func SortedTitles[T Entity[ID], ID comparable](values []T) []string
```

Напишите вместо него конкретную функцию:

```go
func SortedTaskTitles(tasks []Task) []string
```

Она не должна менять исходный слайс. Добавьте короткое объяснение в комментарии или README, почему конкретное решение предпочтительнее.

**Критерии проверки:**

- функция копирует слайс перед сортировкой;
- сортировка имеет ясное правило: приоритет по убыванию, затем ID по возрастанию;
- извлечение title происходит после сортировки;
- нет generic-интерфейса и искусственного метода `ID()` только ради абстракции;
- объяснение упоминает бизнес-правило сортировки задач.

<details>
  <summary>Подсказка</summary>

```go
ordered := append([]Task(nil), tasks...)
slices.SortFunc(ordered, func(left, right Task) int {
	// Верните отрицательное число, если left должен идти раньше right.
})
```
</details>

<details>
  <summary>Решение</summary>

```go
package task

import "slices"

type TaskID int64

type Task struct {
	ID       TaskID
	Title    string
	Priority int
}

// SortedTaskTitles выражает бизнес-правило Task Manager: сначала высокий
// приоритет, затем меньший ID. Generic Entity скрывал бы этот смысл.
func SortedTaskTitles(tasks []Task) []string {
	ordered := append([]Task(nil), tasks...)
	slices.SortFunc(ordered, func(left, right Task) int {
		if left.Priority != right.Priority {
			return right.Priority - left.Priority
		}
		if left.ID < right.ID {
			return -1
		}
		if left.ID > right.ID {
			return 1
		}
		return 0
	})

	titles := make([]string, 0, len(ordered))
	for _, task := range ordered {
		titles = append(titles, task.Title)
	}
	return titles
}
```

В production-коде не вычитайте два `int`, если значения могут быть достаточно большими для переполнения. Здесь приоритет имеет небольшой ограниченный диапазон; для более общего числового поля сравните значения через `<` и `>` так же, как ID.
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- выбрать defined type для доменного значения и alias для миграции совместимости;
- объяснить отличие `T any` от обычного `any`;
- применить `comparable` только при необходимости `==`, `!=` или ключа map;
- написать constraint с `~`, который сохраняет defined type результата;
- спроектировать нулевое значение generic-типа и задокументировать его;
- оставить конкретную функцию конкретной, когда она выражает бизнес-операцию Task Manager API.

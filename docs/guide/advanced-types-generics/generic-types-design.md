---
prev: /guide/advanced-types-generics/constraints-type-sets.md
next: /guide/advanced-types-generics/tests.md
---

# Generic-типы и выбор абстракции

Generic-функции обобщают операцию. Generic-типы обобщают структуру данных или контейнер, который хранит значения неизвестного заранее типа. Тип объявляет параметры в квадратных скобках после имени:

```go
type Name[T Constraint] struct {
	Value T
}
```

## Пример: множество `Set`

`map[T]struct{}` — обычный идиоматичный способ хранить множество сравнимых значений. Generic-тип даёт ему имя и небольшой API:

```go
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

Использование сохраняет тип:

```go
allowedStatuses := NewSet(TaskStatusOpen, TaskStatusCompleted)
fmt.Println(allowedStatuses.Has(TaskStatusOpen)) // true

taskIDs := NewSet(TaskID(1), TaskID(2))
taskIDs.Add(3) // Нет необходимости преобразовывать в int64.
```

`T comparable` нужен, потому что `T` становится ключом `map`. Ограничение у generic-типа проверяется при создании конкретного `Set[T]`:

```go
// var filters Set[[]TaskStatus] // Ошибка: []TaskStatus не comparable.
```

## Нулевое значение `Set`

Нулевое значение map можно читать, удалять из него и проверять ключи, но нельзя добавлять элементы:

```go
var taskIDs Set[TaskID]

fmt.Println(taskIDs.Has(1)) // false
// taskIDs.Add(1) // Panic: assignment to entry in nil map.
```

Это часть контракта map, а не особенность generics. Есть два ясных варианта дизайна:

1. требовать создание через `NewSet`;
2. сделать тип структурой с внутренней map и инициализировать её в методе `Add`.

Второй вариант даёт удобное нулевое значение, но требует pointer receiver:

```go
type SafeSet[T comparable] struct {
	values map[T]struct{}
}

func (set *SafeSet[T]) Add(value T) {
	if set.values == nil {
		set.values = make(map[T]struct{})
	}
	set.values[value] = struct{}{}
}

func (set SafeSet[T]) Has(value T) bool {
	_, exists := set.values[value]
	return exists
}
```

Нет универсально правильного выбора. `Set[T] map[T]struct{}` проще и прозрачно показывает свойства map; `SafeSet[T]` полезен, если API специально обещает работоспособное нулевое значение. Не скрывайте это решение от пользователей типа.

## Порядок и преобразование в слайс

Map не гарантирует порядок обхода. Поэтому метод `Values()` не должен обещать стабильную последовательность:

```go
func (set Set[T]) Values() []T {
	values := make([]T, 0, len(set))
	for value := range set {
		values = append(values, value)
	}
	return values
}
```

Если HTTP API отдаёт значения набора, определите порядок отдельно. Для string-подобных статусов можно отсортировать копию; для `Task` лучше использовать конкретное бизнес-правило сортировки. Не делайте вывод «generic Set сам умеет сортироваться»: `comparable` не означает ordered, а универсальный порядок для любого `T` отсутствует.

## Пример: явное наличие значения

Иногда нужно вернуть результат, который может отсутствовать, но нулевое значение `T` допустимо. Например, `TaskID(0)` может быть нулём типа, а пустой title — пустой строкой. Generic-тип `Optional` делает отсутствие явным:

```go
type Optional[T any] struct {
	value T
	ok    bool
}

func Some[T any](value T) Optional[T] {
	return Optional[T]{value: value, ok: true}
}

func None[T any]() Optional[T] {
	return Optional[T]{}
}

func (optional Optional[T]) Get() (T, bool) {
	return optional.value, optional.ok
}
```

Пример использования:

```go
func findCachedTitle(cache map[TaskID]string, id TaskID) Optional[string] {
	title, exists := cache[id]
	if !exists {
		return None[string]()
	}
	return Some(title)
}
```

Однако в обычном Go-коде `(T, bool)` часто проще и привычнее:

```go
func findCachedTitle(cache map[TaskID]string, id TaskID) (string, bool) {
	title, exists := cache[id]
	return title, exists
}
```

`Optional[T]` оправдан, только если он действительно добавляет полезные операции, должен храниться как поле или делает сложный контракт яснее. Не добавляйте его лишь потому, что аналог есть в другом языке.

## Generic-тип и интерфейс — разные оси

Generics отвечают на вопрос: «какой тип значения хранит структура или принимает алгоритм?» Интерфейс отвечает: «какое поведение требуется?» Их можно комбинировать, но одно не заменяет другое.

```go
type Repository[T any, ID comparable] interface {
	Get(ctx context.Context, id ID) (T, error)
	Save(ctx context.Context, value T) error
}
```

Такой интерфейс технически возможен. Но для Task Manager он может быть избыточным: `TaskRepository` с методами, названными в терминах задач, легче читать и он не обещает ложную универсальность для всех будущих сущностей.

```go
type TaskRepository interface {
	Get(ctx context.Context, id TaskID) (Task, error)
	Create(ctx context.Context, input CreateInput) (Task, error)
	Complete(ctx context.Context, id TaskID) (Task, error)
}
```

Второй интерфейс выражает реальные операции домена. Generic CRUD-репозиторий часто скрывает важные различия: поиск, авторизацию, транзакции, частичное обновление, уникальные ограничения и пагинацию.

## Где generics уместны в Task Manager API

В приложении можно рассмотреть generics для технических, повторяющихся частей:

- `Set[TaskID]` для дедупликации ID;
- маленькие helpers `Contains`, `Clone`, `Filter` в общем internal-пакете — только после появления нескольких реальных использований;
- тестовые helpers, которые делают одинаковые проверки для разных типов;
- технические контейнеры вроде `Optional[T]`, если они действительно упрощают несколько контрактов.

Обычно не стоит обобщать:

- `Task`, `CreateInput`, `TaskService`, обработчики Gin и HTTP-ответы;
- доменные правила приоритета, выполнения и валидации;
- SQL-репозиторий только ради единого CRUD-интерфейса;
- ошибки, когда код и поля ошибки относятся к конкретной предметной области.

Правило: сначала сделайте ясный конкретный API. Обобщайте после второго или третьего похожего случая, когда можете назвать общую операцию без потери предметного смысла.

## Не путайте `[]T`, `[]any` и `any`

Слайс конкретного типа нельзя присвоить `[]any`, даже если каждый элемент можно сохранить в `any`:

```go
taskIDs := []TaskID{1, 2}

// var values []any = taskIDs // Ошибка: []TaskID и []any имеют разное представление.
```

Generic-функция принимает `[]T` без такой потери:

```go
func PrintAll[T any](values []T) {
	for _, value := range values {
		fmt.Println(value)
	}
}

PrintAll(taskIDs)
```

Не создавайте `[]any`, чтобы «сделать всё generic». Он уместен на действительно динамической границе: лог с произвольными атрибутами, декодированный JSON, плагинная система. В остальном предпочтительнее конкретный тип или параметр `T`.

## Стоимость и читаемость

Generics не работают как шаблоны C++ в пользовательской модели и не требуют runtime-reflection для каждого вызова. Но это не повод использовать их ради предполагаемой производительности. Сначала измеряйте `go test -bench` и profile. Главная цена неудачной generic-абстракции обычно не CPU, а сложность API, сообщений компилятора и поддержки.

Перед добавлением type parameter спросите:

1. Есть ли минимум два реальных типа с одинаковым алгоритмом?
2. Достаточно ли простого constraint, который соответствует операциям в теле?
3. Сохранит ли вызов предметный смысл для следующего читателя?
4. Не будет ли явная функция или callback проще?
5. Нужен ли новый тип вообще, или достаточно `(T, bool)`, `[]T`, map либо маленького интерфейса?

Если на несколько вопросов ответ «нет», конкретная реализация обычно лучше. Далее — самопроверка и практика, где все решения будут проверяться через обычный компилятор Go.

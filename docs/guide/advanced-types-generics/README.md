---
prev: /guide/advanced-errors-resources/best-practices.md
next: /guide/advanced-types-generics/type-parameters.md
---

# Продвинутый Go B: типы и generics

## Цель главы

Научиться отличать defined type от type alias, писать и читать generic-функции и generic-типы, проектировать ограничения типов (`constraints`) и выбирать generics только там, где они действительно уменьшают дублирование без потери ясности.

Generics появились в Go 1.18. Они не заменяют интерфейсы, не делают любой код «универсальнее» автоматически и не обязательны для хорошего backend-сервиса. В Task Manager API большинство business-типов остаются обычными: `Task`, `CreateInput`, `TaskRepository`, `ValidationError`. Обобщение полезно, когда алгоритм одинаков для нескольких **семейств типов**, а различие между типами важно сохранить во время компиляции.

## Карта главы

1. **Эта страница** — defined types, type alias, underlying type и методы.
2. [`Параметры типов и generic-функции`](type-parameters.md) — `[T any]`, вывод типа, `any` и `comparable`.
3. [`Constraints`, type sets и `~`](constraints-type-sets.md) — интерфейсы как ограничения, объединения типов и базовый тип.
4. [Generic-типы и выбор абстракции](generic-types-design.md) — `Set`, `Optional`, границы применимости и интеграция с Task Manager API.

## Сначала: три похожих объявления

Пусть в приложении есть числовой идентификатор задачи:

```go
type TaskID int64
```

Это **defined type** (определённый, или именованный, тип). Он имеет тот же underlying type — `int64`, но является отдельным типом для проверки компилятором.

Сравните с alias:

```go
type LegacyTaskID = int64
```

Это **type alias**: новое имя для уже существующего типа. `LegacyTaskID` и `int64` — один и тот же тип, без нового слоя типобезопасности.

| Объявление | Что создаёт | Совместимость с `int64` без преобразования | Можно объявлять методы |
| --- | --- | --- | --- |
| `type TaskID int64` | новый defined type | нет | да |
| `type LegacyTaskID = int64` | alias существующего типа | да | нет |

## Defined type: защита смысла значений

Обычные числа с одинаковым представлением легко перепутать:

```go
func loadTask(taskID int64) {}
func loadUser(userID int64) {}

loadTask(42)
loadUser(42) // Компилятор не знает, что это другое значение предметной области.
```

Defined types помогают выразить намерение в сигнатурах:

```go
type TaskID int64
type UserID int64

func loadTask(taskID TaskID) {}
func loadUser(userID UserID) {}

var taskID TaskID = 42
var userID UserID = 42

loadTask(taskID)
loadUser(userID)

// loadTask(userID) // Ошибка компиляции: UserID не TaskID.
```

Такой тип не подтверждает, что ID существует в БД, и не заменяет валидацию. Он предотвращает отдельный класс ошибок: случайную передачу идентификатора одной сущности туда, где ожидается другая.

При границе со стандартной библиотекой, JSON или драйвером БД иногда понадобится явное преобразование:

```go
func taskPath(id TaskID) string {
	return strconv.FormatInt(int64(id), 10)
}

func taskIDFromPath(value string) (TaskID, error) {
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

Явное `TaskID(id)` делает преобразование заметным в code review. Но преобразование не выполняет проверку диапазона: `TaskID(-1)` скомпилируется. Сначала валидируйте внешние данные, затем создавайте доменный тип.

## Underlying type и операции

У defined type есть underlying type. Для `type TaskID int64` это `int64`; для более сложного типа — базовый тип в его объявлении. Благодаря этому над числовым defined type разрешены подходящие операции:

```go
type Priority int

const (
	PriorityLow    Priority = 1
	PriorityNormal Priority = 2
	PriorityHigh   Priority = 3
)

func nextPriority(priority Priority) Priority {
	return priority + 1
}
```

Но это не означает неограниченную совместимость с `int`. Например, присваивание требует преобразования:

```go
var priority Priority = PriorityHigh

// var level int = priority // Ошибка: разные defined types.
var level int = int(priority)
```

Для строковых статусов полезна та же идея:

```go
type TaskStatus string

const (
	TaskStatusOpen      TaskStatus = "open"
	TaskStatusCompleted TaskStatus = "completed"
)
```

Константы с типом защищают присваивание в Go-коде. Но JSON всё равно может принести произвольную строку, поэтому HTTP input должен проходить валидацию, а не только преобразование `TaskStatus(request.Status)`.

## Методы принадлежат defined type

Defined type можно дополнить методами. Это удобно, когда поведение относится к доменному значению:

```go
type Priority int

func (priority Priority) Valid() bool {
	return priority >= PriorityLow && priority <= PriorityHigh
}

func (priority Priority) String() string {
	switch priority {
	case PriorityLow:
		return "low"
	case PriorityNormal:
		return "normal"
	case PriorityHigh:
		return "high"
	default:
		return "unknown"
	}
}
```

Метод нельзя объявить для alias не-локального типа:

```go
type LegacyTaskID = int64

// func (id LegacyTaskID) String() string { ... }
// Ошибка: нельзя определять новые методы для non-local type int64.
```

Кроме того, метод должен объявляться в том же пакете, что и defined type. Нельзя добавить метод к `time.Time`, `http.Client` или defined type из другого пакета. Используйте обёртку, helper-функцию или композицию, а не пытайтесь расширить чужой тип.

## Когда нужен type alias

Alias нужен главным образом для совместимости и постепенной миграции API, а не для моделирования предметной области.

Например, пакет раньше экспортировал `OldTask`, а теперь хочет назвать тип `Task`, не ломая всех потребителей сразу:

```go
type Task struct {
	ID    int64
	Title string
}

// Deprecated: используйте Task.
type OldTask = Task
```

Код с `OldTask` и `Task` работает с одним типом. Методы `Task` доступны через alias, потому что alias не создаёт новый тип.

Другой распространённый случай — переэкспорт типа внешнего пакета в совместимом API. Но alias расширяет поверхность зависимости: пользователи начинают зависеть от точного типа. Применяйте его осознанно и документируйте deprecated-имена.

::: warning Alias не делает преобразование безопаснее
`type TaskID = int64` выглядит как доменное имя, но компилятор разрешит передать `UserID`, `int64` или любой другой совместимый `int64` туда, где ожидается `TaskID`. Если цель — исключить путаницу сущностей, нужен defined type без `=`.
:::

## Defined type, alias и интерфейсы

Интерфейс зависит от метода и его точной сигнатуры. Два defined type с одинаковым underlying type остаются разными для сигнатур:

```go
type TaskID int64
type UserID int64

type TaskLoader interface {
	Load(TaskID) error
}

type UserStore struct{}

func (UserStore) Load(UserID) error {
	return nil
}

// var _ TaskLoader = UserStore{} // Ошибка: Load(UserID) не Load(TaskID).
```

Это полезная строгость: интерфейс проверяет не только имя метода, но и смысл его параметров, выраженный типами.

## Не создавайте типы ради каждого поля

Defined type — инструмент, а не обязательный ритуал. Хорошие кандидаты:

- идентификаторы разных доменных сущностей (`TaskID`, `UserID`);
- ограниченный набор значений (`TaskStatus`, `Priority`);
- единицы, которые опасно смешивать (`Bytes`, `RetryCount`), если это улучшает код;
- значения с собственными методами валидации, форматирования или разбора.

Плохие кандидаты — типы, которые не меняют читаемость, не защищают от реальной путаницы и требуют постоянных бессмысленных преобразований. Например, `type TaskTitle string` может быть полезен, если у него есть единый конструктор и правила длины; иначе это может стать только шумом.

Следующая страница перейдёт от конкретных domain types к параметрам типов: как написать алгоритм один раз для нескольких типов, не теряя проверки компилятора.

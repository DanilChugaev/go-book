---
prev: /guide/json/practice.md
next: /guide/time/tests.md
---

# Время и дедлайны

## Цель урока

Научиться работать с датами, длительностями и UTC через пакет `time`, а также добавить задаче дедлайн и проверку срока выполнения.

Пакет `time` нужен не только для отображения дат. Он задаёт таймауты в concurrent-коде, помогает ограничивать дедлайны операций и позволяет хранить срок выполнения задачи.

## Время: `time.Time`

`time.Time` представляет конкретный момент времени:

```go
now := time.Now()
fmt.Println(now)
```

Для задачи добавим необязательное поле дедлайна:

```go
type Task struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Priority  int       `json:"priority"`
	Completed bool      `json:"completed"`
	DueAt     time.Time `json:"due_at"`
}
```

Для этой модели пакет `internal/task` должен импортировать `time`:

```go
import "time"
```

Нулевое значение `time.Time` означает отсутствие установленной даты:

```go
var dueAt time.Time
fmt.Println(dueAt.IsZero()) // true
```

## Длительности: `time.Duration`

`time.Duration` хранит интервал времени:

```go
duration := 2*time.Hour + 30*time.Minute
fmt.Println(duration) // 2h30m0s
```

Частые единицы:

```go
time.Nanosecond
time.Microsecond
time.Millisecond
time.Second
time.Minute
time.Hour
```

Добавить длительность к моменту времени можно через `Add`:

```go
tomorrow := time.Now().Add(24 * time.Hour)
```

Разница двух моментов — тоже `Duration`:

```go
remaining := dueAt.Sub(time.Now())
```

Для проверки срока используйте `After`:

```go
if time.Now().After(dueAt) {
	fmt.Println("Срок задачи истёк")
}
```

## Форматирование времени

В Go нет шаблонов вроде `YYYY-MM-DD`. Формат задаёт эталонная дата:

```go
const layout = "2006-01-02 15:04"

fmt.Println(time.Now().Format(layout))
```

Эталон — именно:

```text
Mon Jan 2 15:04:05 MST 2006
```

| Layout | Пример результата |
| --- | --- |
| `"2006-01-02"` | `2026-10-12` |
| `"2006-01-02 15:04"` | `2026-10-12 14:30` |
| `time.RFC3339` | `2026-10-12T14:30:00Z` |

Для обмена данными и логов используйте `time.RFC3339`. Для интерфейса выбирайте понятный пользователю layout.

## Разбор даты: `time.Parse`

`time.Parse` создаёт `time.Time` из строки и layout:

```go
const layout = "2006-01-02 15:04"

dueAt, err := time.Parse(layout, "2026-12-31 18:00")
if err != nil {
	return fmt.Errorf("некорректный дедлайн: %w", err)
}
```

Без отдельного location `time.Parse` интерпретирует время в UTC. Если пользователь вводит время конкретного региона, используйте `time.ParseInLocation` с явно выбранной локацией. В первой версии backend-API проще хранить и передавать даты в UTC.

## UTC

UTC — единый мировой стандарт времени. В API и JSON обычно передают момент времени в UTC:

```go
now := time.Now().UTC()
fmt.Println(now.Format(time.RFC3339))
```

Преобразование к UTC не меняет сам момент времени, а только его представление и часовую зону.

`time.Time` автоматически сериализуется в JSON как строка RFC3339. Поле `DueAt` будет сохраняться вместе с задачей без специального кода.

## Дедлайн Task

Добавим методы модели:

```go
func (task Task) IsOverdue(now time.Time) bool {
	return !task.DueAt.IsZero() && now.After(task.DueAt)
}

func (task Task) Remaining(now time.Time) time.Duration {
	if task.DueAt.IsZero() {
		return 0
	}

	return task.DueAt.Sub(now)
}
```

Внешний код передаёт `now` параметром. Это делает методы предсказуемыми и удобными для тестирования.

```go
now := time.Now().UTC()

if currentTask.IsOverdue(now) {
	fmt.Println("Срок задачи истёк")
} else if !currentTask.DueAt.IsZero() {
	fmt.Println("Осталось:", currentTask.Remaining(now).Round(time.Minute))
}
```

## Тестирование дедлайнов с фиксированным временем

Не вызывайте `time.Now()` прямо в unit-тесте проверки дедлайна. Реальное время постоянно меняется, поэтому такой тест может стать нестабильным. Создайте фиксированное значение `now` и передайте его в методы:

```go
now := time.Date(2026, time.January, 1, 12, 0, 0, 0, time.UTC)
```

Табличный тест может проверить основные сценарии:

```go
func TestTaskIsOverdue(t *testing.T) {
	now := time.Date(2026, time.January, 1, 12, 0, 0, 0, time.UTC)

	testCases := []struct {
		name    string
		dueAt   time.Time
		want    bool
	}{
		{
			name: "дедлайн не установлен",
		},
		{
			name:  "дедлайн в прошлом",
			dueAt:  now.Add(-time.Minute),
			want:   true,
		},
		{
			name:  "дедлайн равен текущему времени",
			dueAt:  now,
			want:   false,
		},
		{
			name:  "дедлайн в будущем",
			dueAt:  now.Add(time.Hour),
			want:   false,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			currentTask := Task{DueAt: testCase.dueAt}

			if got := currentTask.IsOverdue(now); got != testCase.want {
				t.Errorf("IsOverdue() = %t, ожидалось %t", got, testCase.want)
			}
		})
	}
}
```

В текущем контракте дедлайн считается просроченным, только если `now` **строго позже** `DueAt`. Поэтому при точном равенстве `IsOverdue` возвращает `false`. Это правило должно быть явно зафиксировано тестом, чтобы его случайно не изменить при рефакторинге.

Проверьте `Remaining` отдельными сценариями:

- дедлайн не установлен → `0`;
- дедлайн через час → `time.Hour`;
- дедлайн в прошлом → отрицательная длительность, например `-time.Minute`.

Отрицательное значение `Remaining` само по себе не ошибка: его можно использовать для отображения просрочки. Если вызывающему коду нужна только оставшаяся положительная длительность, он должен отдельно проверить `IsOverdue`.

## JSON round-trip для `DueAt`

`time.Time` автоматически кодируется в JSON строкой RFC3339. При сохранении и загрузке задачи момент времени должен остаться тем же:

```go
func TestTaskDueAtJSONRoundTrip(t *testing.T) {
	wantDueAt := time.Date(2026, time.December, 31, 18, 0, 0, 0, time.UTC)
	wantTask := Task{
		ID:       1,
		Title:    "Купить молоко",
		Priority: 2,
		DueAt:    wantDueAt,
	}

	data, err := json.Marshal(wantTask)
	if err != nil {
		t.Fatalf("Marshal вернул ошибку: %v", err)
	}

	var gotTask Task
	if err := json.Unmarshal(data, &gotTask); err != nil {
		t.Fatalf("Unmarshal вернул ошибку: %v", err)
	}

	if !gotTask.DueAt.Equal(wantDueAt) {
		t.Errorf("DueAt = %s, ожидалось %s", gotTask.DueAt, wantDueAt)
	}
}
```

Для сравнения времени используйте `Equal`, а не `==`: JSON round-trip меняет внутреннее представление `time.Time`, но не сам момент времени.

## Частые ошибки

### Неверный layout даты

```go
// time.Now().Format("YYYY-MM-DD") // это не формат Go
time.Now().Format("2006-01-02")
```

### Сравнение времени через `==`

Для логики дат используйте методы:

```go
first.Before(second)
first.After(second)
first.Equal(second)
```

### `24 * time.Hour` как «завтра в то же локальное время»

Для UTC-дедлайнов это обычно нормально. При переходах летнего времени для календарных вычислений используйте `time.AddDate` и явную `Location`.

### Тест с `time.Now()`

```go
if task.IsOverdue(time.Now()) {
	// Такой тест зависит от момента запуска.
}
```

В unit-тесте создавайте фиксированный `now` через `time.Date` и передавайте его в метод.

## Дальше

Закрепите дедлайн задач. Затем перейдём к goroutine: `time.Duration` и `time.Second` понадобятся для ожидания и таймаутов.

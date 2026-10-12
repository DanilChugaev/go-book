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

## Дальше

Закрепите дедлайн задач. Затем перейдём к goroutine: `time.Duration` и `time.Second` понадобятся для ожидания и таймаутов.

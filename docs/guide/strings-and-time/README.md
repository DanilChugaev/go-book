---
prev: /guide/context/practice.md
next: /guide/strings-and-time/tests.md
---

# Стандартная библиотека: `strings` и `time`

## Цель урока

Научиться очищать и проверять текст через пакет `strings`, работать с датами и длительностями через `time`, а также добавить задаче нормализованное название и дедлайн.

Стандартная библиотека Go содержит много готовых пакетов. В этой главе разберём два особенно полезных для backend-разработки:

- `strings` — обработка текста;
- `time` — даты, время, дедлайны и длительности.

## Очистка текста: `strings.TrimSpace`

Пользователь может ввести лишние пробелы в начале или конце названия:

```go
title := "  Купить молоко  "
cleanTitle := strings.TrimSpace(title)

fmt.Printf("%q\n", cleanTitle) // "Купить молоко"
```

`TrimSpace` удаляет пробельные символы с краёв строки: пробелы, табуляции и переводы строк. Внутренние пробелы он не меняет:

```go
title := "Купить   молоко"
fmt.Println(strings.TrimSpace(title)) // Купить   молоко
```

Обычно пользовательский текст нормализуют до валидации. Тогда строка из одних пробелов превратится в пустую строку и не пройдёт проверку.

## Поиск и изменение регистра

`strings.ToLower` и `strings.ToUpper` меняют регистр:

```go
title := "Купить МОЛОКО"

fmt.Println(strings.ToLower(title)) // купить молоко
fmt.Println(strings.ToUpper(title)) // КУПИТЬ МОЛОКО
```

`strings.Contains` проверяет подстроку:

```go
title := "Купить молоко"
hasMilk := strings.Contains(strings.ToLower(title), "молоко")

fmt.Println(hasMilk) // true
```

Для поиска без учёта регистра приведите обе строки к одному регистру. `Contains` не меняет исходную строку.

Полезные функции пакета:

| Функция | Назначение |
| --- | --- |
| `strings.TrimSpace(s)` | Удаляет пробелы по краям |
| `strings.ToLower(s)` | Переводит в нижний регистр |
| `strings.ToUpper(s)` | Переводит в верхний регистр |
| `strings.Contains(s, sub)` | Проверяет наличие подстроки |
| `strings.HasPrefix(s, prefix)` | Проверяет начало строки |
| `strings.HasSuffix(s, suffix)` | Проверяет конец строки |

## `Split` и `Join`

`strings.Split` делит строку по разделителю:

```go
rawTags := "дом, покупки, срочно"
tags := strings.Split(rawTags, ",")

fmt.Println(tags) // [дом  покупки  срочно]
```

Пробелы после запятых остаются внутри элементов. Их нужно очищать отдельно:

```go
for index, tag := range tags {
	tags[index] = strings.TrimSpace(tag)
}

fmt.Println(tags) // [дом покупки срочно]
```

`strings.Join` собирает слайс строк обратно:

```go
tags := []string{"дом", "покупки", "срочно"}
formattedTags := strings.Join(tags, ", ")

fmt.Println(formattedTags) // дом, покупки, срочно
```

`Split` и `Join` полезны для простых списков, но не являются полноценным форматом хранения данных: если значения могут содержать разделитель, понадобится более строгий формат, например JSON.

## `strings.Builder`

Строки в Go неизменяемы. При многократном сложении в цикле создаются новые строки:

```go
var content string

for _, title := range titles {
	content += title + "\n"
}
```

Для формирования большого текста используйте `strings.Builder`:

```go
var builder strings.Builder

for _, title := range titles {
	builder.WriteString(title)
	builder.WriteString("\n")
}

content := builder.String()
```

Для маленьких учебных примеров `+` допустим. Builder делает намерение явным и уменьшает лишние выделения памяти, когда текста много.

## Время: `time.Time`

`time.Time` представляет конкретный момент времени:

```go
now := time.Now()
fmt.Println(now)
```

Для задачи добавим необязательное поле дедлайна. На этом этапе используем `time.Time`:

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

Для задачи без дедлайна это допустимо. В следующих главах можно обсудить альтернативы, например `*time.Time`, если API должно отличать «дедлайн отсутствует» от нулевой даты явно.

## Длительности: `time.Duration`

`time.Duration` хранит интервал времени. Пакет предоставляет константы:

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
now := time.Now()
tomorrow := now.Add(24 * time.Hour)
```

Разница двух моментов — тоже `Duration`:

```go
remaining := dueAt.Sub(time.Now())
fmt.Println(remaining)
```

Проверка дедлайна:

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

Несколько полезных layout:

| Layout | Пример результата |
| --- | --- |
| `"2006-01-02"` | `2026-10-12` |
| `"2006-01-02 15:04"` | `2026-10-12 14:30` |
| `time.RFC3339` | `2026-10-12T14:30:00Z` |

Для логов и обмена данными используйте `time.RFC3339`. Для отображения пользователю выберите читаемый layout отдельно.

## Разбор даты: `time.Parse`

`time.Parse` создаёт `time.Time` из строки и layout:

```go
const layout = "2006-01-02 15:04"

dueAt, err := time.Parse(layout, "2026-12-31 18:00")
if err != nil {
	return fmt.Errorf("некорректный дедлайн: %w", err)
}
```

`time.Parse` без отдельного location интерпретирует время в UTC. Если пользователь вводит время конкретного региона, используйте `time.ParseInLocation` с явно выбранной локацией. В первых версиях backend-API проще и надёжнее хранить и передавать даты в UTC.

## UTC

UTC — единый мировой стандарт времени. В API и JSON обычно передают момент времени в UTC:

```go
now := time.Now().UTC()
fmt.Println(now.Format(time.RFC3339))
```

Преобразование к UTC не меняет сам момент времени, а только его представление и часовую зону.

```go
dueAtUTC := dueAt.UTC()
```

`time.Time` автоматически сериализуется в JSON как строка RFC3339. Поэтому поле `DueAt time.Time` с JSON-тегом можно сохранять вместе с задачей без собственной сериализации.

## Нормализация названия и дедлайн Task

Вынесем нормализацию текста в пакет `internal/task`:

```go
func normalizeTitle(title string) string {
	return strings.TrimSpace(title)
}

func (task *Task) Rename(title string) error {
	if task == nil {
		return ErrTaskIsNil
	}

	title = normalizeTitle(title)

	if len(title) == 0 {
		return ErrEmptyTitle
	}
	if len(title) > 120 {
		return ErrTitleTooLong
	}

	task.Title = title
	return nil
}
```

Добавим методы для дедлайна:

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

Внешний код передаёт `now` параметром. Это делает методы предсказуемыми и удобными для тестов: не нужно зависеть от настоящего текущего времени.

```go
now := time.Now().UTC()

if currentTask.IsOverdue(now) {
	fmt.Println("Срок задачи истёк")
} else if !currentTask.DueAt.IsZero() {
	fmt.Println("Осталось:", currentTask.Remaining(now).Round(time.Minute))
}
```

## Частые ошибки

### Валидация до TrimSpace

```go
if len(title) == 0 {
	return ErrEmptyTitle
}

title = strings.TrimSpace(title)
```

Строка из пробелов пройдёт первую проверку. Сначала нормализуйте текст, затем валидируйте.

### Неверный layout даты

```go
// time.Now().Format("YYYY-MM-DD") // это не формат Go
time.Now().Format("2006-01-02")
```

В Go layout строится по эталонной дате, а не по обозначениям `YYYY` и `DD`.

### Сравнение времени через `==`

Для «раньше», «позже» и «равно ли тот же момент» используйте методы:

```go
first.Before(second)
first.After(second)
first.Equal(second)
```

Оператор `==` учитывает внутренние детали представления `time.Time` и обычно не нужен для логики дат.

### `24 * time.Hour` как «завтра в то же локальное время»

Для простых UTC-дедлайнов это нормально. Но переходы летнего времени в локальных зонах делают календарные вычисления сложнее. Когда появится работа с пользовательскими часовыми поясами, используйте `time.AddDate` и явно выбранную `Location`.

## Дальше

Закрепите нормализацию названий и дедлайн задач. Следующая глава — HTTP-клиент и сервер: Task Manager API начнёт принимать и возвращать JSON по сети.

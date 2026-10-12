---
prev: /guide/strings-and-time/tests.md
---

# Практика: нормализация названия и дедлайн

Task Manager API получает более реалистичные данные: пользователь может добавить лишние пробелы в название, а задача может иметь срок выполнения. Нормализуем ввод и добавим `DueAt`.

## Задание 1. Нормализуйте название

В пакете `internal/task` добавьте неэкспортируемую функцию `normalizeTitle(title string) string`, которая удаляет пробелы по краям. Измените `Rename`, чтобы она сначала нормализовала название, а потом проверяла пустую строку.

**Критерии проверки:**

- используется `strings.TrimSpace`;
- `normalizeTitle` начинается со строчной буквы;
- `Rename("  Купить продукты  ")` сохраняет `Купить продукты`;
- `Rename("   ")` возвращает `ErrEmptyTitle`;
- нормализация выполняется до проверки длины и пустой строки.

<details>
  <summary>Подсказка</summary>

```go
func normalizeTitle(title string) string {
	return strings.TrimSpace(title)
}
```

В `Rename` присвойте результат обратно: `title = normalizeTitle(title)`.
</details>

<details>
  <summary>Решение</summary>

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
</details>

## Задание 2. Добавьте дедлайн

Добавьте в `Task` поле:

```go
DueAt time.Time `json:"due_at"`
```

В `main` разберите строку `2026-12-31 18:00` через `time.Parse`, создайте задачу с этим дедлайном и выведите его в формате `31.12.2026 18:00`.

**Критерии проверки:**

- пакет `time` импортирован там, где объявлено поле `DueAt`;
- используется layout `"2006-01-02 15:04"` для Parse;
- ошибка Parse обработана;
- для Format используется layout `"02.01.2006 15:04"`;
- дедлайн не равен нулевому времени.

<details>
  <summary>Подсказка</summary>

```go
const inputLayout = "2006-01-02 15:04"
dueAt, err := time.Parse(inputLayout, "2026-12-31 18:00")
```
</details>

<details>
  <summary>Решение</summary>

```go
const inputLayout = "2006-01-02 15:04"
const outputLayout = "02.01.2006 15:04"

dueAt, err := time.Parse(inputLayout, "2026-12-31 18:00")
if err != nil {
	fmt.Println("Некорректный дедлайн:", err)
	return
}

currentTask := task.Task{
	ID:       1,
	Title:    "Купить молоко",
	Priority: 2,
	DueAt:    dueAt,
}

fmt.Println(currentTask.DueAt.Format(outputLayout))
```
</details>

## Задание 3. Проверьте срок задачи

Добавьте к `Task` методы:

```go
func (task Task) IsOverdue(now time.Time) bool
func (task Task) Remaining(now time.Time) time.Duration
```

Задача без дедлайна не должна считаться просроченной, а `Remaining` для неё должен вернуть `0`. Для задачи с дедлайном в будущем выведите оставшееся время, округлённое до минуты.

**Критерии проверки:**

- `IsOverdue` проверяет `DueAt.IsZero()`;
- для сравнения используется `now.After(task.DueAt)`;
- `Remaining` использует `task.DueAt.Sub(now)`;
- методы принимают `now` параметром;
- результат выводится через `Round(time.Minute)`.

<details>
  <summary>Подсказка</summary>

```go
if task.DueAt.IsZero() {
	return false
}
```
</details>

<details>
  <summary>Решение</summary>

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
</details>

## Задание 4. Сформируйте список названий

Пользователь передал строку `дом, покупки, срочно`. Разделите её на теги, удалите пробелы по краям каждого тега, приведите к нижнему регистру и соберите обратно через `, `.

**Критерии проверки:**

- используется `strings.Split`;
- в цикле применяются `TrimSpace` и `ToLower`;
- итог собирается через `strings.Join`;
- результат равен `дом, покупки, срочно`;
- исходные значения обрабатываются как слайс строк.

<details>
  <summary>Подсказка</summary>

```go
tags := strings.Split(rawTags, ",")

for index, tag := range tags {
	tags[index] = strings.ToLower(strings.TrimSpace(tag))
}
```
</details>

<details>
  <summary>Решение</summary>

```go
rawTags := "дом, покупки, срочно"
tags := strings.Split(rawTags, ",")

for index, tag := range tags {
	tags[index] = strings.ToLower(strings.TrimSpace(tag))
}

fmt.Println(strings.Join(tags, ", "))
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- нормализовать пользовательский текст через `TrimSpace`;
- выполнить поиск без учёта регистра;
- разделить и собрать строковый список;
- создать и отформатировать `time.Time`;
- разобрать дату через `time.Parse`;
- проверить дедлайн и вычислить оставшееся время;
- хранить `time.Time` в JSON-модели задачи.

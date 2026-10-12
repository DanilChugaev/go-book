---
prev: /guide/time/tests.md
next: /guide/time/best-practices.md
---

# Задания: дедлайн задачи

Task Manager API получает срок выполнения задачи. Добавим `DueAt`, разберём его из строки и определим, просрочена ли задача.

## Задание 1. Добавьте дедлайн

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

## Задание 2. Проверьте срок задачи

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

## Задание 3. Отобразите статус дедлайна

Создайте задачу без дедлайна, задачу с прошлым сроком и задачу со сроком через 90 минут. Для каждой выведите один из статусов:

- `Дедлайн не установлен`;
- `Срок задачи истёк`;
- `Осталось: <длительность>`.

**Критерии проверки:**

- сначала проверяется `DueAt.IsZero()`;
- затем используется `IsOverdue(now)`;
- для будущего дедлайна вызывается `Remaining(now).Round(time.Minute)`;
- `now` создаётся один раз и передаётся всем проверкам.

<details>
  <summary>Подсказка</summary>

```go
if currentTask.DueAt.IsZero() {
	// ...
} else if currentTask.IsOverdue(now) {
	// ...
} else {
	// ...
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- создать и отформатировать `time.Time`;
- разобрать дату через `time.Parse`;
- проверить дедлайн и вычислить оставшееся время;
- хранить `time.Time` в JSON-модели задачи;
- объяснить, зачем API использует UTC.

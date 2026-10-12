---
prev: /guide/json/tests.md
next: /guide/json/best-practices.md
---

# Практика: сохранение задач в JSON

Теперь Task Manager API сохраняет не только текстовое представление, но и сами структуры задач. После загрузки данные снова доступны как `[]task.Task`.

## Задание 1. Добавьте JSON-теги

В пакете `internal/task` добавьте JSON-теги полям `Task`:

```go
ID        int    `json:"id"`
Title     string `json:"title"`
Priority  int    `json:"priority"`
Completed bool   `json:"completed"`
```

Создайте задачу в `main.go`, преобразуйте её через `json.MarshalIndent` и выведите JSON.

**Критерии проверки:**

- у всех четырёх полей есть JSON-теги в нижнем регистре;
- используется `json.MarshalIndent`;
- ошибка сериализации проверяется;
- вывод содержит ключи `id`, `title`, `priority`, `completed`.

<details>
  <summary>Подсказка</summary>

```go
data, err := json.MarshalIndent(currentTask, "", "  ")
```
</details>

<details>
  <summary>Решение</summary>

`internal/task/task.go`:

```go
type Task struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Priority  int    `json:"priority"`
	Completed bool   `json:"completed"`
}
```

`main.go`:

```go
data, err := json.MarshalIndent(currentTask, "", "  ")
if err != nil {
	fmt.Println("Не удалось сериализовать задачу:", err)
	return
}

fmt.Println(string(data))
```
</details>

## Задание 2. Сохраните список задач

Напишите функцию:

```go
func saveTasks(path string, tasks []task.Task) error
```

Она должна сериализовать список через `json.MarshalIndent` и записать его в `tasks.json` через `os.WriteFile`.

**Критерии проверки:**

- функция принимает `[]task.Task` и возвращает `error`;
- JSON имеет отступы;
- ошибки сериализации и записи получают разный контекст через `%w`;
- файл `tasks.json` создаётся после успешного вызова;
- JSON содержит массив задач.

<details>
  <summary>Подсказка</summary>

Сначала выполните `json.MarshalIndent`, а затем передайте полученные `data` в `os.WriteFile`.
</details>

<details>
  <summary>Решение</summary>

```go
func saveTasks(path string, tasks []task.Task) error {
	data, err := json.MarshalIndent(tasks, "", "  ")
	if err != nil {
		return fmt.Errorf("не удалось сериализовать задачи: %w", err)
	}

	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("не удалось сохранить задачи: %w", err)
	}

	return nil
}
```
</details>

## Задание 3. Загрузите список задач

Напишите функцию:

```go
func loadTasks(path string) ([]task.Task, error)
```

Она должна прочитать `tasks.json` через `os.ReadFile`, распарсить JSON в `[]task.Task` и вернуть загруженные задачи.

**Критерии проверки:**

- функция читает файл до вызова `json.Unmarshal`;
- `json.Unmarshal` получает `&tasks`;
- ошибка чтения и ошибка JSON получают разные сообщения;
- при ошибке возвращается `nil` и ненулевой `error`;
- успешный результат имеет тип `[]task.Task`.

<details>
  <summary>Подсказка</summary>

```go
var tasks []task.Task
if err := json.Unmarshal(data, &tasks); err != nil {
	// ...
}
```
</details>

<details>
  <summary>Решение</summary>

```go
func loadTasks(path string) ([]task.Task, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("не удалось прочитать задачи: %w", err)
	}

	var tasks []task.Task
	if err := json.Unmarshal(data, &tasks); err != nil {
		return nil, fmt.Errorf("не удалось разобрать JSON задач: %w", err)
	}

	return tasks, nil
}
```
</details>

## Задание 4. Проверьте полный цикл

Создайте две задачи, сохраните их в `tasks.json`, загрузите обратно в новую переменную `loadedTasks` и выведите `Summary()` каждой загруженной задачи.

**Критерии проверки:**

- сохранение выполняется до загрузки;
- каждая операция проверяет ошибку и завершает `main` при неудаче;
- `loadedTasks` получен через `loadTasks`;
- число и данные загруженных задач совпадают с сохранёнными;
- программа работает после удаления старого `tasks.json`.

<details>
  <summary>Подсказка</summary>

```go
if err := saveTasks("tasks.json", tasks); err != nil {
	fmt.Println(err)
	return
}

loadedTasks, err := loadTasks("tasks.json")
if err != nil {
	fmt.Println(err)
	return
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- добавить JSON-тег к полю структуры;
- преобразовать значение в JSON через `json.MarshalIndent`;
- восстановить слайс через `json.Unmarshal`;
- объяснить, почему `Unmarshal` получает указатель;
- сохранить и загрузить `[]task.Task` из JSON-файла;
- отличить синтаксическую JSON-ошибку от бизнес-валидации задачи.

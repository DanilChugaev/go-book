---
prev: /guide/file-io/practice.md
next: /guide/json/tests.md
---

# JSON и сериализация

## Цель урока

Научиться преобразовывать структуры Go в JSON и обратно, управлять именами полей через теги и сохранять список задач в `tasks.json` с последующей загрузкой.

Текстовый экспорт из прошлой главы удобен для чтения человеком, но программа не может надёжно восстановить из него структуры `Task`. JSON хранит данные в стандартном структурированном формате, понятном Go, HTTP API и многим другим системам.

## Что такое JSON

JSON (JavaScript Object Notation) — текстовый формат обмена данными. Объекты записывают в фигурных скобках, массивы — в квадратных:

```json
{
  "id": 1,
  "title": "Купить молоко",
  "priority": 2,
  "completed": false
}
```

В Go JSON обрабатывает стандартный пакет `encoding/json`.

## Сериализация и десериализация

**Сериализация** превращает значение Go в последовательность байтов JSON:

```go
data, err := json.Marshal(task)
```

**Десериализация** восстанавливает значение Go из JSON-байтов:

```go
var task Task
err := json.Unmarshal(data, &task)
```

`json.Marshal` возвращает `[]byte`, потому что JSON — текстовые данные в байтовом виде. Для вывода в терминал преобразуйте результат в строку:

```go
fmt.Println(string(data))
```

## Сериализация структуры

Для начала возьмём знакомую структуру:

```go
type Task struct {
	ID        int
	Title     string
	Priority  int
	Completed bool
}
```

Поля с заглавной буквы экспортируются, поэтому `encoding/json` может прочитать и записать их:

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Task struct {
	ID        int
	Title     string
	Priority  int
	Completed bool
}

func main() {
	task := Task{ID: 1, Title: "Купить молоко", Priority: 2}

	data, err := json.Marshal(task)
	if err != nil {
		fmt.Println("Не удалось сериализовать задачу:", err)
		return
	}

	fmt.Println(string(data))
}
```

Вывод будет похож на:

```json
{"ID":1,"Title":"Купить молоко","Priority":2,"Completed":false}
```

Имена ключей сейчас совпадают с именами Go-полей. Обычно для API и файлов используют нижний регистр, поэтому добавляют JSON-теги.

## JSON-теги

Тег указывается после типа поля в обратных кавычках:

```go
type Task struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Priority  int    `json:"priority"`
	Completed bool   `json:"completed"`
}
```

Теперь JSON станет таким:

```json
{"id":1,"title":"Купить молоко","priority":2,"completed":false}
```

Тег меняет имя поля только во внешнем представлении JSON. В Go оно по-прежнему используется как `task.Title`.

```go
task.Title = "Купить продукты"
```

::: tip Поля должны быть экспортируемыми
`encoding/json` игнорирует поля со строчной буквы. Например, поле `title string` не попадёт в JSON автоматически. Для модели, которую нужно сохранять или отдавать через API, используйте экспортируемые поля и JSON-теги.
:::

## Красивый JSON: `json.MarshalIndent`

`json.Marshal` создаёт компактный JSON в одну строку. Для файла, который читает человек, удобнее `json.MarshalIndent`:

```go
data, err := json.MarshalIndent(tasks, "", "  ")
```

Первый строковый аргумент — префикс каждой строки, второй — отступ одного уровня. Обычно используют пустой префикс и два пробела.

Пример результата:

```json
[
  {
    "id": 1,
    "title": "Купить молоко",
    "priority": 2,
    "completed": false
  }
]
```

## Десериализация: `json.Unmarshal`

`json.Unmarshal` получает JSON-байты и указатель на место, куда нужно записать результат:

```go
data := []byte(`{"id":1,"title":"Купить молоко","priority":2,"completed":false}`)

var task Task
if err := json.Unmarshal(data, &task); err != nil {
	fmt.Println("Некорректный JSON:", err)
	return
}

fmt.Println(task.Title) // Купить молоко
```

Почему нужен `&task`? `Unmarshal` должен изменить переменную `task`, а значит получает её адрес.

Для массива JSON создайте слайс:

```go
var tasks []Task
if err := json.Unmarshal(data, &tasks); err != nil {
	return err
}
```

### Что делает Unmarshal с данными

- отсутствующее в JSON поле остаётся с нулевым значением;
- неизвестные поля JSON по умолчанию игнорируются;
- несовместимый тип вызывает ошибку, например строка вместо числа для `priority`.

JSON-декодирование проверяет формат, но не бизнес-правила. JSON с `"priority": 10` корректен синтаксически, однако для нашей модели приоритет всё ещё недопустим. После загрузки задачи нужно валидировать теми же правилами, что и данные из другого источника.

## Пустой и nil-слайс

Есть тонкое различие:

```go
var nilTasks []Task
emptyTasks := []Task{}

nilJSON, _ := json.Marshal(nilTasks)
emptyJSON, _ := json.Marshal(emptyTasks)

fmt.Println(string(nilJSON))   // null
fmt.Println(string(emptyJSON)) // []
```

Для списка задач в JSON обычно ожидают `[]`, а не `null`. Если экспортируете пустой список, создайте пустой слайс: `tasks := []task.Task{}`.

## Сохранение задач в JSON-файл

Объединим JSON и файловый ввод-вывод. Сначала сериализуем слайс, затем записываем байты:

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

Ошибки оборачиваются отдельно: так вызывающий код понимает, проблема возникла на этапе JSON или записи файла.

## Загрузка задач из JSON-файла

Сначала прочитаем байты, затем десериализуем их в слайс:

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

Функция возвращает сразу два результата: список и ошибку. Если чтение или JSON-декодирование не удалось, список равен `nil`, а ошибка объясняет причину.

## Полный пример Task Manager API

Предположим, что тип `Task` с JSON-тегами расположен в `internal/task/task.go`:

```go
package task

type Task struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Priority  int    `json:"priority"`
	Completed bool   `json:"completed"`
}
```

В `main.go`:

```go
package main

import (
	"encoding/json"
	"fmt"
	"os"

	"example.com/task-manager/internal/task"
)

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

func main() {
	tasks := []task.Task{
		{ID: 1, Title: "Купить молоко", Priority: 2},
		{ID: 2, Title: "Оплатить интернет", Priority: 3},
	}

	const storagePath = "tasks.json"

	if err := saveTasks(storagePath, tasks); err != nil {
		fmt.Println("Ошибка сохранения:", err)
		return
	}

	loadedTasks, err := loadTasks(storagePath)
	if err != nil {
		fmt.Println("Ошибка загрузки:", err)
		return
	}

	for _, currentTask := range loadedTasks {
		fmt.Println(currentTask.Summary())
	}
}
```

## Частые ошибки

### Передать значение вместо адреса в Unmarshal

```go
var tasks []Task
// json.Unmarshal(data, tasks) // ошибка: нужен указатель
json.Unmarshal(data, &tasks)
```

`Unmarshal` должен записать загруженные данные в переменную.

### Игнорирование ошибки JSON

```go
data, _ := json.Marshal(tasks)
```

Не игнорируйте ошибку. Текущая структура может сериализоваться без проблем, но позже в неё могут появиться поля, которые JSON не поддерживает.

### Ожидание валидации от Unmarshal

```json
{"id":1,"title":"","priority":10,"completed":false}
```

Это корректный JSON, но некорректная задача. После загрузки применяйте `IsValid()` или другую бизнес-валидацию.

### Запись `nil`-слайса, когда нужен `[]`

`json.Marshal(nilTasks)` даст `null`. Для пустого списка создайте `[]task.Task{}`.

## Дальше

Закрепите сохранение и загрузку задач. После этого начнём изучать конкурентный код: goroutine, каналы и безопасную координацию работы.

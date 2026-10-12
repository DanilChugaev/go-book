---
prev: /guide/packages-and-modules/practice.md
next: /guide/file-io/tests.md
---

# Файлы и ввод-вывод

## Цель урока

Научиться записывать текст в файл, читать его обратно, безопасно открывать и закрывать файлы, а также добавлять контекст к ошибкам файловой системы.

В Task Manager API мы пока не сохраняем сами структуры задач. Сначала сделаем текстовый экспорт их кратких описаний в файл `tasks.txt`. В следующей главе JSON позволит сохранять данные так, чтобы программа могла восстановить их как задачи.

## Файлы и ошибки

Работа с файлом зависит от файловой системы: файл может отсутствовать, путь может быть неверным, а прав на запись может не хватать. Поэтому почти все функции из `os` возвращают `error`.

```go
content, err := os.ReadFile("tasks.txt")
if err != nil {
	return fmt.Errorf("не удалось прочитать tasks.txt: %w", err)
}

fmt.Println(string(content))
```

`os.ReadFile` возвращает содержимое как `[]byte`. Для текста его обычно преобразуют в `string`.

## Быстрая запись: `os.WriteFile`

Для небольшого текста проще всего использовать `os.WriteFile`:

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	content := "Купить молоко\nОплатить интернет\n"

	err := os.WriteFile("tasks.txt", []byte(content), 0o644)
	if err != nil {
		fmt.Println("Не удалось записать файл:", err)
		return
	}

	fmt.Println("Файл сохранён")
}
```

Аргументы `os.WriteFile`:

1. путь к файлу;
2. данные в байтах;
3. права доступа для **нового** файла.

Запись создаёт файл, если его нет. Если файл уже существует, его предыдущее содержимое будет заменено. На Unix-подобных системах `0o644` обычно означает: владелец может читать и писать, остальные — только читать. В Windows этот аргумент не влияет на права так же, но его всё равно передают для переносимости Go-кода.

::: warning WriteFile не добавляет текст в конец
Повторный вызов `os.WriteFile` по тому же пути перезапишет файл. Для добавления записей в конец потребуется открыть файл с особыми флагами; этот сценарий рассмотрим позднее, когда появится логирование.
:::

## Чтение файла: `os.ReadFile`

Прочитаем созданный файл:

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	content, err := os.ReadFile("tasks.txt")
	if err != nil {
		fmt.Println("Не удалось прочитать файл:", err)
		return
	}

	fmt.Print(string(content))
}
```

`os.ReadFile` подходит для небольших файлов конфигурации, экспортов и учебных данных. Не используйте его для очень больших файлов: он загружает всё содержимое в память.

Если файл не существует, обычно вернётся ошибка. Её можно показать пользователю или обработать отдельно через `errors.Is(err, os.ErrNotExist)`:

```go
content, err := os.ReadFile("tasks.txt")
if errors.Is(err, os.ErrNotExist) {
	fmt.Println("Экспорт ещё не создан")
	return
}

if err != nil {
	fmt.Println("Не удалось прочитать файл:", err)
	return
}

fmt.Print(string(content))
```

## Открытие файла и `defer Close`

`os.ReadFile` сам открывает и закрывает файл. Но иногда нужно управлять файловым объектом вручную: например, читать данные через `io.Reader` или записывать по частям.

```go
file, err := os.Open("tasks.txt")
if err != nil {
	return fmt.Errorf("не удалось открыть tasks.txt: %w", err)
}
defer file.Close()
```

После успешного `os.Open` файл нужно закрыть. `defer` откладывает вызов `file.Close()` до завершения текущей функции — даже если мы выйдем через `return` дальше по коду.

```go
func printExport(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("не удалось открыть экспорт: %w", err)
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("не удалось прочитать экспорт: %w", err)
	}

	fmt.Print(string(content))
	return nil
}
```

В этом примере:

- `os.Open` возвращает `*os.File`;
- `defer file.Close()` освобождает ресурс;
- `io.ReadAll` читает всё из уже открытого файла.

Для простого чтения используйте `os.ReadFile`. Пример с `os.Open` и `io.ReadAll` нужен, чтобы понять общий паттерн владения ресурсом: **открыл — запланируй закрытие сразу после успешной проверки ошибки**.

## Создание файла: `os.Create`

`os.Create` создаёт файл для записи и возвращает `*os.File`:

```go
file, err := os.Create("tasks.txt")
if err != nil {
	return fmt.Errorf("не удалось создать файл: %w", err)
}
defer file.Close()

if _, err := file.WriteString("Купить молоко\n"); err != nil {
	return fmt.Errorf("не удалось записать экспорт: %w", err)
}
```

Если файл уже существует, `os.Create` очистит его содержимое. Для единой короткой записи по-прежнему предпочитайте `os.WriteFile`: там меньше кода и меньше риска забыть закрыть файл.

## Пути к файлам

Относительный путь считается от текущей рабочей директории. Если программу запускают из корня Task Manager API командой:

```bash
go run .
```

то путь `tasks.txt` означает файл рядом с `go.mod` и `main.go`:

```text
task-manager/
├── go.mod
├── main.go
└── tasks.txt
```

Не полагайтесь на текущую директорию в большом приложении без необходимости. Когда появятся конфигурация и HTTP-сервер, путь к хранилищу будет задаваться явно. Пока достаточно запускать программу из корня модуля.

## Экспорт Task Manager API

Сохраним краткие описания задач в текстовый файл. Функция получает слайс задач, формирует текст и записывает его:

```go
func exportTasks(path string, tasks []task.Task) error {
	var content string

	for _, currentTask := range tasks {
		content += currentTask.Summary() + "\n"
	}

	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		return fmt.Errorf("не удалось сохранить экспорт задач: %w", err)
	}

	return nil
}
```

Пока конкатенация строк подходит, потому что экспорт маленький. Для больших объёмов текста позже рассмотрим более подходящие инструменты.

Полный пример с пакетом `internal/task`:

```go
package main

import (
	"errors"
	"fmt"
	"os"

	"example.com/task-manager/internal/task"
)

func exportTasks(path string, tasks []task.Task) error {
	var content string

	for _, currentTask := range tasks {
		content += currentTask.Summary() + "\n"
	}

	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		return fmt.Errorf("не удалось сохранить экспорт задач: %w", err)
	}

	return nil
}

func printExport(path string) error {
	content, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("файл экспорта ещё не создан: %w", err)
	}
	if err != nil {
		return fmt.Errorf("не удалось прочитать экспорт: %w", err)
	}

	fmt.Print(string(content))
	return nil
}

func main() {
	tasks := []task.Task{
		{ID: 1, Title: "Купить молоко", Priority: 2},
		{ID: 2, Title: "Оплатить интернет", Priority: 3},
	}

	const exportPath = "tasks.txt"

	if err := exportTasks(exportPath, tasks); err != nil {
		fmt.Println("Ошибка экспорта:", err)
		return
	}

	if err := printExport(exportPath); err != nil {
		fmt.Println("Ошибка чтения:", err)
	}
}
```

## Частые ошибки

### Игнорирование ошибки записи

```go
os.WriteFile("tasks.txt", []byte("данные"), 0o644)
```

Так компилятор не позволит проигнорировать возвращаемую ошибку. Обработайте её:

```go
if err := os.WriteFile("tasks.txt", []byte("данные"), 0o644); err != nil {
	return err
}
```

### Забытый `Close`

```go
file, err := os.Open("tasks.txt")
if err != nil {
	return err
}

// Файл не закрыт.
```

Сразу после успешного открытия добавьте `defer file.Close()`.

### Ожидание, что файл добавит новые данные

```go
os.WriteFile("tasks.txt", []byte("Новая строка\n"), 0o644)
```

Этот вызов заменяет старое содержимое. Не используйте его для журнала операций.

### Чтение несуществующего файла без обработки

Первый запуск программы может произойти до создания экспорта. Для такой ситуации можно показать понятное сообщение, проверив `errors.Is(err, os.ErrNotExist)`.

## Дальше

Закрепите текстовый экспорт задач. Следующая глава — JSON и сериализация: она позволит сохранять структуру данных, а не только готовый текст для человека.

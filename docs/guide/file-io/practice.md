---
prev: /guide/file-io/tests.md
next: /guide/file-io/best-practices.md
---

# Задания: текстовый экспорт задач

В этой практике Task Manager API создаёт текстовый файл `tasks.txt` со списком задач, а затем читает его обратно. Это экспорт для человека; в следующей главе JSON позволит восстановить сами структуры Task.

## Задание 1. Запишите простой экспорт

Создайте переменную `content` со строкой из двух названий задач, каждое с новой строки. Запишите её в `tasks.txt` через `os.WriteFile`. Сообщите об ошибке, если запись не удалась.

**Критерии проверки:**

- импортирован пакет `os`;
- строка преобразована в `[]byte`;
- используется `os.WriteFile("tasks.txt", ..., 0o644)`;
- ошибка проверяется через `if err != nil`;
- после запуска рядом с программой появляется файл `tasks.txt`.

<details>
  <summary>Подсказка</summary>

```go
content := "Купить молоко\nОплатить интернет\n"
err := os.WriteFile("tasks.txt", []byte(content), 0o644)
```
</details>

## Задание 5. Протестируйте текстовый экспорт

Создайте `export_test.go` рядом с файлом, где находится `exportTasks`. Напишите `TestExportTasks`: передайте путь внутри `t.TempDir()`, экспортируйте одну или две задачи, затем прочитайте файл через `os.ReadFile` и сравните текст с ожидаемым.

**Критерии проверки:**

- тестовый файл заканчивается на `_test.go`;
- путь собирается через `filepath.Join(t.TempDir(), "tasks.txt")`;
- тест не создаёт файл в рабочей папке проекта;
- ошибка `exportTasks` проверяется через `t.Fatal` или `t.Fatalf`;
- содержимое файла проверяется целиком;
- `go test ./...` проходит успешно.

<details>
  <summary>Подсказка</summary>

```go
path := filepath.Join(t.TempDir(), "tasks.txt")

if err := exportTasks(path, tasks); err != nil {
	t.Fatalf("exportTasks вернул ошибку: %v", err)
}
```
</details>

<details>
  <summary>Решение</summary>

```go
func TestExportTasks(t *testing.T) {
	path := filepath.Join(t.TempDir(), "tasks.txt")
	tasks := []task.Task{
		{ID: 1, Title: "Купить молоко", Priority: 2},
	}

	if err := exportTasks(path, tasks); err != nil {
		t.Fatalf("exportTasks вернул ошибку: %v", err)
	}

	content, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("не удалось прочитать экспорт: %v", err)
	}

	want := "1. Купить молоко | приоритет: 2 | выполнена: false\n"
	if string(content) != want {
		t.Errorf("экспорт = %q, ожидалось %q", content, want)
	}
}
```

Для теста нужны импорты `os`, `path/filepath`, `testing` и пакет с `Task`.
</details>

<details>
  <summary>Решение</summary>

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	content := "Купить молоко\nОплатить интернет\n"

	if err := os.WriteFile("tasks.txt", []byte(content), 0o644); err != nil {
		fmt.Println("Не удалось записать файл:", err)
		return
	}

	fmt.Println("Экспорт сохранён")
}
```
</details>

## Задание 2. Прочитайте экспорт

Прочитайте `tasks.txt` через `os.ReadFile` и выведите содержимое. Если файл отсутствует, сообщите `Экспорт ещё не создан`. Другие ошибки выведите как есть.

**Критерии проверки:**

- импортированы `errors`, `fmt` и `os`;
- используется `os.ReadFile`;
- отсутствие файла проверяется через `errors.Is(err, os.ErrNotExist)`;
- успешное содержимое выводится через `fmt.Print(string(content))`.

<details>
  <summary>Подсказка</summary>

Сначала обработайте отсутствие файла, затем остальные ошибки:

```go
if errors.Is(err, os.ErrNotExist) {
	fmt.Println("Экспорт ещё не создан")
	return
}

if err != nil {
	// ...
}
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import (
	"errors"
	"fmt"
	"os"
)

func main() {
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
}
```
</details>

## Задание 3. Откройте и прочитайте файл вручную

Напишите функцию `readExport(path string) error`. Она должна открыть файл через `os.Open`, отложить `Close`, прочитать содержимое через `io.ReadAll` и вывести его.

**Критерии проверки:**

- функция возвращает `error`;
- `os.Open` проверяется на ошибку;
- после успешного открытия сразу вызывается `defer file.Close()`;
- `io.ReadAll(file)` проверяется на ошибку;
- ошибки получают контекст через `fmt.Errorf` и `%w`.

<details>
  <summary>Подсказка</summary>

```go
file, err := os.Open(path)
if err != nil {
	return fmt.Errorf("не удалось открыть экспорт: %w", err)
}
defer file.Close()
```
</details>

<details>
  <summary>Решение</summary>

```go
func readExport(path string) error {
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

Для этого решения нужны импорты `fmt`, `io` и `os`.
</details>

## Задание 4. Экспортируйте Task

В проекте из прошлой главы создайте в `main.go` функцию:

```go
func exportTasks(path string, tasks []task.Task) error
```

Она должна сохранить `Summary()` каждой задачи в отдельной строке файла `tasks.txt`. После успешной записи прочитайте файл и выведите экспорт.

**Критерии проверки:**

- функция принимает `[]task.Task`;
- каждая задача добавляет в экспорт `currentTask.Summary() + "\n"`;
- используется `strings.Builder`;
- `os.WriteFile` возвращает ошибку с контекстом;
- `main` не продолжает чтение, если экспорт не записался;
- файл содержит строку summary для каждой задачи.

<details>
  <summary>Подсказка</summary>

Вспомните импорт из предыдущей главы:

```go
"example.com/task-manager/internal/task"
```

Для формирования текста используйте `strings.Builder`: добавляйте summary каждой задачи через `WriteString`.
</details>

<details>
  <summary>Возможное решение</summary>

```go
func exportTasks(path string, tasks []task.Task) error {
	var builder strings.Builder

	for _, currentTask := range tasks {
		builder.WriteString(currentTask.Summary())
		builder.WriteString("\n")
	}

	if err := os.WriteFile(path, []byte(builder.String()), 0o644); err != nil {
		return fmt.Errorf("не удалось сохранить экспорт задач: %w", err)
	}

	return nil
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- записать небольшой текст через `os.WriteFile`;
- прочитать его через `os.ReadFile`;
- обработать `os.ErrNotExist`;
- объяснить роль `defer file.Close()`;
- открыть файл через `os.Open` и прочитать его через `io.ReadAll`;
- экспортировать summary задач в текстовый файл.
- проверить экспорт через `t.TempDir` без создания файлов в проекте.

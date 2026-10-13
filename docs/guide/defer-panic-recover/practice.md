---
prev: /guide/defer-panic-recover/tests.md
next: /guide/defer-panic-recover/best-practices.md
---

# Задания: безопасная работа с файлами

В этой практике используем `defer` для гарантированного закрытия файлов. Обычные проблемы файловой системы по-прежнему возвращаем как `error`, а не через `panic`.

## Задание 1. Закройте файл после чтения

Напишите функцию:

```go
func readTextExport(path string) error
```

Она должна открыть `tasks.txt`, отложить `Close`, прочитать данные через `io.ReadAll` и вывести их в терминал.

**Критерии проверки:**

- `os.Open` проверяется на ошибку;
- `defer file.Close()` находится после проверки ошибки;
- `io.ReadAll(file)` проверяется на ошибку;
- ошибки получают контекст через `fmt.Errorf` и `%w`;
- файл закрывается при успешном чтении и при раннем `return`.

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
package main

import (
	"fmt"
	"io"
	"os"
)

func readTextExport(path string) error {
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
</details>

## Задание 2. Верните ошибку закрытия

Напишите функцию:

```go
func writeTextExport(path, content string) (err error)
```

Она создаёт файл, записывает текст и корректно возвращает ошибку `Close`, если запись прошла успешно, но закрыть файл не удалось.

**Критерии проверки:**

- используется именованный результат `err error`;
- файл создаётся через `os.Create`;
- `Close` вызывается в отложенной анонимной функции;
- ошибка `Close` заменяет результат только если `err == nil`;
- ошибка записи получает контекст и не теряется.

<details>
  <summary>Подсказка</summary>

```go
defer func() {
	closeErr := file.Close()
	if err == nil && closeErr != nil {
		err = fmt.Errorf("не удалось закрыть экспорт: %w", closeErr)
	}
}()
```
</details>

<details>
  <summary>Решение</summary>

```go
func writeTextExport(path, content string) (err error) {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("не удалось создать экспорт: %w", err)
	}

	defer func() {
		closeErr := file.Close()
		if err == nil && closeErr != nil {
			err = fmt.Errorf("не удалось закрыть экспорт: %w", closeErr)
		}
	}()

	if _, err := file.WriteString(content); err != nil {
		return fmt.Errorf("не удалось записать экспорт: %w", err)
	}

	return nil
}
```
</details>

## Задание 3. Используйте defer в TaskStore

Вспомните `TaskStore`. Добавьте или перепишите метод `Complete`, чтобы он использовал `defer store.mu.Unlock()` сразу после `store.mu.Lock()`.

**Критерии проверки:**

- мьютекс блокируется до доступа к map;
- `defer store.mu.Unlock()` расположен сразу после `Lock`;
- отсутствующая задача возвращает ошибку без ручного `Unlock`;
- успешное изменение также освобождает мьютекс.

<details>
  <summary>Подсказка</summary>

```go
store.mu.Lock()
defer store.mu.Unlock()
```
</details>

<details>
  <summary>Решение</summary>

```go
func (store *TaskStore) Complete(id int) error {
	store.mu.Lock()
	defer store.mu.Unlock()

	currentTask, exists := store.tasks[id]
	if !exists {
		return ErrTaskNotFound
	}

	currentTask.Complete()
	store.tasks[id] = currentTask
	return nil
}
```
</details>

## Задание 4. Локально перехватите panic

Напишите функцию `safeDemo()`, которая намеренно вызывает `panic("ошибка демонстрации")`, но перехватывает её в отложенной функции и выводит сообщение `Перехвачена panic: ошибка демонстрации`.

Это демонстрация механики `recover`. Не применяйте этот подход для `Rename`, файловых ошибок или валидации задач.

**Критерии проверки:**

- `recover` находится внутри `defer func() { ... }()`;
- вызов `panic` находится в той же функции;
- программа продолжает работу после `safeDemo()`;
- `recover` не используется для обычного `error`.

<details>
  <summary>Подсказка</summary>

```go
defer func() {
	if recovered := recover(); recovered != nil {
		fmt.Println("Перехвачена panic:", recovered)
	}
}()
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- отложить закрытие ресурса через `defer`;
- объяснить порядок нескольких defer;
- не потерять важную ошибку `Close`;
- отличить ожидаемый `error` от аварийной panic;
- использовать `recover` только внутри deferred-функции той же goroutine;
- безопасно освобождать mutex через `defer Unlock`.

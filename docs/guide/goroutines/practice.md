---
prev: /guide/goroutines/tests.md
---

# Практика: параллельный экспорт

Task Manager API уже умеет создавать текстовый и JSON-экспорт. Теперь запустим эти независимые операции параллельно и дождёмся завершения обеих.

## Задание 1. Дождитесь двух работ

Напишите программу с двумя goroutine. Первая выводит `Текстовый экспорт готов`, вторая — `JSON-экспорт готов`. Используйте `sync.WaitGroup`, чтобы строка `Все экспорты готовы` появилась только после обеих.

**Критерии проверки:**

- импортирован пакет `sync`;
- до запуска есть `wg.Add(2)`;
- каждая goroutine вызывает `defer wg.Done()`;
- `wg.Wait()` находится перед финальным сообщением;
- порядок первых двух сообщений может отличаться.

<details>
  <summary>Подсказка</summary>

```go
var wg sync.WaitGroup
wg.Add(2)

go func() {
	defer wg.Done()
	// первая работа
}()
```
</details>

<details>
  <summary>Решение</summary>

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		fmt.Println("Текстовый экспорт готов")
	}()

	go func() {
		defer wg.Done()
		fmt.Println("JSON-экспорт готов")
	}()

	wg.Wait()
	fmt.Println("Все экспорты готовы")
}
```
</details>

## Задание 2. Вынесите экспорт в функции

Создайте две функции:

```go
func exportText(path string, tasks []task.Task) error
func exportJSON(path string, tasks []task.Task) error
```

Первая записывает summary задач в текстовый файл, вторая сохраняет список через JSON. Можно взять их реализацию из предыдущих глав.

**Критерии проверки:**

- обе функции возвращают `error`;
- текстовый экспорт пишет `tasks.txt`;
- JSON-экспорт пишет `tasks.json`;
- функции не запускают goroutine самостоятельно;
- обе функции можно вызвать последовательно для проверки.

<details>
  <summary>Подсказка</summary>

Goroutine — ответственность вызывающего кода. Функция экспорта должна просто выполнить работу и вернуть ошибку.
</details>

## Задание 3. Запустите оба экспорта параллельно

Напишите функцию:

```go
func saveExports(tasks []task.Task) (error, error)
```

Она должна параллельно вызвать `exportText("tasks.txt", tasks)` и `exportJSON("tasks.json", tasks)`, дождаться обеих операций и вернуть две ошибки.

**Критерии проверки:**

- используется один `sync.WaitGroup`;
- до запуска есть `wg.Add(2)`;
- каждая goroutine записывает ошибку только в свою переменную;
- `wg.Wait()` вызывается до возврата ошибок;
- текстовый и JSON-файлы имеют разные пути.

<details>
  <summary>Подсказка</summary>

```go
var textErr error
var jsonErr error

go func() {
	defer wg.Done()
	textErr = exportText("tasks.txt", tasks)
}()
```
</details>

<details>
  <summary>Решение</summary>

```go
func saveExports(tasks []task.Task) (error, error) {
	var wg sync.WaitGroup
	var textErr error
	var jsonErr error

	wg.Add(2)

	go func() {
		defer wg.Done()
		textErr = exportText("tasks.txt", tasks)
	}()

	go func() {
		defer wg.Done()
		jsonErr = exportJSON("tasks.json", tasks)
	}()

	wg.Wait()
	return textErr, jsonErr
}
```
</details>

## Задание 4. Обработайте результаты

Создайте две задачи, вызовите `saveExports` и обработайте каждую ошибку отдельно. Если обе ошибки равны `nil`, выведите `Все экспорты готовы`.

**Критерии проверки:**

- обе ошибки сохраняются в отдельные переменные;
- ошибки выводятся с понятным контекстом;
- сообщение об успехе выводится только при `textErr == nil && jsonErr == nil`;
- `main` не использует `time.Sleep`.

<details>
  <summary>Подсказка</summary>

```go
textErr, jsonErr := saveExports(tasks)

if textErr != nil {
	fmt.Println("Ошибка текстового экспорта:", textErr)
}
if jsonErr != nil {
	fmt.Println("Ошибка JSON-экспорта:", jsonErr)
}
```
</details>

## Проверьте себя

Перед следующей главой убедитесь, что вы можете:

- запустить функцию через `go`;
- объяснить, почему `main` не ждёт goroutine автоматически;
- правильно использовать `Add`, `Done` и `Wait`;
- объяснить, почему `defer wg.Done()` стоит в начале goroutine;
- дождаться двух независимых экспортов без `time.Sleep`;
- не полагаться на порядок выполнения goroutine.

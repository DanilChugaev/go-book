---
prev: /guide/goroutines/tests.md
next: /guide/goroutines/best-practices.md
---

# Задания: параллельный экспорт

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
func saveExports(tasks []task.Task, textPath, jsonPath string) (error, error)
```

Она должна параллельно вызвать текстовый и JSON-экспорт по переданным путям, дождаться обеих операций и вернуть две ошибки.

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
		textErr = exportText(textPath, tasks)
	}()

	go func() {
		defer wg.Done()
		jsonErr = storage.SaveTasks(jsonPath, tasks)
	}()

	wg.Wait()
	return textErr, jsonErr
}
```
</details>

## Задание 4. Протестируйте параллельных работников

Напишите `startExports`, которая запускает текстовый и JSON-экспорт в goroutine, возвращает канал `<-chan exportResult` и закрывает его после завершения обоих worker через `WaitGroup`. Напишите тест во временной директории: он должен прочитать все результаты из канала и убедиться, что `tasks.txt` и `tasks.json` созданы.

Это первое точечное применение канала. Детально устройство каналов будет разобрано в следующей главе.

**Критерии проверки:**

- `WaitGroup` ожидает ровно две goroutine;
- каждая goroutine отправляет один `exportResult`;
- отдельная goroutine закрывает канал только после `wg.Wait()`;
- тест строит пути через `filepath.Join(t.TempDir(), ...)`;
- тест не использует `time.Sleep`;
- после чтения закрытого канала существуют оба экспортных файла.

<details>
  <summary>Подсказка</summary>

```go
go func() {
	wg.Wait()
	close(results)
}()

for result := range results {
	if result.Err != nil {
		t.Errorf("%s export returned error: %v", result.Name, result.Err)
	}
}
```
</details>

<details>
  <summary>Фрагмент теста</summary>

```go
func TestStartExports(t *testing.T) {
	directory := t.TempDir()
	tasks := []task.Task{{ID: 1, Title: "Купить молоко", Priority: 2}}

	results := startExports(
		tasks,
		filepath.Join(directory, "tasks.txt"),
		filepath.Join(directory, "tasks.json"),
	)

	for result := range results {
		if result.Err != nil {
			t.Errorf("%s export returned error: %v", result.Name, result.Err)
		}
	}
}
```
</details>

## Задание 5. Обработайте результаты

Создайте две задачи, вызовите `saveExports` с двумя путями внутри временной папки и обработайте каждую ошибку отдельно. Если обе ошибки равны `nil`, выведите `Все экспорты готовы`.

**Критерии проверки:**

- обе ошибки сохраняются в отдельные переменные;
- ошибки выводятся с понятным контекстом;
- сообщение об успехе выводится только при `textErr == nil && jsonErr == nil`;
- `main` не использует `time.Sleep`.

<details>
  <summary>Подсказка</summary>

```go
directory := t.TempDir()
textErr, jsonErr := saveExports(
	tasks,
	filepath.Join(directory, "tasks.txt"),
	filepath.Join(directory, "tasks.json"),
)

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
- протестировать фоновых worker без ожидания фиксированное время;
- не полагаться на порядок выполнения goroutine.

## Полный исходный код

Здесь будет размещён полный исходный код к практическим заданиям этой главы.

<ExampleSource
  path="examples/21/goroutines"
  description="заготовка для полного исходного кода практических заданий главы"
/>
